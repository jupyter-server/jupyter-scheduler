import io
import multiprocessing as mp
import os
import shutil
import tarfile
import traceback
from abc import ABC, abstractmethod
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

import dask
import fsspec
import nbconvert
import nbformat
from nbconvert.preprocessors import CellExecutionError, ExecutePreprocessor

from jupyter_scheduler.models import CreateJob, DescribeJob, JobFeature, Status
from jupyter_scheduler.orm import Job, Workflow, WorkflowDefinition, create_session
from jupyter_scheduler.parameterize import add_parameters
from jupyter_scheduler.scheduler import Scheduler
from jupyter_scheduler.utils import get_utc_timestamp
from jupyter_scheduler.workflows import (
    CreateWorkflow,
    DescribeWorkflow,
    DescribeWorkflowDefinition,
)


class ExecutionManager(ABC):
    """Base execution manager.
    Clients are expected to override this class
    to provide concrete implementations of the
    execution manager. At the minimum, subclasses
    should provide implementation of the
    execute, and supported_features methods.
    """

    _model = None
    _db_session = None

    def __init__(
        self,
        db_url: str,
        job_id: str = None,
        workflow_id: str = None,
        workflow_definition_id: str = None,
        root_dir: str = None,
        staging_paths: Dict[str, str] = None,
    ):
        self.job_id = job_id
        self.workflow_id = workflow_id
        self.workflow_definition_id = workflow_definition_id
        self.staging_paths = staging_paths
        self.root_dir = root_dir
        self.db_url = db_url

    @property
    def model(self):
        if self.workflow_id:
            with self.db_session() as session:
                workflow = (
                    session.query(Workflow).filter(Workflow.workflow_id == self.workflow_id).first()
                )
                self._model = DescribeWorkflow.from_orm(workflow)
            return self._model
        if self.workflow_definition_id:
            with self.db_session() as session:
                workflow_definition = (
                    session.query(WorkflowDefinition)
                    .filter(
                        WorkflowDefinition.workflow_definition_id == self.workflow_definition_id
                    )
                    .first()
                )
                self._model = DescribeWorkflowDefinition.from_orm(workflow_definition)
            return self._model
        if self._model is None:
            with self.db_session() as session:
                job = session.query(Job).filter(Job.job_id == self.job_id).first()
                self._model = DescribeJob.from_orm(job)
        return self._model

    @property
    def db_session(self):
        if self._db_session is None:
            self._db_session = create_session(self.db_url)

        return self._db_session

    def process(self):
        """The template method called by the
        Scheduler, backend implementations
        should not override this method.
        """
        self.before_start()
        try:
            self.execute()
        except CellExecutionError as e:
            self.on_failure(e)
        except Exception as e:
            self.on_failure(e)
        else:
            self.on_complete()

    def process_workflow(self):
        self.before_start_workflow()
        try:
            self.execute_workflow()
        except CellExecutionError as e:
            self.on_failure_workflow(e)
        except Exception as e:
            self.on_failure_workflow(e)
        else:
            self.on_complete_workflow()

    @abstractmethod
    def execute(self):
        """Performs notebook execution,
        custom backends are expected to
        add notebook execution logic within
        this method
        """
        pass

    @abstractmethod
    def execute_workflow(self):
        """Performs workflow execution"""
        pass

    @classmethod
    @abstractmethod
    def supported_features(cls) -> Dict[JobFeature, bool]:
        """Returns a configuration of supported features
        by the execution engine. Implementors are expected
        to override this to return a dictionary of supported
        job creation features.
        """
        pass

    @classmethod
    def validate(cls, input_path: str) -> bool:
        """Returns True if notebook has valid metadata to execute, False otherwise"""
        return True

    def before_start(self):
        """Called before start of execute"""
        job = self.model
        with self.db_session() as session:
            session.query(Job).filter(Job.job_id == job.job_id).update(
                {"start_time": get_utc_timestamp(), "status": Status.IN_PROGRESS}
            )
            session.commit()

    def before_start_workflow(self):
        """Called before start of execute"""
        workflow = self.model
        with self.db_session() as session:
            session.query(Workflow).filter(Workflow.workflow_id == workflow.workflow_id).update(
                {"status": Status.IN_PROGRESS}
            )
            session.commit()

    def on_failure(self, e: Exception):
        """Called after failure of execute"""
        job = self.model
        with self.db_session() as session:
            session.query(Job).filter(Job.job_id == job.job_id).update(
                {"status": Status.FAILED, "status_message": str(e)}
            )
            session.commit()

        traceback.print_exc()

    def on_failure_workflow(self, e: Exception):
        """Called after failure of execute"""
        workflow = self.model
        with self.db_session() as session:
            session.query(Workflow).filter(Workflow.workflow_id == workflow.workflow_id).update(
                {"status": Status.FAILED, "status_message": str(e)}
            )
            session.commit()

        traceback.print_exc()

    def on_complete(self):
        """Called after job is completed"""
        job = self.model
        with self.db_session() as session:
            session.query(Job).filter(Job.job_id == job.job_id).update(
                {"status": Status.COMPLETED, "end_time": get_utc_timestamp()}
            )
            session.commit()

    def on_complete_workflow(self):
        workflow = self.model
        with self.db_session() as session:
            session.query(Workflow).filter(Workflow.workflow_id == workflow.workflow_id).update(
                {"status": Status.COMPLETED}
            )
            session.commit()


