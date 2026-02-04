import asyncio

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.transutils import _i18n
from traitlets import Bool
from traitlets import Dict as TDict
from traitlets import Type, Unicode, default

from jupyter_scheduler.backend_registry import BackendRegistry
from jupyter_scheduler.backend_utils import discover_backends, get_legacy_job_backend_id
from jupyter_scheduler.backends import JUPYTER_SERVER_NB_BACKEND_ID, BackendConfig
from jupyter_scheduler.base_backend import BaseBackend

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
# Job IDs are in format "backend_id:uuid" like "jupyter_server_nb:abc123-def456-..."
JOB_ID_REGEX = r"(?P<job_id>[\w:%-]+)"


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

    legacy_job_backend = Unicode(
        default_value=None,
        allow_none=True,
        config=True,
        help=_i18n("ID of the backend to route jobs with UUID-only IDs (created before v3.0)."),
    )

    backend_config = TDict(
        config=True,
        help=_i18n(
            """Per-backend configuration overrides, keyed by backend ID.
            Example: {'k8s': {'db_url': 'postgresql://...'}}
            Supported keys: db_url, metadata."""
        ),
    )

    preferred_backends = TDict(
        config=True,
        help=_i18n(
            "Defines backend selected by default when creating a job for each file extension, "
            "when multiple backends support the same extension. "
            "Maps file extension (str) to backend ID (str). "
            "Example: {'ipynb': 'jupyter_server_nb', 'py': 'jupyter_server_py'}"
        ),
    )

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
            """The scheduler class for the local backend. This allows customization
            of the local scheduler implementation without defining a full backend."""
        ),
    )

    job_files_manager_class = Type(
        default_value="jupyter_scheduler.job_files_manager.JobFilesManager",
        klass="jupyter_scheduler.job_files_manager.JobFilesManager",
        config=True,
        help=_i18n("The job files manager class to use."),
    )

    def _build_backend_configs(
        self, backend_classes: dict[str, type[BaseBackend]]
    ) -> list[BackendConfig]:
        """Build BackendConfig objects from discovered backends, applying per-backend overrides."""
        configs = []

        for backend_id, backend_class in backend_classes.items():
            # Get per-backend overrides from configuration
            overrides = self.backend_config.get(backend_id, {})

            # Handle scheduler_class override for the default notebook backend
            # This maintains backwards compatibility with scheduler_class traitlet
            scheduler_class_path = backend_class.scheduler_class
            if backend_id == JUPYTER_SERVER_NB_BACKEND_ID and self.scheduler_class:
                # User may have configured a custom scheduler class
                if isinstance(self.scheduler_class, str):
                    scheduler_class_path = self.scheduler_class
                elif self.scheduler_class.__module__ != "jupyter_scheduler.scheduler":
                    # Non-default scheduler class configured
                    scheduler_class_path = (
                        f"{self.scheduler_class.__module__}.{self.scheduler_class.__name__}"
                    )

            config = BackendConfig(
                id=backend_class.id,
                name=backend_class.name,
                description=backend_class.description,
                scheduler_class=scheduler_class_path,
                execution_manager_class=backend_class.execution_manager_class,
                database_manager_class=backend_class.database_manager_class,
                db_url=overrides.get("db_url"),
                file_extensions=list(backend_class.file_extensions),
                output_formats=list(backend_class.output_formats),
                metadata=overrides.get("metadata"),
            )
            configs.append(config)

        return configs

    def initialize_settings(self):
        super().initialize_settings()

        backend_classes = discover_backends(log=self.log)

        if not backend_classes:
            raise ValueError(
                f"No scheduler backends available. The '{JUPYTER_SERVER_NB_BACKEND_ID}' backend "
                "should be registered via entry points. Check your jupyter_scheduler installation."
            )

        backend_configs = self._build_backend_configs(backend_classes)

        default_id = get_legacy_job_backend_id(
            backend_classes,
            legacy_job_backend=self.legacy_job_backend,
        )

        environments_manager = self.environment_manager_class()

        registry = BackendRegistry(backend_configs, default_id, self.preferred_backends)
        registry.initialize(
            root_dir=self.serverapp.root_dir,
            environments_manager=environments_manager,
            db_url=self.db_url,
            config=self.config,
        )

        legacy_backend = registry.get_legacy_job_backend()
        scheduler = legacy_backend.scheduler

        job_files_manager = self.job_files_manager_class(backend_registry=registry)

        self.settings.update(
            environments_manager=environments_manager,
            scheduler=scheduler,  # Backwards compatibility with handlers expecting single scheduler (uses legacy job backend)
            backend_registry=registry,
            job_files_manager=job_files_manager,
        )

        loop = asyncio.get_event_loop()
        for backend in registry.backends:
            if hasattr(backend.scheduler, "task_runner") and backend.scheduler.task_runner:
                loop.create_task(backend.scheduler.task_runner.start())

        self.log.info(
            f"Initialized {len(backend_configs)} backend(s): "
            f"{[c.id for c in backend_configs]} (legacy_job_backend: {default_id})"
        )
