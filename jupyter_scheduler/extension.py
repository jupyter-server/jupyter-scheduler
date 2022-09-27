from jupyter_core.paths import jupyter_data_dir
from jupyter_server.extension.application import ExtensionApp
from jupyter_server.traittypes import TypeFromClasses
from jupyter_server.transutils import _i18n
from traitlets import Bool, Unicode, default

from jupyter_scheduler.orm import create_tables
from jupyter_scheduler.scheduler import Scheduler

from .config import ExecutionConfig
from .environments import CondaEnvironmentManager
from .executors import DefaultExecutionManager
from .handlers import (
    BatchJobHandler,
    ConfigHandler,
    JobDefinitionHandler,
    JobHandler,
    JobsCountHandler,
    RuntimeEnvironmentsHandler,
)

JOB_DEFINITION_ID_REGEX = r"(?P<job_definition_id>\w+-\w+-\w+-\w+-\w+)"
JOB_ID_REGEX = r"(?P<job_id>\w+-\w+-\w+-\w+-\w+)"


class SchedulerApp(ExtensionApp):
    name = "jupyter_scheduler"
    handlers = [
        (r"scheduler/jobs", JobHandler),
        (r"scheduler/jobs/count", JobsCountHandler),
        (r"scheduler/jobs/%s" % JOB_ID_REGEX, JobHandler),
        (r"scheduler/batch/jobs", BatchJobHandler),
        (r"scheduler/job_definitions", JobDefinitionHandler),
        (r"scheduler/job_definitions/%s" % JOB_DEFINITION_ID_REGEX, JobDefinitionHandler),
        (r"scheduler/runtime_environments", RuntimeEnvironmentsHandler),
        (r"scheduler/config", ConfigHandler),
    ]

    drop_tables = Bool(False, config=True, help="Drop the database tables before starting.")

    db_url = Unicode(config=True, help="URI for the scheduler database")

    @default("db_url")
    def get_db_url_default(self):
        return f"sqlite:///{jupyter_data_dir()}/scheduler.sqlite"

    environment_manager_class = TypeFromClasses(
        default_value=CondaEnvironmentManager,
        klasses=["jupyter_scheduler.environments.EnvironmentManager"],
        config=True,
        help=_i18n("The runtime environment manager class to use."),
    )

    execution_manager_class = TypeFromClasses(
        default_value=DefaultExecutionManager,
        klasses=["jupyter_scheduler.executors.ExecutionManager"],
        config=True,
        help=_i18n("The execution manager class to use."),
    )

    scheduler_class = TypeFromClasses(
        default_value=Scheduler,
        klasses=["jupyter_scheduler.scheduler.BaseScheduler"],
        config=True,
        help=_i18n("The scheduler class to use."),
    )

    def initialize_settings(self):
        super().initialize_settings()

        create_tables(self.db_url, self.drop_tables)

        self.settings.update(
            execution_config=ExecutionConfig(
                db_url=self.db_url,
                execution_manager_class=self.execution_manager_class,
                environments_manager_class=self.environment_manager_class,
                scheduler_class=self.scheduler_class,
                root_dir=self.settings.get("server_root_dir", None),
            )
        )
