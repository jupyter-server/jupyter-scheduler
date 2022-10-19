import os
from multiprocessing import Process
from typing import Dict, Type

import psutil
from jupyter_core.paths import jupyter_data_dir
from jupyter_server.traittypes import TypeFromClasses
from jupyter_server.transutils import _i18n
from jupyter_server.utils import to_os_path
from sqlalchemy import and_, asc, desc, func
from traitlets import Instance
from traitlets import Type as TType
from traitlets import Unicode, default
from traitlets.config import LoggingConfigurable

from jupyter_scheduler.environments import EnvironmentManager
from jupyter_scheduler.exceptions import IdempotencyTokenError, InputUriError
from jupyter_scheduler.models import (
    CountJobsQuery,
    CreateJob,
    CreateJobDefinition,
    DescribeJob,
    DescribeJobDefinition,
    ListJobDefinitionsQuery,
    ListJobDefinitionsResponse,
    ListJobsQuery,
    ListJobsResponse,
    Output,
    SortDirection,
    Status,
    UpdateJob,
    UpdateJobDefinition,
)
from jupyter_scheduler.orm import Job, JobDefinition, create_session
from jupyter_scheduler.utils import create_output_filename


class BaseScheduler(LoggingConfigurable):
    """Base class for schedulers. A default implementation
    is provided in the `Scheduler` class, but extension creators
    can provide their own scheduler by subclassing this class.
    By implementing this class, you will replace both the service
    API and the persistence layer for the scheduler.
    """

    staging_path = Unicode(
        help=_i18n(
            """Full path to staging location, where output
        files will be stored after job execution completes. This
        could be a local or remote path including cloud storage.
        Default value is jupyter data directory.
        """
        )
    )

    @default("staging_path")
    def _default_staging_path(self):
        return os.path.join(jupyter_data_dir(), "scheduler_staging_area")

    execution_manager_class = TType(
        allow_none=True,
        klass="jupyter_scheduler.executors.ExecutionManager",
        default_value="jupyter_scheduler.executors.DefaultExecutionManager",
        config=True,
        help=_i18n("The execution manager class to use."),
    )

    root_dir = Unicode(help=_i18n("Jupyter server root directory"))

    environments_manager = Instance(
        klass="jupyter_scheduler.environments.EnvironmentManager",
        help=_i18n("Environment manager instance"),
    )

    def __init__(
        self, root_dir: str, environments_manager: Type[EnvironmentManager], config=None, **kwargs
    ):
        super().__init__(config=config, **kwargs)
        self.root_dir = root_dir
        self.environments_manager = environments_manager

    def create_job(self, model: CreateJob) -> str:
        """Creates a new job record, may trigger execution of the job.
        In case a task runner is actually handling execution of the jobs,
        this method should just create the job record.
        """
        raise NotImplementedError("must be implemented by subclass")

    def update_job(self, job_id: str, model: UpdateJob):
        """Updates job metadata in the persistence store,
        for example name, status etc. In case of status
        change to STOPPED, should call stop_job
        """
        raise NotImplementedError("must be implemented by subclass")

    def list_jobs(self, query: ListJobsQuery) -> ListJobsResponse:
        """Returns list of all jobs filtered by query"""
        raise NotImplementedError("must be implemented by subclass")

    def count_jobs(self, query: CountJobsQuery) -> int:
        """Returns number of jobs filtered by query"""
        raise NotImplementedError("must be implemented by subclass")

    def get_job(self, job_id: str) -> DescribeJob:
        """Returns job record for a single job"""
        raise NotImplementedError("must be implemented by subclass")

    def delete_job(self, job_id: str):
        """Deletes the job record, stops the job if running"""
        raise NotImplementedError("must be implemented by subclass")

    def stop_job(self, job_id: str):
        """Stops the job, this is not analogous
        to the REST API that will be called to
        stop the job. Front end will call the PUT
        API with status update to STOPPED, which will
        call the stop_job method.
        """
        raise NotImplementedError("must be implemented by subclass")

    def create_job_definition(self, model: CreateJobDefinition) -> str:
        """Creates a new job definition record,
        consider this as the template for creating
        recurring/scheduled jobs.
        """
        raise NotImplementedError("must be implemented by subclass")

    def update_job_definition(self, job_definition_id: str, model: UpdateJobDefinition):
        """Updates job definition metadata in the persistence store,
        should only impact all future jobs.
        """
        raise NotImplementedError("must be implemented by subclass")

    def delete_job_definition(self, job_definition_id: str):
        """Deletes the job definition record,
        implementors can optionally stop all running jobs
        """
        raise NotImplementedError("must be implemented by subclass")

    def get_job_definition(self, job_definition_id: str) -> DescribeJobDefinition:
        """Returns job definition record for a single job definition"""
        raise NotImplementedError("must be implemented by subclass")

    def list_job_definitions(self, query: ListJobDefinitionsQuery) -> ListJobDefinitionsResponse:
        """Returns list of all job definitions filtered by query"""
        raise NotImplementedError("must be implemented by subclass")

    def get_staging_paths(self, job_id: str) -> Dict[str, str]:
        """Returns full staging paths for all job outputs"""
        raise NotImplementedError("must be implemented by subclass")

    def file_exists(self, path: str):
        """Returns True if the file exists, else returns False.

        API-style wrapper for os.path.isfile

        Parameters
        ----------
        path : string
            The relative path to the file (with '/' as separator)

        Returns
        -------
        exists : bool
            Whether the file exists.
        """
        root = os.path.abspath(self.root_dir)
        os_path = to_os_path(path, root)
        if not (os.path.abspath(os_path) + os.path.sep).startswith(root):
            return False
        else:
            return os.path.isfile(os_path)

    def add_outputs(self, model: DescribeJob):
        """Adds outputs to the model, ensures output
        files are present in the local workspace. These
        should be added in `get_job` and `list_job` APIs
        once the rest of the model is populated.
        """
        mapping = self.environments_manager.output_formats_mapping()
        outputs = []
        for output_format in model.output_formats:
            filename = create_output_filename(model.input_uri, model.create_time, output_format)
            output_path = os.path.join(model.output_prefix, filename)
            outputs.append(
                Output(
                    display_name=mapping[output_format],
                    output_format=output_format,
                    output_path=output_path if self.file_exists(output_path) else None,
                )
            )

        model.outputs = outputs
        model.downloaded = all(output.output_path for output in outputs)


