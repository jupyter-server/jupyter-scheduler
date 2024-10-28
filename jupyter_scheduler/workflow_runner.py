import asyncio
from dataclasses import dataclass
from datetime import datetime
from heapq import heappop, heappush
from typing import List, Optional

import traitlets
from jupyter_server.transutils import _i18n
from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker
from traitlets.config import LoggingConfigurable

from jupyter_scheduler.orm import WorkflowDefinition, declarative_base
from jupyter_scheduler.pydantic_v1 import BaseModel
from jupyter_scheduler.utils import (
    compute_next_run_time,
    get_localized_timestamp,
    get_utc_timestamp,
)
from jupyter_scheduler.workflows import (
    CreateWorkflow,
    DescribeWorkflowDefinition,
    UpdateWorkflowDefinition,
)

Base = declarative_base()


class WorkflowDefinitionCache(Base):
    __tablename__ = "workflow_definitions_cache"
    workflow_definition_id = Column(String(36), primary_key=True)
    next_run_time = Column(Integer)
    active = Column(Boolean)
    timezone = Column(String(36))
    schedule = Column(String(256))


class DescribeWorkflowDefinitionCache(BaseModel):
    workflow_definition_id: str
    next_run_time: int
    active: bool
    timezone: Optional[str] = None
    schedule: str

    class Config:
        orm_mode = True


class UpdateWorkflowDefinitionCache(BaseModel):
    next_run_time: Optional[int] = None
    active: Optional[bool] = None
    timezone: Optional[str] = None
    schedule: Optional[str] = None


@dataclass
class WorkflowDefinitionTask:
    workflow_definition_id: str
    next_run_time: int

    def __lt__(self, other):
        return self.next_run_time < other.next_run_time

    def __str__(self):
        next_run_time = datetime.fromtimestamp(self.next_run_time / 1e3)
        return f"Id: {self.workflow_definition_id}, Run-time: {next_run_time}"


class PriorityQueue:
    """A priority queue using heapq"""

    def __init__(self):
        self._heap = []

    def peek(self):
        if self.isempty():
            raise "Queue is empty"

        return self._heap[0]

    def push(self, task: WorkflowDefinitionTask):
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

    def load(self, models: List[DescribeWorkflowDefinitionCache]):
        with self.session() as session:
            for model in models:
                session.add(WorkflowDefinitionCache(**model.dict()))
            session.commit()

    def get(self, workflow_definition_id: str) -> DescribeWorkflowDefinitionCache:
        with self.session() as session:
            definition = (
                session.query(WorkflowDefinitionCache)
                .filter(WorkflowDefinitionCache.workflow_definition_id == workflow_definition_id)
                .first()
            )

        if definition:
            return DescribeWorkflowDefinitionCache.from_orm(definition)
        else:
            return None

    def put(self, model: DescribeWorkflowDefinitionCache):
        with self.session() as session:
            session.add(WorkflowDefinitionCache(**model.dict()))
            session.commit()

    def update(self, workflow_definition_id: str, model: UpdateWorkflowDefinitionCache):
        with self.session() as session:
            session.query(WorkflowDefinitionCache).filter(
                WorkflowDefinitionCache.workflow_definition_id == workflow_definition_id
            ).update(model.dict(exclude_none=True))
            session.commit()

    def delete(self, workflow_definition_id: str):
        with self.session() as session:
            session.query(WorkflowDefinitionCache).filter(
                WorkflowDefinitionCache.workflow_definition_id == workflow_definition_id
            ).delete()
            session.commit()


class BaseWorkflowRunner(LoggingConfigurable):
    """Base task runner, this class's start method is called
    at the start of jupyter server, and is responsible for
    polling for the workflow definitions and creating new workflows
    based on the schedule/timezone in the workflow definition.
    """

    def __init__(self, config=None, **kwargs):
        super().__init__(config=config)

    poll_interval = traitlets.Integer(
        default_value=10,
        config=True,
        help=_i18n(
            "The interval in seconds that the task runner polls for scheduled workflows to run."
        ),
    )

    async def start(self):
        """Async method that is called by extension at server start"""
        raise NotImplementedError("must be implemented by subclass")

    def add_workflow_definition(self, workflow_definition_id: str):
        """This should handle adding data for new
        workflow definition to the PriorityQueue and Cache."""
        raise NotImplementedError("must be implemented by subclass")

    def update_workflow_definition(
        self, workflow_definition_id: str, model: UpdateWorkflowDefinition
    ):
        """This should handles updates to workflow definitions"""
        NotImplementedError("must be implemented by subclass")

    def delete_workflow_definition(self, workflow_definition_id: str):
        """Handles deletion of workflow definitions"""
        NotImplementedError("must be implemented by subclass")

    def pause_workflows(self, workflow_definition_id: str):
        """Handles pausing a workflow definition"""
        NotImplementedError("must be implemented by subclass")

    def resume_workflows(self, workflow_definition_id: str):
        """Handles resuming of a workflow definition"""
        NotImplementedError("must be implemented by subclass")


