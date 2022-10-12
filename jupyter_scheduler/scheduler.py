from abc import ABC, abstractmethod
from multiprocessing import Process

import psutil
from jupyter_core.paths import jupyter_data_dir
from sqlalchemy import and_, asc, desc, func

from jupyter_scheduler.config import ExecutionConfig
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
    SortDirection,
    Status,
    UpdateJob,
    UpdateJobDefinition,
)
from jupyter_scheduler.orm import Job, JobDefinition, create_session
from jupyter_scheduler.utils import (
    compute_next_run_time,
    create_output_filename,
    timestamp_to_int,
)


class BaseScheduler(ABC):
    """Base class for schedulers. A default implementation
    is provided in the `Scheduler` class, but extension creators
    can provide their own scheduler by subclassing this class.
    By implementing this class, you will replace both the service
    API and the persistence layer for the scheduler.
    """

    @abstractmethod
    def create_job(self, model: CreateJob) -> str:
        """Creates a new job record, may trigger execution of the job.
        In case a task runner is actually handling execution of the jobs,
        this method should just create the job record.
        """
        pass

    @abstractmethod
    def update_job(self, job_id: str, model: UpdateJob):
        """Updates job metadata in the persistence store,
        for example name, status etc. In case of status
        change to STOPPED, should call stop_job
        """
        pass

    @abstractmethod
    def list_jobs(self, query: ListJobsQuery) -> ListJobsResponse:
        """Returns list of all jobs filtered by query"""
        pass

    @abstractmethod
    def count_jobs(self, query: CountJobsQuery) -> int:
        """Returns number of jobs filtered by query"""
        pass

    @abstractmethod
    def get_job(self, job_id: str) -> DescribeJob:
        """Returns job record for a single job"""
        pass

    @abstractmethod
    def delete_job(self, job_id: str):
        """Deletes the job record, stops the job if running"""
        pass

    @abstractmethod
    def stop_job(self, job_id: str):
        """Stops the job, this is not analogous
        to the REST API that will be called to
        stop the job. Front end will call the PUT
        API with status update to STOPPED, which will
        call the update_job method. This method is
        supposed to do the work of actually stopping
        the process that is executing the job. In case
        of a task runner, you can assume a call to task
        runner to suspend the job.
        """
        pass

    @abstractmethod
    def create_job_definition(self, model: CreateJobDefinition) -> str:
        """Creates a new job definition record,
        consider this as the template for creating
        recurring/scheduled jobs.
        """
        pass

    @abstractmethod
    def update_job_definition(self, job_definition_id: str, model: UpdateJobDefinition):
        """Updates job definition metadata in the persistence store,
        should only impact all future jobs.
        """
        pass

    @abstractmethod
    def delete_job_definition(self, job_definition_id: str):
        """Deletes the job definition record,
        implementors can optionally stop all running jobs
        """
        pass

    @abstractmethod
    def get_job_definition(self, job_definition_id: str) -> DescribeJobDefinition:
        """Returns job definition record for a single job definition"""
        pass

    @abstractmethod
    def list_job_definitions(self, query: ListJobDefinitionsQuery) -> ListJobDefinitionsResponse:
        """Returns list of all job definitions filtered by query"""
        pass

    @abstractmethod
    def pause_jobs(self, job_definition_id: str):
        """Pauses all future jobs for a job definition"""
        pass

    @abstractmethod
    def resume_jobs(self, job_definition_id: str):
        """Resumes future jobs for a job definition"""
        pass


class Scheduler(BaseScheduler):

    _db_session = None
    task_runner = None

    def __init__(self, config: ExecutionConfig = {}, task_runner_class=None):
        self.config = config
        if task_runner_class:
            self.task_runner = task_runner_class(self, self.config.task_runner_run_interval)

    @property
    def db_session(self):
        if not self._db_session:
            self._db_session = create_session(self.config.db_url)

        return self._db_session

    @property
    def execution_manager_class(self):
        return self.config.execution_manager_class

    def create_job(self, model: CreateJob) -> str:
        with self.db_session() as session:
            job = None
            if model.idempotency_token:
                job = (
                    session.query(Job)
                    .filter(Job.idempotency_token == model.idempotency_token)
                    .first()
                )
            if job:
                return job.job_id

            if not model.output_formats:
                model.output_formats = ["ipynb"]

            job = Job(**model.dict(exclude_none=True))
            session.add(job)
            session.commit()

            p = Process(target=self.execution_manager_class(job.job_id, self.config).process)
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

        list_jobs_response = ListJobsResponse(
            jobs=[DescribeJob.from_orm(job) for job in jobs or []],
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

            return DescribeJob.from_orm(job_record)

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

    def pause_jobs(self, job_definition_id: str):
        with self.db_session() as session:
            job_definition = (
                session.query(JobDefinition)
                .filter(JobDefinition.job_definition_id == job_definition_id)
                .one()
            )
            job_definition.active = False
            session.commit()

        if self.task_runner and job_definition.schedule:
            self.task_runner.pause_jobs(job_definition_id)

    def resume_jobs(self, job_definition_id: str):
        with self.db_session() as session:
            job_definition = (
                session.query(JobDefinition)
                .filter(JobDefinition.job_definition_id == job_definition_id)
                .one()
            )
            job_definition.active = True
            session.commit()

        if self.task_runner and job_definition.schedule:
            self.task_runner.resume_jobs(job_definition_id)
