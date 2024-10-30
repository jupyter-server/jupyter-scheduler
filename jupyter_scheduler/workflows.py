import json
from typing import Dict, List, Optional

from jupyter_server.utils import ensure_async
from tornado.web import HTTPError, authenticated

from jupyter_scheduler.exceptions import (
    IdempotencyTokenError,
    InputUriError,
    SchedulerError,
)
from jupyter_scheduler.handlers import (
    APIHandler,
    ExtensionHandlerMixin,
    JobHandlersMixin,
)
from jupyter_scheduler.models import (
    CreateJob,
    CreateJobDefinition,
    Status,
    UpdateJob,
    UpdateJobDefinition,
)
from jupyter_scheduler.pydantic_v1 import BaseModel, ValidationError


class WorkflowsHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self):
        payload = self.get_json_body() or {}
        try:
            workflow_id = await ensure_async(
                self.scheduler.create_workflow(CreateWorkflow(**payload))
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, "Unexpected error occurred during creation of a workflow.") from e
        else:
            self.finish(json.dumps(dict(workflow_id=workflow_id)))

    @authenticated
    async def get(self, workflow_id: str = None):
        if not workflow_id:
            raise HTTPError(400, "Missing workflow_id in the request URL.")
        try:
            workflow = await ensure_async(self.scheduler.get_workflow(workflow_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, "Unexpected error occurred while getting workflow details.") from e
        else:
            self.finish(workflow.json())

    @authenticated
    async def get(self, workflow_id: str = None):
        if workflow_id:
            try:
                workflow = await ensure_async(self.scheduler.get_workflow(workflow_id))
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, str(e)) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500, "Unexpected error occurred while getting workflow details."
                ) from e
            else:
                self.finish(workflow.json())
        else:
            try:
                workflows = await ensure_async(self.scheduler.get_all_workflows())
                workflows_json = [workflow.dict() for workflow in workflows]
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, str(e)) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500, "Unexpected error occurred while getting all workflows details."
                ) from e
            else:
                self.finish(json.dumps(workflows_json))


class WorkflowsTasksHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self, workflow_id: str):
        payload = self.get_json_body()
        try:
            task_id = await ensure_async(
                self.scheduler.create_workflow_task(
                    workflow_id=workflow_id, model=CreateJob(**payload)
                )
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred during creation of workflow job."
            ) from e
        else:
            self.finish(json.dumps(dict(task_id=task_id)))

    @authenticated
    async def patch(self, _: str, task_id: str):
        payload = self.get_json_body()
        status = payload.get("status")
        status = Status(status) if status else None

        if status and status != Status.STOPPED:
            raise HTTPError(
                500,
                "Invalid value for field 'status'. Workflow task status can only be updated to status 'STOPPED' after creation.",
            )
        try:
            if status:
                await ensure_async(self.scheduler.stop_job(task_id))
            else:
                await ensure_async(self.scheduler.update_job(task_id, UpdateJob(**payload)))
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred while updating the workflow job."
            ) from e
        else:
            self.set_status(204)
            self.finish()


class WorkflowsRunHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self, workflow_id: str):
        try:
            workflow_id = await ensure_async(self.scheduler.run_workflow(workflow_id))
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred during attempt to run a workflow."
            ) from e
        else:
            self.finish(json.dumps(dict(workflow_id=workflow_id)))


class WorkflowDefinitionsHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self):
        payload = self.get_json_body() or {}
        try:
            workflow_definition_id = await ensure_async(
                self.scheduler.create_workflow_definition(CreateWorkflowDefinition(**payload))
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred during creation of a workflow definition."
            ) from e
        else:
            self.finish(json.dumps(dict(workflow_definition_id=workflow_definition_id)))

    @authenticated
    async def get(self, workflow_definition_id: str = None):
        if workflow_definition_id:
            try:
                workflow_definition = await ensure_async(
                    self.scheduler.get_workflow_definition(workflow_definition_id)
                )
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, str(e)) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500, "Unexpected error occurred while getting workflow definition details."
                ) from e
            else:
                self.finish(workflow_definition.json())
        else:
            try:
                workflow_definitions = await ensure_async(
                    self.scheduler.get_all_workflow_definition_tasks()
                )
                workflow_definitions_json = [
                    workflow_definition.dict() for workflow_definition in workflow_definitions
                ]
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, str(e)) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500,
                    "Unexpected error occurred while getting all workflows definitions details.",
                ) from e
            else:
                self.finish(json.dumps(workflow_definitions_json))


class WorkflowDefinitionsTasksHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self, workflow_definition_id: str):
        payload = self.get_json_body()
        try:
            task_defintion_id = await ensure_async(
                self.scheduler.create_workflow_definition_task(
                    workflow_definition_id=workflow_definition_id,
                    model=CreateJobDefinition(
                        **payload, workflow_definition_id=workflow_definition_id
                    ),
                )
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred during creation of workflow definition task."
            ) from e
        else:
            self.finish(json.dumps(dict(task_defintion_id=task_defintion_id)))

    @authenticated
    async def patch(self, _: str, task_definition_id: str):
        payload = self.get_json_body()
        status = payload.get("status")
        status = Status(status) if status else None

        try:
            await ensure_async(
                self.scheduler.update_job_definition(
                    task_definition_id, UpdateJobDefinition(**payload)
                )
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred while updating the workflow definition task."
            ) from e
        else:
            self.set_status(204)
            self.finish()

    @authenticated
    async def get(self, workflow_definition_id: str = None):
        if workflow_definition_id:
            try:
                task_definitions = await ensure_async(
                    self.scheduler.get_workflow_definition_tasks(workflow_definition_id)
                )
                task_definitions_json = [
                    task_definition.dict() for task_definition in task_definitions
                ]
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, str(e)) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500,
                    "Unexpected error occurred while getting workflow task definitions details.",
                ) from e
            else:
                self.finish(json.dumps(task_definitions_json))
        else:
            try:
                task_definitions = await ensure_async(
                    self.scheduler.get_all_workflow_definition_tasks()
                )
                task_definitions_json = [
                    task_definition.dict() for task_definition in task_definitions
                ]
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, str(e)) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500,
                    "Unexpected error occurred while getting all task definitions details.",
                ) from e
            else:
                self.finish(json.dumps(task_definitions_json))


class WorkflowDefinitionsDeploymentHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self, workflow_definition_id: str):
        try:
            workflow_definition_id = await ensure_async(
                self.scheduler.deploy_workflow_definition(workflow_definition_id)
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(
                500, "Unexpected error occurred during attempt to run a workflow."
            ) from e
        else:
            self.finish(json.dumps(dict(workflow_definition_id=workflow_definition_id)))


class CreateWorkflow(BaseModel):
    tasks: List[str] = []
    name: str
    parameters: Optional[Dict[str, str]] = None


class DescribeWorkflow(BaseModel):
    name: str
    parameters: Optional[Dict[str, str]] = None
    workflow_id: str
    tasks: List[str] = None
    status: Status = Status.CREATED
    active: Optional[bool] = None

    class Config:
        orm_mode = True


class UpdateWorkflow(BaseModel):
    name: Optional[str] = None
    parameters: Optional[Dict[str, str]] = None
    tasks: Optional[List[str]] = None
    status: Optional[Status] = None
    active: Optional[bool] = None

    class Config:
        orm_mode = True


class CreateWorkflowDefinition(BaseModel):
    tasks: List[str] = []
    # any field added to CreateWorkflow should also be added to this model as well
    name: str = ""
    parameters: Optional[Dict[str, str]] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None

    class Config:
        orm_mode = True


class DescribeWorkflowDefinition(BaseModel):
    name: str
    parameters: Optional[Dict[str, str]] = None
    workflow_definition_id: str
    tasks: List[str] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None
    status: Status = Status.CREATED
    active: Optional[bool] = None

    class Config:
        orm_mode = True


class UpdateWorkflowDefinition(BaseModel):
    name: Optional[str] = None
    parameters: Optional[Dict[str, str]] = None
    tasks: Optional[List[str]] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None
    active: Optional[bool] = None

    class Config:
        orm_mode = True
