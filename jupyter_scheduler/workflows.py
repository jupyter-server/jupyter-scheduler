import json
from typing import List, Optional

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
from jupyter_scheduler.models import CreateJob, Status, UpdateJob
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


class WorkflowsTasksHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self, workflow_id: str):
        payload = self.get_json_body()
        if workflow_id != payload.get("workflow_id"):
            raise HTTPError(
                400,
                "Error during workflow job creation. workflow_id in the URL and payload don't match.",
            )
        try:
            job_id = await ensure_async(
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
            self.finish(json.dumps(dict(job_id=job_id)))

    @authenticated
    async def patch(self, workflow_id: str, job_id: str):
        payload = self.get_json_body()
        if workflow_id != payload.get("workflow_id", None):
            raise HTTPError(
                400,
                "Error during workflow job creation. workflow_id in the URL and payload don't match.",
            )
        status = payload.get("status")
        status = Status(status) if status else None

        if status and status != Status.STOPPED:
            raise HTTPError(
                500,
                "Invalid value for field 'status'. Workflow job status can only be updated to status 'STOPPED' after creation.",
            )
        try:
            if status:
                await ensure_async(self.scheduler.stop_job(job_id))
            else:
                await ensure_async(self.scheduler.update_job(job_id, UpdateJob(**payload)))
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


class CreateWorkflow(BaseModel):
    tasks: List[str] = []


class DescribeWorkflow(BaseModel):
    workflow_id: str
    tasks: List[str] = None
    status: Status = Status.CREATED

    class Config:
        orm_mode = True


class UpdateWorkflow(BaseModel):
    tasks: Optional[List[str]] = None
    status: Optional[Status] = None

    class Config:
        orm_mode = True
