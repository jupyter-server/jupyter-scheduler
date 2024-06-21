from dask.distributed import Client as DaskClient
from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.transutils import _i18n
from traitlets import Bool, Type, Unicode, default

from jupyter_scheduler.orm import create_tables

from .handlers import (
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
        help=_i18n("The scheduler class to use."),
    )

    job_files_manager_class = Type(
        default_value="jupyter_scheduler.job_files_manager.JobFilesManager",
        klass="jupyter_scheduler.job_files_manager.JobFilesManager",
        config=True,
        help=_i18n("The job files manager class to use."),
    )

    def initialize_settings(self):
        super().initialize_settings()

        create_tables(self.db_url, self.drop_tables)

        environments_manager = self.environment_manager_class()

        asyncio_loop = self.serverapp.io_loop.asyncio_loop
        dask_client_future = asyncio_loop.create_task(self._get_dask_client())

        scheduler = self.scheduler_class(
            root_dir=self.serverapp.root_dir,
            environments_manager=environments_manager,
            db_url=self.db_url,
            config=self.config,
            dask_client_future=dask_client_future,
        )

        job_files_manager = self.job_files_manager_class(scheduler=scheduler)

        self.settings.update(
            environments_manager=environments_manager,
            scheduler=scheduler,
            job_files_manager=job_files_manager,
            dask_client_future=dask_client_future,
        )

        if scheduler.task_runner:
            asyncio_loop.create_task(scheduler.task_runner.start())

    async def _get_dask_client(self):
        """Creates and configures a Dask client."""
        return DaskClient(processes=False, asynchronous=True)

    async def stop_extension(self):
        """Called by the Jupyter Server when stopping to cleanup resources."""
        try:
            await self._stop_extension()
        except Exception as e:
            self.log.error("Error while stopping Jupyter Scheduler:")
            self.log.exception(e)

    async def _stop_extension(self):
        """Closes the Dask client if it exists."""
        if "dask_client_future" in self.settings:
            dask_client: DaskClient = await self.settings["dask_client_future"]
            self.log.info("Closing Dask client.")
            await dask_client.close()
            self.log.info("Dask client closed.")
