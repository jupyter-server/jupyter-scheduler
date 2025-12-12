from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.backend_registry import (
    BackendInstance,
    BackendRegistry,
    import_class,
)
from jupyter_scheduler.backends import BackendConfig, DescribeBackend

SCHEDULER_CLASS = "jupyter_scheduler.scheduler.Scheduler"
EXECUTION_MANAGER_CLASS = "jupyter_scheduler.executors.DefaultExecutionManager"


def make_backend_config(
    id: str,
    name: str = None,
    file_extensions: list = None,
    is_default: bool = False,
    priority: int = 0,
    **kwargs,
) -> BackendConfig:
    """Factory for BackendConfig with sensible defaults."""
    return BackendConfig(
        id=id,
        name=name or id.replace("_", " ").title(),
        description=f"Test backend: {id}",
        scheduler_class=SCHEDULER_CLASS,
        execution_manager_class=EXECUTION_MANAGER_CLASS,
        file_extensions=file_extensions or ["ipynb"],
        is_default=is_default,
        priority=priority,
        **kwargs,
    )


class TestImportClass:
    def test_import_existing_class(self):
        cls = import_class("jupyter_scheduler.scheduler.Scheduler")
        from jupyter_scheduler.scheduler import Scheduler

        assert cls is Scheduler

    def test_import_nested_class(self):
        cls = import_class("jupyter_scheduler.models.Status")
        from jupyter_scheduler.models import Status

        assert cls is Status

    def test_import_nonexistent_raises(self):
        with pytest.raises((ImportError, AttributeError)):
            import_class("jupyter_scheduler.nonexistent.FakeClass")


class TestBackendRegistry:
    @pytest.fixture
    def jupyter_server_nb_backend_config(self):
        return make_backend_config("jupyter_server_nb", is_default=True)

    @pytest.fixture
    def mock_backend_config(self):
        return make_backend_config("mock", file_extensions=["ipynb", "py"], priority=10)

    @pytest.fixture
    def high_priority_backend_config(self):
        return make_backend_config("high_priority", priority=100)

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_initialize_creates_backends(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_instance = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler_instance
        mock_import.return_value = mock_scheduler_class

        mock_env_manager = MagicMock()

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize(
            root_dir="/tmp/test",
            environments_manager=mock_env_manager,
            db_url="sqlite:///test.db",
            config=None,
        )

        assert len(registry) == 1
        assert "jupyter_server_nb" in registry
        mock_create_tables.assert_called_once_with("sqlite:///test.db")

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_backend_by_id(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_instance = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler_instance
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_backend("jupyter_server_nb")
        assert backend is not None
        assert backend.config.id == "jupyter_server_nb"
        assert backend.config.name == "Jupyter Server Nb"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_backend_returns_none_for_unknown(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_backend("unknown")
        assert backend is None

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_default_returns_configured_default(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        default = registry.get_default()
        assert default.config.id == "jupyter_server_nb"
        assert default.config.is_default is True

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_default_raises_for_missing(self, mock_import, mock_create_tables):
        config = BackendConfig(
            id="other",
            name="Other",
            description="Other backend",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
        )
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([config], "nonexistent")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        with pytest.raises(KeyError, match="Default backend 'nonexistent' not found"):
            registry.get_default()

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_matches_extension(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config, mock_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry(
            [jupyter_server_nb_backend_config, mock_backend_config], "jupyter_server_nb"
        )
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_for_file("script.py")
        assert backend.config.id == "mock"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_returns_highest_priority(
        self,
        mock_import,
        mock_create_tables,
        jupyter_server_nb_backend_config,
        mock_backend_config,
        high_priority_backend_config,
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry(
            [jupyter_server_nb_backend_config, mock_backend_config, high_priority_backend_config],
            "jupyter_server_nb",
        )
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_for_file("notebook.ipynb")
        assert backend.config.id == "high_priority"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_returns_default_for_unknown_extension(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_for_file("data.csv")
        assert backend.config.id == "jupyter_server_nb"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_handles_no_extension(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_for_file("README")
        assert backend.config.id == "jupyter_server_nb"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_list_backends_returns_all(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config, mock_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry(
            [jupyter_server_nb_backend_config, mock_backend_config], "jupyter_server_nb"
        )
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backends = registry.list_backends()
        assert len(backends) == 2
        assert all(isinstance(b, DescribeBackend) for b in backends)

        backend_ids = {b.id for b in backends}
        assert backend_ids == {"jupyter_server_nb", "mock"}

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_contains_operator(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        assert "jupyter_server_nb" in registry
        assert "unknown" not in registry

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_list_backend_instances(
        self, mock_import, mock_create_tables, jupyter_server_nb_backend_config, mock_backend_config
    ):
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry(
            [jupyter_server_nb_backend_config, mock_backend_config], "jupyter_server_nb"
        )
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        instances = registry.list_backend_instances()
        assert len(instances) == 2
        assert all(isinstance(i, BackendInstance) for i in instances)

    @patch("jupyter_scheduler.backend_registry.create_tables")
    def test_skips_create_tables_for_custom_database_manager(self, mock_create_tables):
        config = BackendConfig(
            id="custom_storage",
            name="Custom Storage Backend",
            description="Backend with custom storage",
            scheduler_class=SCHEDULER_CLASS,
            execution_manager_class=EXECUTION_MANAGER_CLASS,
            database_manager_class="some_package.CustomDatabaseManager",
            db_url="custom://default",
        )

        with patch("jupyter_scheduler.backend_registry.import_class") as mock_import:
            mock_scheduler_class = MagicMock()
            mock_scheduler_class.return_value = MagicMock()
            mock_import.return_value = mock_scheduler_class

            registry = BackendRegistry([config], "custom_storage")
            registry.initialize("/tmp", MagicMock(), "sqlite:///global.db")

            mock_create_tables.assert_not_called()

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_uses_backend_specific_db_url(self, mock_import, mock_create_tables):
        config = BackendConfig(
            id="custom",
            name="Custom",
            description="Custom backend",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            db_url="sqlite:///custom.db",
        )

        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([config], "custom")
        registry.initialize("/tmp", MagicMock(), "sqlite:///global.db")

        mock_create_tables.assert_called_once_with("sqlite:///custom.db")

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_uses_global_db_url_when_backend_has_none(self, mock_import, mock_create_tables):
        config = BackendConfig(
            id="default_db",
            name="Default DB",
            description="Uses default DB",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            db_url=None,
        )

        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([config], "default_db")
        registry.initialize("/tmp", MagicMock(), "sqlite:///global.db")

        mock_create_tables.assert_called_once_with("sqlite:///global.db")

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_extension_map_normalizes_extensions(self, mock_import, mock_create_tables):
        config = BackendConfig(
            id="test",
            name="Test",
            description="Test backend",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            file_extensions=[".IPYNB", "PY", ".Qasm"],
            is_default=True,
        )

        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([config], "test")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        assert "ipynb" in registry._extension_map
        assert "py" in registry._extension_map
        assert "qasm" in registry._extension_map

        backend = registry.get_for_file("test.IPYNB")
        assert backend.config.id == "test"
