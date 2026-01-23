from pathlib import Path
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.orm import Base
from jupyter_scheduler.scheduler import Scheduler
from jupyter_scheduler.tests.mocks import MockEnvironmentManager, MockTestBackend

pytest_plugins = ("jupyter_server.pytest_plugin", "pytest_jupyter.jupyter_server")


def _mock_discover_backends(*args, **kwargs):
    """Return test backends for testing."""
    from jupyter_scheduler.backends import JupyterServerNotebookBackend

    return {"jupyter_server_nb": JupyterServerNotebookBackend, "test": MockTestBackend}


@pytest.fixture(autouse=True)
def mock_backend_discovery():
    """Patch backend discovery to include test backend for all tests."""
    with patch(
        "jupyter_scheduler.extension.discover_backends", side_effect=_mock_discover_backends
    ):
        yield


@pytest.fixture(scope="session")
def static_test_files_dir() -> Path:
    return Path(__file__).parent.resolve() / "jupyter_scheduler" / "tests" / "static"


@pytest.fixture
def jp_scheduler_root_dir(tmp_path: Path) -> Path:
    root_dir = tmp_path / "workspace_root"
    root_dir.mkdir()
    return root_dir


@pytest.fixture
def jp_scheduler_output_dir(jp_scheduler_root_dir: Path) -> Path:
    output_dir = jp_scheduler_root_dir / "jobs"
    output_dir.mkdir()
    return output_dir


@pytest.fixture
def jp_scheduler_staging_dir(jp_data_dir: Path) -> Path:
    staging_area = jp_data_dir / "scheduler_staging_area"
    staging_area.mkdir()
    return staging_area


@pytest.fixture
def jp_scheduler_db_url(jp_scheduler_staging_dir: Path) -> str:
    db_file_path = jp_scheduler_staging_dir / "scheduler.sqlite"
    return f"sqlite:///{db_file_path}"


@pytest.fixture
def jp_scheduler_db(jp_scheduler_db_url):
    engine = create_engine(jp_scheduler_db_url, echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    engine.dispose()


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
