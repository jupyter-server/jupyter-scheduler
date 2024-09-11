import json
from typing import List

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
from jupyter_scheduler.models import Status
from jupyter_scheduler.pydantic_v1 import BaseModel, ValidationError


class WorkflowHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self):
        payload = self.get_json_body()
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


class CreateWorkflow(BaseModel):
    tasks: List[str]


class DescribeWorkflow(BaseModel):
    workflow_id: str
    tasks: List[str] = None
    status: Status = Status.CREATED

    class Config:
        orm_mode = True


class UpdateWorkflow(BaseModel):
    workflow_id: str
    tasks: List[str] = None
    status: Status = None

    class Config:
        orm_mode = True
