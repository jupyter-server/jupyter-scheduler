import asyncio
import multiprocessing

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.transutils import _i18n
from traitlets import Bool, Type, Unicode, default

from jupyter_scheduler.download_manager import DownloadManager
from jupyter_scheduler.download_runner import DownloadRunner
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
        # Forces new processes to not be forked on Linux.
        # This is necessary because `asyncio.get_event_loop()` is bugged in
        # forked processes in Python versions below 3.12. This method is
        # called by `jupyter_core` by `nbconvert` in the default executor.

        # See: https://github.com/python/cpython/issues/66285
        # See also: https://github.com/jupyter/jupyter_core/pull/362
        multiprocessing.set_start_method("spawn", force=True)

        super().initialize_settings()

        create_tables(self.db_url, self.drop_tables)

        environments_manager = self.environment_manager_class()

        download_manager = DownloadManager(db_url=self.db_url)

        scheduler = self.scheduler_class(
            root_dir=self.serverapp.root_dir,
            environments_manager=environments_manager,
            db_url=self.db_url,
            download_manager=download_manager,
            config=self.config,
        )

        job_files_manager = self.job_files_manager_class(scheduler=scheduler)

        download_runner = DownloadRunner(
            download_manager=download_manager, job_files_manager=job_files_manager
        )

        self.settings.update(
            environments_manager=environments_manager,
            scheduler=scheduler,
            job_files_manager=job_files_manager,
            initiate_download=download_manager.initiate_download,
        )

        if scheduler.task_runner:
            loop = asyncio.get_event_loop()
            loop.create_task(scheduler.task_runner.start())

        if download_runner:
            loop = asyncio.get_event_loop()
            loop.create_task(download_runner.start())
