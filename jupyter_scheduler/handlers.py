import inspect
import json
import re
from dataclasses import asdict

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin
from jupyter_server.utils import ensure_async

from jupyter_scheduler.environments import EnvironmentRetrievalError
from jupyter_scheduler.models import (
    DEFAULT_MAX_ITEMS,
    DEFAULT_SORT,
    CountJobsQuery,
    CreateJob,
    ListJobsQuery,
    SortDirection,
    SortField,
    Status,
    UpdateJob,
)


class JobHandlersMixin:
    _scheduler = None
    _environment_manager = None

    @property
    def execution_config(self):
        return self.settings.get("execution_config", {})

    @property
    def scheduler(self):
        if self._scheduler is None:
            scheduler_class = self.execution_config.scheduler_class
            self._scheduler = scheduler_class(self.execution_config)

        return self._scheduler

    @property
    def environment_manager(self):
        if self._environment_manager is None:
            config = self.settings.get("execution_config")
            self._environment_manager = config.environments_manager_class()
        return self._environment_manager

    @property
    def execution_manager_class(self):
        return self.execution_config.execution_manager_class


class JobDefinitionHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    def get(self, job_definition_id=None):
        raise tornado.web.HTTPError(500, f"Not implemented yet")

    @tornado.web.authenticated
    def post(self):
        raise tornado.web.HTTPError(500, f"Not implemented yet")


def compute_sort_model(query_argument):
    sort_by = []
    PATTERN = re.compile("^(asc|desc)?\\(?([^\\)]+)\\)?", re.IGNORECASE)
    for query in query_argument:
        m = re.match(PATTERN, query)
        sort_dir, name = m.groups()
        sort_by.append(
            SortField(
                name=name,
                direction=SortDirection(sort_dir.lower()) if sort_dir else SortDirection.asc,
            )
        )

    return sort_by


class JobHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def get(self, job_id=None):
        if job_id:
            job = await ensure_async(self.scheduler.get_job(job_id))
            self.finish(job.json())
        else:
            status = self.get_query_argument("status", None)
            start_time = self.get_query_argument("start_time", None)
            sort_by = compute_sort_model(self.get_query_arguments("sort_by"))
            list_jobs_query = ListJobsQuery(
                job_definition_id=self.get_query_argument("job_definition_id", None),
                status=Status(status.upper()) if status else None,
                name=self.get_query_argument("name", None),
                tags=self.get_query_arguments("tags", None),
                start_time=int(start_time) if start_time else None,
                sort_by=sort_by if sort_by else [DEFAULT_SORT],
                max_items=self.get_query_argument("max_items", DEFAULT_MAX_ITEMS),
                next_token=self.get_query_argument("next_token", None),
            )
            list_jobs_response = await ensure_async(self.scheduler.list_jobs(list_jobs_query))

            self.finish(list_jobs_response.json(exclude_none=True))

    @tornado.web.authenticated
    async def post(self):
        payload = self.get_json_body()
        job_id = await ensure_async(self.scheduler.create_job(CreateJob(**payload)))

        self.finish(json.dumps(dict(job_id=job_id)))

    @tornado.web.authenticated
    async def patch(self, job_id):
        payload = self.get_json_body()

        if "status" not in payload:
            raise tornado.web.HTTPError(500, "Field 'status' missing in request body")

        status = Status(payload.get("status"))
        if status == Status.STOPPED:
            await ensure_async(self.scheduler.stop_job(job_id))
        else:
            await ensure_async(
                self.scheduler.update_job(UpdateJob(job_id=job_id, status=str(status)))
            )

        self.set_status(204)
        self.finish()

    @tornado.web.authenticated
    async def delete(self, job_id):
        await ensure_async(self.scheduler.delete_job(job_id))

        self.set_status(204)
        self.finish()


class BatchJobHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def delete(self):
        job_ids = self.get_query_arguments("job_id")
        for job_id in job_ids:
            await ensure_async(self.scheduler.delete_job(job_id))

        self.set_status(204)
        self.finish()


class JobsCountHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def get(self):
        status = self.get_query_argument("status", None)
        count_jobs_query = CountJobsQuery(
            status=Status(status.upper()) if status else Status.IN_PROGRESS
        )
        count = await ensure_async(self.scheduler.count_jobs(count_jobs_query))

        self.finish(json.dumps(dict(count=count)))


class RuntimeEnvironmentsHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    _environment_manager = None

    @property
    def environment_manager(self):
        if self._environment_manager is None:
            config = self.settings.get("execution_config")
            self._environment_manager = config.environments_manager_class()
        return self._environment_manager

    async def get(self):
        """Returns names of available runtime environments"""

        try:
            environments = await ensure_async(self.environment_manager.list_environments())
        except EnvironmentRetrievalError as e:
            raise tornado.web.HTTPError(500, str(e))

        self.finish(json.dumps([environment.dict() for environment in environments]))


class FeaturesHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    def get(self):
        cls = self.execution_manager_class
        self.finish(json.dumps(cls.supported_features(cls)))


class ConfigHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(
            dict(
                supported_features=self.execution_manager_class.supported_features(
                    self.execution_manager_class
                ),
                manage_environments_command=self.environment_manager.manage_environments_command(),
            )
        )
