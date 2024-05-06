from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.orm import Base
from jupyter_scheduler.scheduler import Scheduler
from jupyter_scheduler.tests.mocks import MockEnvironmentManager

pytest_plugins = ("jupyter_server.pytest_plugin", "pytest_jupyter.jupyter_server")


@pytest.fixture
def static_test_files_dir():
    return Path(__file__).parent.resolve() / "jupyter_scheduler" / "tests" / "static"


@pytest.fixture
def jp_scheduler_root_dir(tmp_path):
    root_dir = tmp_path / "workspace_root"
    root_dir.mkdir()
    return root_dir


@pytest.fixture
def jp_scheduler_staging_dir(jp_data_dir):
    staging_area = jp_data_dir / "scheduler_staging_area"
    staging_area.mkdir()
    return staging_area


@pytest.fixture
def jp_scheduler_db_url(jp_scheduler_staging_dir):
    db_file_path = jp_scheduler_staging_dir / "scheduler.sqlite"
    return f"sqlite:///{db_file_path}"


@pytest.fixture
def jp_scheduler_db(jp_scheduler_db_url):
    engine = create_engine(jp_scheduler_db_url, echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()


@pytest.fixture
def jp_scheduler(jp_scheduler_db_url, jp_scheduler_root_dir, jp_scheduler_db):
    return Scheduler(
        db_url=jp_scheduler_db_url,
        root_dir=str(jp_scheduler_root_dir),
        environments_manager=MockEnvironmentManager(),
    )


@pytest.fixture
def jp_server_config(jp_scheduler_db_url, jp_server_config):
    return {
        "ServerApp": {"jpserver_extensions": {"jupyter_scheduler": True}},
        "SchedulerApp": {
            "db_url": jp_scheduler_db_url,
            "drop_tables": True,
            "environment_manager_class": "jupyter_scheduler.tests.mocks.MockEnvironmentManager",
        },
        "BaseScheduler": {
            "execution_manager_class": "jupyter_scheduler.tests.mocks.MockExecutionManager"
        },
        "Scheduler": {"task_runner_class": "jupyter_scheduler.tests.mocks.MockTaskRunner"},
    }
