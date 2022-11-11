import json
import re

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin
from jupyter_server.utils import ensure_async

from jupyter_scheduler.environments import EnvironmentRetrievalError
from jupyter_scheduler.exceptions import (
    IdempotencyTokenError,
    InputUriError,
    SchedulerError,
)
from jupyter_scheduler.models import (
    DEFAULT_MAX_ITEMS,
    DEFAULT_SORT,
    CountJobsQuery,
    CreateJob,
    CreateJobDefinition,
    CreateJobFromDefinition,
    ListJobDefinitionsQuery,
    ListJobsQuery,
    SortDirection,
    SortField,
    Status,
    UpdateJob,
    UpdateJobDefinition,
)


class JobHandlersMixin:
    _scheduler = None
    _environments_manager = None
    _execution_manager_class = None

    @property
    def scheduler(self):
        if not self._scheduler:
            self._scheduler = self.settings.get("scheduler")

        return self._scheduler

    @property
    def environments_manager(self):
        if self._environments_manager is None:
            self._environments_manager = self.settings.get("environments_manager")

        return self._environments_manager

    @property
    def execution_manager_class(self):
        if not self._execution_manager_class:
            self._execution_manager_class = self.scheduler.execution_manager_class

        return self._execution_manager_class


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


class JobDefinitionHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def get(self, job_definition_id=None):
        if job_definition_id:
            try:
                job_definition = await ensure_async(
                    self.scheduler.get_job_definition(job_definition_id)
                )
            except SchedulerError as e:
                self.log.exception(e)
                raise tornado.web.HTTPError(500, str(e)) from e
            else:
                self.finish(job_definition.json())
        else:
            create_time = self.get_query_argument("create_time", None)
            sort_by = compute_sort_model(self.get_query_arguments("sort_by"))
            list_query = ListJobDefinitionsQuery(
                job_definition_id=self.get_query_argument("job_definition_id", None),
                name=self.get_query_argument("name", None),
                tags=self.get_query_arguments("tags", None),
                create_time=int(create_time) if create_time else None,
                sort_by=sort_by if sort_by else [DEFAULT_SORT],
                max_items=self.get_query_argument("max_items", DEFAULT_MAX_ITEMS),
                next_token=self.get_query_argument("next_token", None),
            )
            try:
                list_response = await ensure_async(self.scheduler.list_job_definitions(list_query))
            except SchedulerError as e:
                self.log.exception(e)
                raise tornado.web.HTTPError(500, str(e)) from e
            else:
                self.finish(list_response.json(exclude_none=True))

    @tornado.web.authenticated
    async def post(self):
        payload = self.get_json_body()
        try:
            job_definition_id = await ensure_async(
                self.scheduler.create_job_definition(CreateJobDefinition(**payload))
            )
        except InputUriError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(
                500, "Unexpected error occurred during creation of job."
            ) from e
        else:
            self.finish(json.dumps(dict(job_definition_id=job_definition_id)))

    @tornado.web.authenticated
    async def patch(self, job_definition_id):
        payload = self.get_json_body()
        try:
            await ensure_async(
                self.scheduler.update_job_definition(
                    job_definition_id, UpdateJobDefinition(**payload)
                )
            )
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.set_status(204)
            self.finish()

    @tornado.web.authenticated
    async def delete(self, job_definition_id):
        try:
            await ensure_async(self.scheduler.delete_job_definition(job_definition_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.set_status(204)
            self.finish()


class JobHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def get(self, job_id=None):
        if job_id:
            try:
                job = await ensure_async(self.scheduler.get_job(job_id))
            except SchedulerError as e:
                self.log.exception(e)
                raise tornado.web.HTTPError(500, str(e)) from e
            else:
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
            try:
                list_jobs_response = await ensure_async(self.scheduler.list_jobs(list_jobs_query))
            except SchedulerError as e:
                self.log.exception(e)
                raise tornado.web.HTTPError(500, str(e)) from e
            else:
                self.finish(list_jobs_response.json(exclude_none=True))

    @tornado.web.authenticated
    async def post(self):
        payload = self.get_json_body()
        try:
            job_id = await ensure_async(self.scheduler.create_job(CreateJob(**payload)))
        except InputUriError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(
                500, "Unexpected error occurred during creation of job."
            ) from e
        else:
            self.finish(json.dumps(dict(job_id=job_id)))

    @tornado.web.authenticated
    async def patch(self, job_id):
        payload = self.get_json_body()

        status = payload.get("status", None)
        status = Status(status) if status else None

        if status and status != Status.STOPPED:
            raise tornado.web.HTTPError(
                500,
                "Invalid value for field 'status'. Jobs can only be updated to status 'STOPPED' after creation.",
            )

        try:
            if status:
                await ensure_async(self.scheduler.stop_job(job_id))
            else:
                await ensure_async(self.scheduler.update_job(job_id, UpdateJob(**payload)))
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.set_status(204)
            self.finish()

    @tornado.web.authenticated
    async def delete(self, job_id):
        try:
            await ensure_async(self.scheduler.delete_job(job_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.set_status(204)
            self.finish()


class JobFromDefinitionHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def post(self, job_definition_id: str):
        payload = self.get_json_body()
        try:
            model = CreateJobFromDefinition(**payload)
            job_id = await ensure_async(
                self.scheduler.create_job_from_definition(job_definition_id, model=model)
            )
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        except Exception as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(
                500, "Unexpected error occurred during creation of job."
            ) from e
        else:
            self.finish(json.dumps(dict(job_id=job_id)))


class BatchJobHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def delete(self):
        job_ids = self.get_query_arguments("job_id")
        try:
            for job_id in job_ids:
                await ensure_async(self.scheduler.delete_job(job_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.set_status(204)
            self.finish()


class JobsCountHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @tornado.web.authenticated
    async def get(self):
        status = self.get_query_argument("status", None)
        count_jobs_query = CountJobsQuery(
            status=Status(status.upper()) if status else Status.IN_PROGRESS
        )
        try:
            count = await ensure_async(self.scheduler.count_jobs(count_jobs_query))
        except SchedulerError as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.finish(json.dumps(dict(count=count)))


class RuntimeEnvironmentsHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    async def get(self):
        """Returns names of available runtime environments and output formats mappings"""
        try:
            environments = await ensure_async(self.environments_manager.list_environments())
            output_formats = await ensure_async(self.environments_manager.output_formats_mapping())
        except EnvironmentRetrievalError as e:
            raise tornado.web.HTTPError(500, str(e))

        response = []
        for environment in environments:
            env = environment.dict()
            formats = env["output_formats"]
            env["output_formats"] = [{"name": f, "label": output_formats[f]} for f in formats]
            response.append(env)

        self.finish(json.dumps(response))


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
                manage_environments_command=self.environments_manager.manage_environments_command(),
            )
        )


class FilesDownloadHandler(ExtensionHandlerMixin, APIHandler):

    _job_files_manager = None

    @property
    def job_files_manager(self):
        if not self._job_files_manager:
            self._job_files_manager = self.settings.get("job_files_manager", None)

        return self._job_files_manager

    @tornado.web.authenticated
    async def get(self, job_id):
        redownload = self.get_query_argument("redownload", False)
        try:
            await self.job_files_manager.copy_from_staging(job_id=job_id, redownload=redownload)
        except Exception as e:
            self.log.exception(e)
            raise tornado.web.HTTPError(500, str(e)) from e
        else:
            self.set_status(204)
            self.finish()
