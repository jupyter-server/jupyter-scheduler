import asyncio

from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.extension.manager import ExtensionManager
from jupyter_server.transutils import _i18n
from traitlets import Bool, Type, Unicode, default

from jupyter_scheduler.orm import create_tables
from jupyter_scheduler.output_files_manager import OutputFilesManager

from .handlers import (
    BatchJobHandler,
    ConfigHandler,
    JobDefinitionHandler,
    JobHandler,
    JobsCountHandler,
    OutputsDownloadHandler,
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
        (r"scheduler/jobs/%s/download_outputs" % JOB_ID_REGEX, OutputsDownloadHandler),
        (r"scheduler/batch/jobs", BatchJobHandler),
        (r"scheduler/job_definitions", JobDefinitionHandler),
        (r"scheduler/job_definitions/%s" % JOB_DEFINITION_ID_REGEX, JobDefinitionHandler),
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

    def _link_jupyter_server_extension(self, serverapp):
        super()._link_jupyter_server_extension(serverapp)

        # override extension loader to always load jupyter_server_fileid before
        # loading this extension
        def load_all_extensions(self):
            extension_names = self.extensions.keys()
            # avoid clobbering notebook_shim hack
            # https://github.com/jupyter/notebook_shim/blob/9768be63e28bae3b4185cae35342deab380e1e05/notebook_shim/nbserver.py#L74-L94
            extension_names = sorted(
                extension_names,
                key=(
                    lambda name: "A"
                    if name == "notebook_shim"
                    else "B"
                    if name == "jupyter_server_fileid"
                    else name
                ),
            )
            for name in extension_names:
                self.load_extension(name)

        # bind self to extension_manager and then override extension loading method
        # https://stackoverflow.com/a/46757134/12548458
        extension_manager = serverapp.extension_manager
        extension_manager.load_all_extensions = load_all_extensions.__get__(
            extension_manager, ExtensionManager
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
            file_id_manager=self.settings["file_id_manager"],
        )

        output_files_manager = OutputFilesManager(scheduler=scheduler)

        self.settings.update(
            environments_manager=environments_manager,
            scheduler=scheduler,
            output_files_manager=output_files_manager,
        )

        if scheduler.task_runner:
            loop = asyncio.get_event_loop()
            loop.create_task(scheduler.task_runner.start())
