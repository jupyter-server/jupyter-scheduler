import asyncio
from dataclasses import dataclass
from datetime import datetime
from heapq import heappop, heappush
from typing import List, Optional

import traitlets
from jupyter_server.transutils import _i18n
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker
from traitlets.config import LoggingConfigurable

from jupyter_scheduler.models import CreateJob, UpdateJobDefinition
from jupyter_scheduler.orm import JobDefinition, declarative_base
from jupyter_scheduler.utils import (
    compute_next_run_time,
    get_localized_timestamp,
    get_utc_timestamp,
)

Base = declarative_base()


class JobDefinitionCache(Base):
    __tablename__ = "job_definitions_cache"
    job_definition_id = Column(String(36), primary_key=True)
    next_run_time = Column(Integer)
    active = Column(Boolean)
    timezone = Column(String(36))
    schedule = Column(String(256))


class DescribeJobDefinitionCache(BaseModel):
    job_definition_id: str
    next_run_time: int
    active: bool
    timezone: Optional[str] = None
    schedule: str

    class Config:
        orm_mode = True


class UpdateJobDefinitionCache(BaseModel):
    next_run_time: Optional[int] = None
    active: Optional[bool] = None
    timezone: Optional[str] = None
    schedule: Optional[str] = None


@dataclass
class JobDefinitionTask:
    job_definition_id: str
    next_run_time: int

    def __lt__(self, other):
        return self.next_run_time < other.next_run_time

    def __str__(self):
        next_run_time = datetime.fromtimestamp(self.next_run_time / 1e3)
        return f"Id: {self.job_definition_id}, Run-time: {next_run_time}"


class PriorityQueue:
    """A priority queue using heapq"""

    def __init__(self):
        self._heap = []

    def peek(self):
        if self.isempty():
            raise "Queue is empty"

        return self._heap[0]

    def push(self, task: JobDefinitionTask):
        heappush(self._heap, task)

    def pop(self):
        task = heappop(self._heap)
        return task

    def __len__(self):
        return len(self._heap)

    def isempty(self):
        return len(self._heap) < 1

    def __str__(self):
        tasks = []
        for task in self._heap:
            tasks.append(str(task))

        return "\n".join(tasks)


class Cache:
    def __init__(self) -> None:
        self.cache_url = "sqlite://"
        engine = create_engine(self.cache_url, echo=False)
        Base.metadata.create_all(engine)
        self.session = sessionmaker(bind=engine)

    def load(self, models: List[DescribeJobDefinitionCache]):
        with self.session() as session:
            for model in models:
                session.add(JobDefinitionCache(**model.dict()))
            session.commit()

    def get(self, job_definition_id: str) -> DescribeJobDefinitionCache:
        with self.session() as session:
            definition = (
                session.query(JobDefinitionCache)
                .filter(JobDefinitionCache.job_definition_id == job_definition_id)
                .first()
            )

        if definition:
            return DescribeJobDefinitionCache.from_orm(definition)
        else:
            return None

    def put(self, model: DescribeJobDefinitionCache):
        with self.session() as session:
            session.add(JobDefinitionCache(**model.dict()))
            session.commit()

    def update(self, job_definition_id: str, model: UpdateJobDefinitionCache):
        with self.session() as session:
            session.query(JobDefinitionCache).filter(
                JobDefinitionCache.job_definition_id == job_definition_id
            ).update(model.dict(exclude_none=True))
            session.commit()

    def delete(self, job_definition_id: str):
        with self.session() as session:
            session.query(JobDefinitionCache).filter(
                JobDefinitionCache.job_definition_id == job_definition_id
            ).delete()
            session.commit()


class BaseTaskRunner(LoggingConfigurable):
    """Base task runner, this class's start method is called
    at the start of jupyter server, and is responsible for
    polling for the job definitions and creating new jobs
    based on the schedule/timezone in the job definition.
    """

    def __init__(self, config=None, **kwargs):
        super().__init__(config=config)

    poll_interval = traitlets.Integer(
        default_value=10,
        config=True,
        help=_i18n("The interval in seconds that the task runner polls for scheduled jobs to run."),
    )

    async def start(self):
        """Async method that is called by extension at server start"""
        raise NotImplementedError("must be implemented by subclass")

    def add_job_definition(self, job_definition_id: str):
        """This should handle adding data for new
        job definition to the PriorityQueue and Cache."""
        raise NotImplementedError("must be implemented by subclass")

    def update_job_definition(self, job_definition_id: str, model: UpdateJobDefinition):
        """This should handles updates to job definitions"""
        NotImplementedError("must be implemented by subclass")

    def delete_job_definition(self, job_definition_id: str):
        """Handles deletion of job definitions"""
        NotImplementedError("must be implemented by subclass")

    def pause_jobs(self, job_definition_id: str):
        """Handles pausing a job definition"""
        NotImplementedError("must be implemented by subclass")

    def resume_jobs(self, job_definition_id: str):
        """Handles resuming of a job definition"""
        NotImplementedError("must be implemented by subclass")