class Scheduler(BaseScheduler):
    _db_session = None

    task_runner_class = TType(
        allow_none=True,
        config=True,
        default_value="jupyter_scheduler.task_runner.TaskRunner",
        klass="jupyter_scheduler.task_runner.BaseTaskRunner",
        help=_i18n(
            "The class that handles the job creation of scheduled jobs from job definitions."
        ),
    )

    db_url = Unicode(help=_i18n("Scheduler database url"))

    task_runner = Instance(allow_none=True, klass="jupyter_scheduler.task_runner.BaseTaskRunner")

    def __init__(
        self,
        root_dir: str,
        environments_manager: Type[EnvironmentManager],
        db_url: str,
        config=None,
        **kwargs,
    ):
        super().__init__(
            root_dir=root_dir, environments_manager=environments_manager, config=config, **kwargs
        )
        self.db_url = db_url
        if self.task_runner_class:
            self.task_runner = self.task_runner_class(scheduler=self, config=config)

    @property
    def db_session(self):
        if not self._db_session:
            self._db_session = create_session(self.db_url)

        return self._db_session

    def create_job(self, model: CreateJob) -> str:
        with self.db_session() as session:
            if not self.file_exists(model.input_uri):
                raise InputUriError(model.input_uri)

            if model.idempotency_token:
                job = (
                    session.query(Job)
                    .filter(Job.idempotency_token == model.idempotency_token)
                    .first()
                )
                if job:
                    raise IdempotencyTokenError(model.idempotency_token)

            if not model.output_formats:
                model.output_formats = ["ipynb"]

            job = Job(**model.dict(exclude_none=True))
            session.add(job)
            session.commit()

            staging_paths = self.get_staging_paths(job.job_id)

            p = Process(
                target=self.execution_manager_class(
                    job_id=job.job_id,
                    staging_paths=staging_paths,
                    root_dir=self.root_dir,
                    db_url=self.db_url,
                ).process
            )
            p.start()

            job.pid = p.pid
            session.commit()

            job_id = job.job_id

        return job_id

    def update_job(self, job_id: str, model: UpdateJob):
        with self.db_session() as session:
            session.query(Job).filter(Job.job_id == job_id).update(model.dict(exclude_none=True))
            session.commit()

    def list_jobs(self, query: ListJobsQuery) -> ListJobsResponse:
        with self.db_session() as session:
            jobs = session.query(Job)

            if query.status:
                jobs = jobs.filter(Job.status == query.status)
            if query.job_definition_id:
                jobs = jobs.filter(Job.job_definition_id == query.job_definition_id)
            if query.start_time:
                jobs = jobs.filter(Job.start_time >= query.start_time)
            if query.name:
                jobs = jobs.filter(Job.name.like(f"{query.name}%"))
            if query.tags:
                jobs = jobs.filter(and_(Job.tags.contains(tag) for tag in query.tags))

            total = jobs.count()

            if query.sort_by:
                for sort_field in query.sort_by:
                    direction = desc if sort_field.direction == SortDirection.desc else asc
                    jobs = jobs.order_by(direction(getattr(Job, sort_field.name)))
            next_token = int(query.next_token) if query.next_token else 0
            jobs = jobs.limit(query.max_items).offset(next_token)

            jobs = jobs.all()

        next_token = next_token + len(jobs)
        if next_token >= total:
            next_token = None

        jobs_list = []
        for job in jobs:
            model = DescribeJob.from_orm(job)
            self.add_outputs(model=model)
            jobs_list.append(model)

        list_jobs_response = ListJobsResponse(
            jobs=jobs_list,
            next_token=next_token,
            total_count=total,
        )

        return list_jobs_response

    def count_jobs(self, query: CountJobsQuery) -> int:
        with self.db_session() as session:
            count = (
                session.query(func.count(Job.job_id)).filter(Job.status == query.status).scalar()
            )
            return count if count else 0

    def get_job(self, job_id: str) -> DescribeJob:
        with self.db_session() as session:
            job_record = session.query(Job).filter(Job.job_id == job_id).one()

        model = DescribeJob.from_orm(job_record)
        self.add_outputs(model=model)

        return model

    def delete_job(self, job_id: str):
        with self.db_session() as session:
            job_record = session.query(Job).filter(Job.job_id == job_id).one()
            if Status(job_record.status) == Status.IN_PROGRESS:
                self.stop_job(job_id)

            session.query(Job).filter(Job.job_id == job_id).delete()
            session.commit()

    def stop_job(self, job_id):
        with self.db_session() as session:
            job_record = session.query(Job).filter(Job.job_id == job_id).one()
            job = DescribeJob.from_orm(job_record)
            process_id = job_record.pid
            if process_id and job.status == Status.IN_PROGRESS:
                session.query(Job).filter(Job.job_id == job_id).update({"status": Status.STOPPING})
                session.commit()

                current_process = psutil.Process()
                children = current_process.children(recursive=True)
                for proc in children:
                    if process_id == proc.pid:
                        proc.kill()
                        session.query(Job).filter(Job.job_id == job_id).update(
                            {"status": Status.STOPPED}
                        )
                        session.commit()
                        break

    def create_job_definition(self, model: CreateJobDefinition) -> str:
        with self.db_session() as session:
            if not self.file_exists(model.input_uri):
                raise InputUriError(model.input_uri)

            job_definition = JobDefinition(**model.dict(exclude_none=True))
            session.add(job_definition)
            session.commit()

            job_definition_id = job_definition.job_definition_id

        if self.task_runner and job_definition.schedule:
            self.task_runner.add_job_definition(job_definition_id)

        return job_definition_id

    def update_job_definition(self, job_definition_id: str, model: UpdateJobDefinition):
        with self.db_session() as session:
            session.query(JobDefinition).filter(
                JobDefinition.job_definition_id == job_definition_id
            ).update(model.dict(exclude_none=True))
            session.commit()

            schedule = (
                session.query(JobDefinition.schedule)
                .filter(JobDefinition.job_definition_id == job_definition_id)
                .scalar()
            )

        if self.task_runner and schedule:
            self.task_runner.update_job_definition(job_definition_id, model)

    def delete_job_definition(self, job_definition_id: str):
        with self.db_session() as session:
            jobs = session.query(Job).filter(Job.job_definition_id == job_definition_id)
            for job in jobs:
                self.delete_job(job.job_id)

            schedule = (
                session.query(JobDefinition.schedule)
                .filter(JobDefinition.job_definition_id == job_definition_id)
                .scalar()
            )

            session.query(JobDefinition).filter(
                JobDefinition.job_definition_id == job_definition_id
            ).delete()
            session.commit()

        if self.task_runner and schedule:
            self.task_runner.delete_job_definition(job_definition_id)

    def get_job_definition(self, job_definition_id: str) -> DescribeJobDefinition:
        with self.db_session() as session:
            job_definition = (
                session.query(JobDefinition)
                .filter(JobDefinition.job_definition_id == job_definition_id)
                .one()
            )

        return DescribeJobDefinition.from_orm(job_definition)

    def list_job_definitions(self, query: ListJobDefinitionsQuery) -> ListJobDefinitionsResponse:
        with self.db_session() as session:
            definitions = session.query(JobDefinition)

            if query.create_time:
                definitions = definitions.filter(JobDefinition.create_time >= query.create_time)
            if query.name:
                definitions = definitions.filter(JobDefinition.name.like(f"{query.name}%"))
            if query.tags:
                definitions = definitions.filter(
                    and_(JobDefinition.tags.contains(tag) for tag in query.tags)
                )

            total = definitions.count()

            if query.sort_by:
                for sort_field in query.sort_by:
                    direction = desc if sort_field.direction == SortDirection.desc else asc
                    definitions = definitions.order_by(
                        direction(getattr(JobDefinition, sort_field.name))
                    )
            next_token = int(query.next_token) if query.next_token else 0
            definitions = definitions.limit(query.max_items).offset(next_token)

            definitions = definitions.all()

        next_token = next_token + len(definitions)
        if next_token >= total:
            next_token = None

        list_response = ListJobDefinitionsResponse(
            job_definitions=[
                DescribeJobDefinition.from_orm(definition) for definition in definitions or []
            ],
            next_token=next_token,
            total_count=total,
        )

        return list_response

    def get_staging_paths(self, job_id: str) -> Dict[str, str]:
        model = self.get_job(job_id)
        staging_paths = {}
        for output in model.outputs:
            filename = create_output_filename(
                model.input_uri, model.create_time, output.output_format
            )
            staging_paths[output.output_format] = os.path.join(self.staging_path, job_id, filename)

        return staging_paths