class WorkflowRunner(BaseWorkflowRunner):
    """Default workflow runner that maintains a workflow definition cache and a
    priority queue, and polls the queue every `poll_interval` seconds
    for new workflows to create.
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
            definitions: List[WorkflowDefinition] = (
                session.query(WorkflowDefinition).filter(WorkflowDefinition.schedule != None).all()
            )

        for definition in definitions:
            next_run_time = self.compute_next_run_time(definition.schedule, definition.timezone)
            self.cache.put(
                DescribeWorkflowDefinitionCache(
                    workflow_definition_id=definition.workflow_definition_id,
                    next_run_time=next_run_time,
                    active=definition.active,
                    timezone=definition.timezone,
                    schedule=definition.schedule,
                )
            )
            if definition.active:
                self.queue.push(
                    WorkflowDefinitionTask(
                        workflow_definition_id=definition.workflow_definition_id,
                        next_run_time=next_run_time,
                    )
                )

    def add_workflow_definition(self, workflow_definition_id: str):
        with self.db_session() as session:
            definition = (
                session.query(WorkflowDefinition)
                .filter(WorkflowDefinition.workflow_definition_id == workflow_definition_id)
                .first()
            )

        next_run_time = self.compute_next_run_time(definition.schedule, definition.timezone)

        self.cache.put(
            DescribeWorkflowDefinitionCache(
                workflow_definition_id=definition.workflow_definition_id,
                active=definition.active,
                next_run_time=next_run_time,
                timezone=definition.timezone,
                schedule=definition.schedule,
            )
        )
        if definition.active:
            self.queue.push(
                WorkflowDefinitionTask(
                    workflow_definition_id=definition.workflow_definition_id,
                    next_run_time=next_run_time,
                )
            )

    def update_workflow_definition(
        self, workflow_definition_id: str, model: UpdateWorkflowDefinition
    ):
        cache = self.cache.get(workflow_definition_id)
        schedule = model.schedule or cache.schedule
        timezone = model.timezone or cache.timezone
        active = model.active if model.active is not None else cache.active
        cached_next_run_time = cache.next_run_time
        next_run_time = self.compute_next_run_time(schedule, timezone)

        self.cache.update(
            workflow_definition_id,
            UpdateWorkflowDefinitionCache(
                timezone=timezone, next_run_time=next_run_time, active=active, schedule=schedule
            ),
        )

        next_run_time_changed = cached_next_run_time != next_run_time and active
        resumed_workflow = model.active and not cache.active

        if next_run_time_changed or resumed_workflow:
            self.log.debug("Updating queue...")
            task = WorkflowDefinitionTask(
                workflow_definition_id=workflow_definition_id, next_run_time=next_run_time
            )
            self.queue.push(task)
            self.log.debug(f"Updated queue, {task}")

    def delete_workflow_definition(self, workflow_definition_id: str):
        self.cache.delete(workflow_definition_id)

    def create_and_run_workflow(self, workflow_definition_id: str):
        definition: DescribeWorkflowDefinition = self.scheduler.get_workflow_definition(
            workflow_definition_id
        )
        print(f"calling workflow_runner.create_and_run_workflow with {definition.dict}")
        if definition and definition.active:
            self.scheduler.run_workflow_from_definition(definition)

    def compute_time_diff(self, queue_run_time: int, timezone: str):
        local_time = get_localized_timestamp(timezone) if timezone else get_utc_timestamp()
        return local_time - queue_run_time

    def process_queue(self):
        self.log.debug(self.queue)
        while not self.queue.isempty():
            task: WorkflowDefinitionTask = self.queue.peek()
            cache = self.cache.get(task.workflow_definition_id)

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
                    self.create_and_run_workflow(task.workflow_definition_id)
                except Exception as e:
                    self.log.exception(e)
                self.queue.pop()
                run_time = self.compute_next_run_time(cache.schedule, cache.timezone)
                self.cache.update(
                    task.workflow_definition_id,
                    UpdateWorkflowDefinitionCache(next_run_time=run_time),
                )
                self.queue.push(
                    WorkflowDefinitionTask(
                        workflow_definition_id=task.workflow_definition_id, next_run_time=run_time
                    )
                )

    async def start(self):
        self.populate_cache()
        while True:
            self.process_queue()
            await asyncio.sleep(self.poll_interval)