class TaskRunner(BaseTaskRunner):
    """Default task runner that maintains a job definition cache and a
    priority queue, and polls the queue every `poll_interval` seconds
    for new jobs to create.
    """

    def __init__(self, scheduler, config=None) -> None:
        super().__init__(config=config)
        self.scheduler = scheduler
        self.db_session = scheduler.db_session
        self.cache = Cache()
        self.queue = PriorityQueue()

    def compute_next_run_time(self, schedule: str, timezone: Optional[str] = None):
        return compute_next_run_time(schedule, timezone)

    def populate_cache(self):
        with self.db_session() as session:
            definitions = session.query(JobDefinition).filter(JobDefinition.schedule != None).all()

        for definition in definitions:
            next_run_time = self.compute_next_run_time(definition.schedule, definition.timezone)
            self.cache.put(
                DescribeJobDefinitionCache(
                    job_definition_id=definition.job_definition_id,
                    next_run_time=next_run_time,
                    active=definition.active,
                    timezone=definition.timezone,
                    schedule=definition.schedule,
                )
            )
            if definition.active:
                self.queue.push(
                    JobDefinitionTask(
                        job_definition_id=definition.job_definition_id,
                        next_run_time=next_run_time,
                    )
                )

    def add_job_definition(self, job_definition_id: str):
        with self.db_session() as session:
            definition = (
                session.query(JobDefinition)
                .filter(JobDefinition.job_definition_id == job_definition_id)
                .first()
            )

        next_run_time = self.compute_next_run_time(definition.schedule, definition.timezone)

        self.cache.put(
            DescribeJobDefinitionCache(
                job_definition_id=definition.job_definition_id,
                active=definition.active,
                next_run_time=next_run_time,
                timezone=definition.timezone,
                schedule=definition.schedule,
            )
        )
        if definition.active:
            self.queue.push(
                JobDefinitionTask(
                    job_definition_id=definition.job_definition_id, next_run_time=next_run_time
                )
            )

    def update_job_definition(self, job_definition_id: str, model: UpdateJobDefinition):
        cache = self.cache.get(job_definition_id)
        schedule = model.schedule or cache.schedule
        timezone = model.timezone or cache.timezone
        active = model.active if model.active is not None else cache.active
        cached_next_run_time = cache.next_run_time
        next_run_time = self.compute_next_run_time(schedule, timezone)

        self.cache.update(
            job_definition_id,
            UpdateJobDefinitionCache(
                timezone=timezone, next_run_time=next_run_time, active=active, schedule=schedule
            ),
        )

        next_run_time_changed = cached_next_run_time != next_run_time and active
        resumed_job = model.active and not cache.active

        if next_run_time_changed or resumed_job:
            self.log.debug("Updating queue...")
            task = JobDefinitionTask(
                job_definition_id=job_definition_id, next_run_time=next_run_time
            )
            self.queue.push(task)
            self.log.debug(f"Updated queue, {task}")

    def delete_job_definition(self, job_definition_id: str):
        self.cache.delete(job_definition_id)

    def create_job(self, job_definition_id: str):
        definition = self.scheduler.get_job_definition(job_definition_id)
        if definition and definition.active:
            input_uri = self.scheduler.get_staging_paths(definition)["input"]
            self.scheduler.create_job(
                CreateJob(
                    **definition.dict(exclude={"schedule", "timezone"}, exclude_none=True),
                    input_uri=input_uri,
                )
            )

    def compute_time_diff(self, queue_run_time: int, timezone: str):
        local_time = get_localized_timestamp(timezone) if timezone else get_utc_timestamp()
        return local_time - queue_run_time

    def process_queue(self):
        self.log.debug(self.queue)
        while not self.queue.isempty():
            task = self.queue.peek()
            cache = self.cache.get(task.job_definition_id)

            if not cache:
                self.queue.pop()
                continue

            cache_run_time = cache.next_run_time
            queue_run_time = task.next_run_time

            if not cache.active or queue_run_time != cache_run_time:
                self.queue.pop()
                continue

            time_diff = self.compute_time_diff(queue_run_time, cache.timezone)

            # if run time is in future
            if time_diff < 0:
                break
            else:
                try:
                    self.create_job(task.job_definition_id)
                except Exception as e:
                    self.log.exception(e)
                self.queue.pop()
                run_time = self.compute_next_run_time(cache.schedule, cache.timezone)
                self.cache.update(
                    task.job_definition_id, UpdateJobDefinitionCache(next_run_time=run_time)
                )
                self.queue.push(
                    JobDefinitionTask(
                        job_definition_id=task.job_definition_id, next_run_time=run_time
                    )
                )

    async def start(self):
        self.populate_cache()
        while True:
            self.process_queue()
            await asyncio.sleep(self.poll_interval)
