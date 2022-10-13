import os
from pathlib import Path

import pytest

from jupyter_scheduler.orm import create_session, create_tables
from jupyter_scheduler.scheduler import Scheduler
from jupyter_scheduler.tests.mocks import MockEnvironmentManager

pytest_plugins = ("jupyter_server.pytest_plugin",)

HERE = Path(__file__).parent.resolve()
DB_FILE_PATH = f"{HERE}/jupyter_scheduler/tests/testdb.sqlite"
DB_URL = f"sqlite:///{DB_FILE_PATH}"


@pytest.fixture
def jp_server_config(jp_server_config):
    return {
        "ServerApp": {"jpserver_extensions": {"jupyter_scheduler": True}},
        "SchedulerApp": {
            "db_url": DB_URL,
            "drop_tables": True,
            "environment_manager_class": "jupyter_scheduler.tests.mocks.MockEnvironmentManager",
        },
        "BaseScheduler": {
            "execution_manager_class": "jupyter_scheduler.tests.mocks.MockExecutionManager"
        },
        "Scheduler": {"task_runner_class": "jupyter_scheduler.tests.mocks.MockTaskRunner"},
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
def jp_scheduler(jp_data_dir):
    return Scheduler(
        db_url=DB_URL, root_dir=str(jp_data_dir), environments_manager=MockEnvironmentManager()
    )
