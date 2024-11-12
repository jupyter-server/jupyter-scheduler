import asyncio

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.transutils import _i18n
from traitlets import Bool, Type, Unicode, default

from jupyter_scheduler.orm import create_tables
from jupyter_scheduler.workflows import (
    WorkflowDefinitionsDeploymentHandler,
    WorkflowDefinitionsHandler,
    WorkflowDefinitionsTasksHandler,
    WorkflowsHandler,
    WorkflowsRunHandler,
    WorkflowsTasksHandler,
)

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
WORKFLOW_DEFINITION_ID_REGEX = r"(?P<workflow_definition_id>\w+(?:-\w+)+)"
WORKFLOW_ID_REGEX = r"(?P<workflow_id>\w+(?:-\w+)+)"


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
        (r"scheduler/workflows", WorkflowsHandler),
        (rf"scheduler/workflows/{WORKFLOW_ID_REGEX}", WorkflowsHandler),
        (
            rf"scheduler/workflows/{WORKFLOW_ID_REGEX}/run",
            WorkflowsRunHandler,
        ),
        (
            rf"scheduler/workflows/{WORKFLOW_ID_REGEX}/tasks",
            WorkflowsTasksHandler,
        ),
        (r"scheduler/workflow_definitions", WorkflowDefinitionsHandler),
        (
            rf"scheduler/workflow_definitions/{WORKFLOW_DEFINITION_ID_REGEX}",
            WorkflowDefinitionsHandler,
        ),
        (
            rf"scheduler/workflow_definitions/{WORKFLOW_DEFINITION_ID_REGEX}/deploy",
            WorkflowDefinitionsDeploymentHandler,
        ),
        (
            rf"scheduler/workflow_definitions/{WORKFLOW_DEFINITION_ID_REGEX}/tasks",
            WorkflowDefinitionsTasksHandler,
        ),
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

        scheduler = self.scheduler_class(
            root_dir=self.serverapp.root_dir,
            environments_manager=environments_manager,
            db_url=self.db_url,
            config=self.config,
        )

        job_files_manager = self.job_files_manager_class(scheduler=scheduler)

        self.settings.update(
            environments_manager=environments_manager,
            scheduler=scheduler,
            job_files_manager=job_files_manager,
        )

        if scheduler.task_runner:
            loop = asyncio.get_event_loop()
            loop.create_task(scheduler.task_runner.start())

        if scheduler.workflow_runner:
            loop = asyncio.get_event_loop()
            loop.create_task(scheduler.workflow_runner.start())

    async def stop_extension(self):
        """
        Public method called by Jupyter Server when the server is stopping.
        This calls the cleanup code defined in `self._stop_exception()` inside
        an exception handler, as the server halts if this method raises an
        exception.
        """
        try:
            await self._stop_extension()
        except Exception as e:
            self.log.error("Jupyter Scheduler raised an exception while stopping:")

            self.log.exception(e)

    async def _stop_extension(self):
        """
        Private method that defines the cleanup code to run when the server is
        stopping.
        """
        if "scheduler" in self.settings:
            scheduler: SchedulerApp = self.settings["scheduler"]
            await scheduler.stop_extension()
