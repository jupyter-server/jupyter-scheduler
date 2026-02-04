import json
import logging
import re
from typing import Optional

from jupyter_server.base.handlers import APIHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin
from jupyter_server.utils import ensure_async
from tornado.web import HTTPError, authenticated

from jupyter_scheduler.backend_registry import BackendInstance, BackendRegistry
from jupyter_scheduler.environments import EnvironmentRetrievalError
from jupyter_scheduler.exceptions import (
    IdempotencyTokenError,
    InputUriError,
    SchedulerError,
)
from jupyter_scheduler.job_id import parse_job_id, resolve_scheduler
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
from jupyter_scheduler.pydantic_v1 import ValidationError
from jupyter_scheduler.scheduler import BaseScheduler

logger = logging.getLogger(__name__)


class JobHandlersMixin:
    _scheduler = None
    _environments_manager = None
    _execution_manager_class = None
    _backend_registry = None

    @property
    def scheduler(self):
        if self._scheduler is None:
            self._scheduler = self.settings.get("scheduler")
        return self._scheduler

    @property
    def backend_registry(self) -> Optional[BackendRegistry]:
        if self._backend_registry is None:
            self._backend_registry = self.settings.get("backend_registry")
        return self._backend_registry

    @property
    def environments_manager(self):
        if self._environments_manager is None:
            self._environments_manager = self.settings.get("environments_manager")
        return self._environments_manager

    def get_scheduler(self, job_id: str) -> BaseScheduler:
        """Get scheduler for a job ID. Raises HTTPError(400) if backend unavailable."""
        try:
            return resolve_scheduler(job_id, self.backend_registry)
        except ValueError as e:
            raise HTTPError(400, str(e))

    def resolve_backend_for_job(self, payload: dict) -> BackendInstance:
        """Resolve backend from payload['backend_id'] or auto-select by file extension."""
        backend_id = payload.get("backend_id")
        if backend_id:
            backend = self.backend_registry.get_backend(backend_id)
            if not backend:
                raise HTTPError(404, f"Backend not found: {backend_id}")
            return backend
        # Auto-select based on file extension
        try:
            return self.backend_registry.get_for_file(payload.get("input_uri", ""))
        except ValueError as e:
            raise HTTPError(400, str(e)) from e

    @property
    def execution_manager_class(self):
        if self._execution_manager_class is None:
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
    @authenticated
    async def get(self, job_definition_id=None):
        if job_definition_id:
            try:
                job_definition = await ensure_async(
                    self.scheduler.get_job_definition(job_definition_id)
                )
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(
                    500, f"Unexpected error while getting job definition details: {e}"
                ) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500, f"Unexpected error while getting job definition details: {e}"
                ) from e
            else:
                self.finish(job_definition.json())
        else:
            create_time = self.get_query_argument("create_time", None)
            sort_by = compute_sort_model(self.get_query_arguments("sort_by"))
            try:
                list_query = ListJobDefinitionsQuery(
                    job_definition_id=self.get_query_argument("job_definition_id", None),
                    name=self.get_query_argument("name", None),
                    tags=self.get_query_arguments("tags", None),
                    create_time=int(create_time) if create_time else None,
                    sort_by=sort_by if sort_by else [DEFAULT_SORT],
                    max_items=self.get_query_argument("max_items", DEFAULT_MAX_ITEMS),
                    next_token=self.get_query_argument("next_token", None),
                )
                list_response = await ensure_async(self.scheduler.list_job_definitions(list_query))
            except ValidationError as e:
                self.log.exception(e)
                raise HTTPError(400, f"Validation error: {e}") from e
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(
                    500, f"Unexpected error while getting job definition list: {e}"
                ) from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(
                    500, f"Unexpected error while getting job definition list: {e}"
                ) from e
            else:
                self.finish(list_response.json(exclude_none=True))

    @authenticated
    async def post(self):
        payload = self.get_json_body()
        try:
            backend = self.resolve_backend_for_job(payload)
            payload["backend_id"] = backend.config.id
            scheduler = backend.scheduler

            job_definition_id = await ensure_async(
                scheduler.create_job_definition(CreateJobDefinition(**payload))
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(400, f"Validation error: {e}") from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job definition: {e}") from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job definition: {e}") from e
        except HTTPError:
            # Re-raise HTTPError as-is (e.g., 400 for invalid backend)
            raise
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job definition: {e}") from e
        else:
            self.finish(json.dumps(dict(job_definition_id=job_definition_id)))

    @authenticated
    async def patch(self, job_definition_id):
        payload = self.get_json_body()
        try:
            await ensure_async(
                self.scheduler.update_job_definition(
                    job_definition_id, UpdateJobDefinition(**payload)
                )
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(400, f"Validation error: {e}") from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while updating the job definition: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while updating the job definition: {e}") from e
        else:
            self.set_status(204)
            self.finish()

    @authenticated
    async def delete(self, job_definition_id):
        try:
            await ensure_async(self.scheduler.delete_job_definition(job_definition_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while deleting the job definition: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while deleting the job definition: {e}") from e
        else:
            self.set_status(204)
            self.finish()


class JobHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def get(self, job_id=None):
        if job_id:
            try:
                scheduler = self.get_scheduler(job_id)
                job = await ensure_async(scheduler.get_job(job_id))
                # Populate backend_id for legacy jobs (NULL in DB)
                if not job.backend_id:
                    job.backend_id = self.backend_registry.get_legacy_job_backend().config.id
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, f"Unexpected error while getting job details: {e}") from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(500, f"Unexpected error while getting job details: {e}") from e
            else:
                self.finish(job.json())
        else:
            status = self.get_query_argument("status", None)
            start_time = self.get_query_argument("start_time", None)
            sort_by = compute_sort_model(self.get_query_arguments("sort_by"))
            try:
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

                # Query jobs from legacy job backend (all backends share same DB)
                # Job IDs are already stored as 'backend:uuid' format
                legacy_backend = self.backend_registry.get_legacy_job_backend()
                list_jobs_response = await ensure_async(
                    legacy_backend.scheduler.list_jobs(list_jobs_query)
                )

                # Populate backend_id for legacy jobs (NULL in DB)
                for job in list_jobs_response.jobs:
                    if not job.backend_id:
                        job.backend_id = legacy_backend.config.id

                # For QUEUED/IN_PROGRESS jobs, route through their backend's scheduler
                # This allows backend-specific schedulers (like BraketScheduler) to sync status
                for i, job in enumerate(list_jobs_response.jobs):
                    if job.status in (Status.QUEUED, Status.IN_PROGRESS):
                        backend_id, _ = parse_job_id(job.job_id)
                        # Legacy jobs (backend_id=None) stay with legacy backend
                        backend = (
                            self.backend_registry.get_backend(backend_id) if backend_id else None
                        )
                        if backend and backend.scheduler != legacy_backend.scheduler:
                            # Call backend's get_job which triggers status sync
                            try:
                                synced_job = await ensure_async(
                                    backend.scheduler.get_job(job.job_id, job_files=False)
                                )
                                list_jobs_response.jobs[i] = synced_job
                            except Exception as e:
                                self.log.warning(f"Failed to sync status for job {job.job_id}: {e}")
            except ValidationError as e:
                self.log.exception(e)
                raise HTTPError(400, f"Validation error: {e}") from e
            except SchedulerError as e:
                self.log.exception(e)
                raise HTTPError(500, f"Unexpected error while getting jobs list: {e}") from e
            except Exception as e:
                self.log.exception(e)
                raise HTTPError(500, f"Unexpected error while getting jobs list: {e}") from e
            else:
                self.finish(list_jobs_response.json(exclude_none=True))

    @authenticated
    async def post(self):
        payload = self.get_json_body()
        try:
            backend = self.resolve_backend_for_job(payload)
            payload["backend_id"] = backend.config.id
            scheduler = backend.scheduler

            # Set default output_formats from backend if not specified
            if not payload.get("output_formats"):
                if backend.config.output_formats:
                    payload["output_formats"] = [f["id"] for f in backend.config.output_formats]

            job_id = await ensure_async(scheduler.create_job(CreateJob(**payload)))
            # Job ID is already in backend:uuid format from scheduler (no wrapping needed)
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(400, f"Validation error: {e}") from e
        except InputUriError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job: {e}") from e
        except IdempotencyTokenError as e:
            self.log.exception(e)
            raise HTTPError(409, str(e)) from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job: {e}") from e
        except HTTPError:
            # Re-raise HTTPError as-is (e.g., 400 for invalid backend)
            raise
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job: {e}") from e
        else:
            response = {"job_id": job_id}
            if "backend_id" in payload:
                response["backend_id"] = payload["backend_id"]
            self.finish(json.dumps(response))

    @authenticated
    async def patch(self, job_id):
        payload = self.get_json_body()

        status = payload.get("status", None)
        status = Status(status) if status else None

        if status and status != Status.STOPPED:
            raise HTTPError(
                500,
                "Invalid value for field 'status'. Jobs can only be updated to status 'STOPPED' after creation.",
            )

        try:
            scheduler = self.get_scheduler(job_id)
            if status:
                await ensure_async(scheduler.stop_job(job_id))
            else:
                await ensure_async(scheduler.update_job(job_id, UpdateJob(**payload)))
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(400, f"Validation error: {e}") from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while updating the job: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while updating the job: {e}") from e
        else:
            self.set_status(204)
            self.finish()

    @authenticated
    async def delete(self, job_id):
        try:
            scheduler = self.get_scheduler(job_id)
            await ensure_async(scheduler.delete_job(job_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while deleting the job: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while deleting the job: {e}") from e
        else:
            self.set_status(204)
            self.finish()


class JobFromDefinitionHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def post(self, job_definition_id: str):
        payload = self.get_json_body()
        try:
            model = CreateJobFromDefinition(**payload)
            job_id = await ensure_async(
                self.scheduler.create_job_from_definition(job_definition_id, model=model)
            )
        except ValidationError as e:
            self.log.exception(e)
            raise HTTPError(400, f"Validation error: {e}") from e
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during creation of job: {e}") from e
        else:
            self.finish(json.dumps(dict(job_id=job_id)))


class BatchJobHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def delete(self):
        job_ids = self.get_query_arguments("job_id")
        try:
            for job_id in job_ids:
                scheduler = self.get_scheduler(job_id)
                await ensure_async(scheduler.delete_job(job_id))
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during deletion of jobs: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error during deletion of jobs: {e}") from e
        else:
            self.set_status(204)
            self.finish()


class JobsCountHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def get(self):
        status = self.get_query_argument("status", None)
        count_jobs_query = CountJobsQuery(
            status=Status(status.upper()) if status else Status.IN_PROGRESS
        )
        try:
            count = await ensure_async(self.scheduler.count_jobs(count_jobs_query))
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while getting job count: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while getting job count: {e}") from e
        else:
            self.finish(json.dumps(dict(count=count)))


class RuntimeEnvironmentsHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    async def get(self):
        """Returns names of available runtime environments and output formats mappings"""
        try:
            environments = await ensure_async(self.environments_manager.list_environments())
            output_formats = await ensure_async(self.environments_manager.output_formats_mapping())
        except EnvironmentRetrievalError as e:
            raise HTTPError(500, f"Unexpected error while listing environments: {e}")

        response = []
        for environment in environments:
            env = environment.dict()
            formats = env["output_formats"]
            env["output_formats"] = [{"id": f, "label": output_formats[f]} for f in formats]
            response.append(env)

        self.finish(json.dumps(response))


class FeaturesHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
    def get(self):
        cls = self.execution_manager_class
        self.finish(json.dumps(cls.supported_features(cls)))


class ConfigHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    @authenticated
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

    @authenticated
    async def get(self, job_id):
        redownload = self.get_query_argument("redownload", False)
        try:
            await self.job_files_manager.copy_from_staging(job_id=job_id, redownload=redownload)
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while downloading files: {e}") from e
        else:
            self.set_status(204)
            self.finish()


class BackendsHandler(ExtensionHandlerMixin, JobHandlersMixin, APIHandler):
    """Handler for listing available backends.

    GET /scheduler/backends - Returns list of available execution backends.
    """

    @authenticated
    async def get(self):
        """List available backends."""
        try:
            registry = self.backend_registry
            if registry is None:
                raise HTTPError(500, "Backend registry not initialized")

            backends = registry.describe_backends()
            self.finish(json.dumps([b.dict() for b in backends]))
        except SchedulerError as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while listing backends: {e}") from e
        except Exception as e:
            self.log.exception(e)
            raise HTTPError(500, f"Unexpected error while listing backends: {e}") from e