class DefaultExecutionManager(ExecutionManager):
    """Default execution manager that executes notebooks"""

    def get_tasks_records(self, task_ids: List[str]) -> List[Job]:
        with self.db_session() as session:
            tasks = session.query(Job).filter(Job.job_id.in_(task_ids)).all()

        return tasks

    # @dask.delayed(name="Execute workflow")
    def execute_workflow(self):
        tasks_info: List[Job] = self.get_tasks_records(self.model.tasks)
        tasks = {task.job_id: task for task in tasks_info}

        @lru_cache(maxsize=None)
        def make_task(task_id):
            """Create a delayed object for the given task recursively creating delayed objects for all tasks it depends on"""
            deps = tasks[task_id].depends_on or []

            execute_task_delayed = execute_task(
                job=tasks[task_id],
                root_dir=self.root_dir,
                db_url=self.db_url,
                dependencies=[make_task(dep_id) for dep_id in deps],
            )

            return execute_task_delayed

        final_tasks = [make_task(task_id) for task_id in tasks]
        dask.compute(*final_tasks)

    def execute(self):
        job = self.model

        with open(self.staging_paths["input"], encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        if job.parameters:
            nb = add_parameters(nb, job.parameters)

        staging_dir = os.path.dirname(self.staging_paths["input"])
        ep = ExecutePreprocessor(
            kernel_name=nb.metadata.kernelspec["name"], store_widget_state=True, cwd=staging_dir
        )

        try:
            ep.preprocess(nb, {"metadata": {"path": staging_dir}})
        except CellExecutionError as e:
            raise e
        finally:
            self.add_side_effects_files(staging_dir)
            self.create_output_files(job, nb)

    # @dask.delayed(name="Check for and add side effect files")
    def add_side_effects_files(self, staging_dir: str):
        """Scan for side effect files potentially created after input file execution and update the job's packaged_files with these files"""
        input_notebook = os.path.relpath(self.staging_paths["input"])
        new_files_set = set()
        for root, _, files in os.walk(staging_dir):
            for file in files:
                file_rel_path = os.path.relpath(os.path.join(root, file), staging_dir)
                if file_rel_path != input_notebook:
                    new_files_set.add(file_rel_path)

        if new_files_set:
            with self.db_session() as session:
                current_packaged_files_set = set(
                    session.query(Job.packaged_files).filter(Job.job_id == self.job_id).scalar()
                    or []
                )
                updated_packaged_files = list(current_packaged_files_set.union(new_files_set))
                session.query(Job).filter(Job.job_id == self.job_id).update(
                    {"packaged_files": updated_packaged_files}
                )
                session.commit()

    # @dask.delayed(name="Create output files")
    def create_output_files(self, job: DescribeJob, notebook_node):
        for output_format in job.output_formats:
            cls = nbconvert.get_exporter(output_format)
            output, _ = cls().from_notebook_node(notebook_node)
            with fsspec.open(self.staging_paths[output_format], "w", encoding="utf-8") as f:
                f.write(output)

    def supported_features(cls) -> Dict[JobFeature, bool]:
        return {
            JobFeature.job_name: True,
            JobFeature.output_formats: True,
            JobFeature.job_definition: False,
            JobFeature.idempotency_token: False,
            JobFeature.tags: False,
            JobFeature.email_notifications: False,
            JobFeature.timeout_seconds: False,
            JobFeature.retry_on_timeout: False,
            JobFeature.max_retries: False,
            JobFeature.min_retry_interval_millis: False,
            JobFeature.output_filename_template: False,
            JobFeature.stop_job: True,
            JobFeature.delete_job: True,
        }

    def validate(cls, input_path: str) -> bool:
        with open(input_path, encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)
            try:
                nb.metadata.kernelspec["name"]
            except:
                return False
            else:
                return True


@dask.delayed(name="Execute workflow task")
def execute_task(job: Job, root_dir: str, db_url: str, dependencies: List[str] = []):
    staging_paths = Scheduler.get_staging_paths(DescribeJob.from_orm(job))
    process_job = DefaultExecutionManager(
        job_id=job.job_id,
        staging_paths=staging_paths,
        root_dir=root_dir,
        db_url=db_url,
    ).process
    return process_job()


class ArchivingExecutionManager(DefaultExecutionManager):
    """Execution manager that archives all output files in and under the
    output directory into a single archive file

    Notes
    -----
    Should be used along with :class:`~jupyter_scheduler.scheduler.ArchivingScheduler`
    as the `scheduler_class` during jupyter server start.
    """

    def execute(self):
        job = self.model

        with open(self.staging_paths["input"], encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        if job.parameters:
            nb = add_parameters(nb, job.parameters)

        ep = ExecutePreprocessor(
            kernel_name=nb.metadata.kernelspec["name"],
            store_widget_state=True,
        )

        # Get the directory of the input file
        local_staging_dir = os.path.dirname(self.staging_paths["input"])
        # Directory where side-effect files are written
        run_dir = os.path.join(local_staging_dir, "files")
        os.mkdir(run_dir)

        try:
            ep.preprocess(nb, {"metadata": {"path": run_dir}})
        except CellExecutionError as e:
            pass
        finally:
            # Create all desired output files, other than "input" and "tar.gz"
            for output_format in job.output_formats:
                if output_format == "input" or output_format == "tar.gz":
                    pass
                else:
                    cls = nbconvert.get_exporter(output_format)
                    output, resources = cls().from_notebook_node(nb)
                    f = open(self.staging_paths[output_format], "wb")
                    f.write(bytes(output, "utf-8"))
                    f.close()

            # Create an archive file of the staging directory for this run
            # and everything under it
            fh = io.BytesIO()
            with tarfile.open(fileobj=fh, mode="w:gz") as tar:
                for root, dirs, files in os.walk(local_staging_dir):
                    for file in files:
                        # This flattens the directory structure, so that in the tar
                        # file, output files and side-effect files are side-by-side
                        tar.add(os.path.join(root, file), file)

            archive_filepath = self.staging_paths["tar.gz"]
            with fsspec.open(archive_filepath, "wb") as f:
                f.write(fh.getvalue())

            # Clean up the side-effect files in the run directory
            shutil.rmtree(run_dir)
