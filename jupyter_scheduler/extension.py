import asyncio
import warnings

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.transutils import _i18n
from traitlets import Bool, List as TList, Type, Unicode, default

from jupyter_scheduler.backend_registry import BackendRegistry
from jupyter_scheduler.backends import BackendConfig
from jupyter_scheduler.orm import create_tables

from .handlers import (
    BackendsHandler,
    BatchJobHandler,
    ConfigHandler,
    FilesDownloadHandler,
    JobDefinitionHandler,
    JobFromDefinitionHandler,
    JobHandler,
    JobsCountHandler,
    RuntimeEnvironmentsHandler,
)

JOB_DEFINITION_ID_REGEX = r"(?P<job_definition_id>\w+(?:-\w+)+)"
JOB_ID_REGEX = r"(?P<job_id>\w+(?:-\w+)+)"


class SchedulerApp(ExtensionApp):
    name = "jupyter_scheduler"
    handlers = [
        (r"scheduler/backends", BackendsHandler),
        (r"scheduler/jobs", JobHandler),
        (r"scheduler/jobs/count", JobsCountHandler),
        (r"scheduler/jobs/%s" % JOB_ID_REGEX, JobHandler),
        (r"scheduler/jobs/%s/download_files" % JOB_ID_REGEX, FilesDownloadHandler),
        (r"scheduler/batch/jobs", BatchJobHandler),
        (r"scheduler/job_definitions", JobDefinitionHandler),
        (r"scheduler/job_definitions/%s" % JOB_DEFINITION_ID_REGEX, JobDefinitionHandler),
        (r"scheduler/job_definitions/%s/jobs" % JOB_DEFINITION_ID_REGEX, JobFromDefinitionHandler),
        (r"scheduler/runtime_environments", RuntimeEnvironmentsHandler),
        (r"scheduler/config", ConfigHandler),
    ]

    drop_tables = Bool(False, config=True, help="Drop the database tables before starting.")

    db_url = Unicode(config=True, help="URI for the scheduler database")

    @default("db_url")
    def _db_url_default(self):
        return f"sqlite:///{jupyter_data_dir()}/scheduler.sqlite"

    backends = TList(
        config=True,
        help=_i18n(
            """List of backend configurations. Each backend bundles a scheduler_class,
            execution_manager_class, and optionally database_manager_class. When multiple
            backends are configured, users can select which backend to use when creating jobs."""
        ),
    )

    @default("backends")
    def _default_backends(self):
        return []

    environment_manager_class = Type(
        default_value="jupyter_scheduler.environments.CondaEnvironmentManager",
        klass="jupyter_scheduler.environments.EnvironmentManager",
        config=True,
        help=_i18n("The runtime environment manager class to use."),
    )

    scheduler_class = Type(
        default_value="jupyter_scheduler.scheduler.Scheduler",
        klass="jupyter_scheduler.scheduler.BaseScheduler",
        config=True,
        help=_i18n(
            "The scheduler class to use. Deprecated: use 'backends' configuration instead."
        ),
    )

    job_files_manager_class = Type(
        default_value="jupyter_scheduler.job_files_manager.JobFilesManager",
        klass="jupyter_scheduler.job_files_manager.JobFilesManager",
        config=True,
        help=_i18n("The job files manager class to use."),
    )

    def _build_backend_configs(self) -> list:
        """Build backend configurations from settings.

        Supports both new `backends` config and legacy `scheduler_class` trait
        for backwards compatibility.

        Returns
        -------
        list
            List of BackendConfig objects
        """
        if self.backends:
            # Use new backends configuration
            return [BackendConfig(**cfg) for cfg in self.backends]

        # Legacy mode: create single backend from scheduler_class
        # Get execution_manager_class from scheduler if configured
        exec_manager_class = "jupyter_scheduler.executors.DefaultExecutionManager"

        # Check if scheduler_class has execution_manager_class configured
        scheduler_class_name = (
            self.scheduler_class
            if isinstance(self.scheduler_class, str)
            else f"{self.scheduler_class.__module__}.{self.scheduler_class.__name__}"
        )

        return [
            BackendConfig(
                id="local",
                name="Local Execution",
                description="Execute notebooks locally on the Jupyter server",
                scheduler_class=scheduler_class_name,
                execution_manager_class=exec_manager_class,
                file_extensions=["ipynb"],
                is_default=True,
                priority=0,
            )
        ]

    def initialize_settings(self):
        super().initialize_settings()

        environments_manager = self.environment_manager_class()

        # Build backend configurations
        backend_configs = self._build_backend_configs()

        # Determine default backend
        default_id = next(
            (c.id for c in backend_configs if c.is_default), backend_configs[0].id
        )

        # Create and initialize the backend registry
        registry = BackendRegistry(backend_configs, default_id)
        registry.initialize(
            root_dir=self.serverapp.root_dir,
            environments_manager=environments_manager,
            db_url=self.db_url,
            config=self.config,
        )

        # Get the default backend for backwards compatibility
        default_backend = registry.get_default()
        scheduler = default_backend.scheduler

        job_files_manager = self.job_files_manager_class(scheduler=scheduler)

        self.settings.update(
            environments_manager=environments_manager,
            scheduler=scheduler,  # Backwards compatibility
            backend_registry=registry,  # New multi-backend support
            job_files_manager=job_files_manager,
        )

        # Start task runners for all backends that have them
        loop = asyncio.get_event_loop()
        for backend in registry.list_backend_instances():
            if hasattr(backend.scheduler, "task_runner") and backend.scheduler.task_runner:
                loop.create_task(backend.scheduler.task_runner.start())
