import os
from pathlib import Path

import pytest

from jupyter_scheduler.config import ExecutionConfig
from jupyter_scheduler.orm import create_session, create_tables
from jupyter_scheduler.scheduler import Scheduler
from jupyter_scheduler.tests.mocks import MockEnvironmentManager, MockExecutionManager

pytest_plugins = ("jupyter_server.pytest_plugin",)

HERE = Path(__file__).parent.resolve()
DB_FILE_PATH = f"{HERE}/jupyter_scheduler/tests/testdb.sqlite"
DB_URL = f"sqlite:///{DB_FILE_PATH}"


@pytest.fixture
def jp_server_config(jp_server_config):
    return {
        "ServerApp": {"jpserver_extensions": {"jupyter_scheduler": True}},
        "SchedulerApp": {
            "execution_manager_class": "jupyter_scheduler.tests.mocks.MockExecutionManager",
            "environment_manager_class": "jupyter_scheduler.tests.mocks.MockEnvironmentManager",
            "db_url": DB_URL,
            "drop_tables": True,
            "task_runner_run_interval": -1,
        },
    }


@pytest.fixture(autouse=True)
def setup_db():
    create_tables(DB_URL, True)
    yield
    if os.path.exists(DB_FILE_PATH):
        os.remove(DB_FILE_PATH)


@pytest.fixture
def jp_scheduler_db():
    return create_session(DB_URL)


@pytest.fixture
def jp_scheduler():
    return Scheduler(
        ExecutionConfig(
            db_url=DB_URL,
            root_dir="",
            execution_manager_class=MockExecutionManager,
            environments_manager_class=MockEnvironmentManager,
            task_runner_run_interval=-1,
        )
    )
