"""Unit tests for BackendRegistry."""

from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.backend_registry import (
    BackendInstance,
    BackendRegistry,
    import_class,
)
from jupyter_scheduler.backends import BackendConfig, DescribeBackend


class TestImportClass:
    """Tests for the import_class helper function."""

    def test_import_existing_class(self):
        """Can import a class that exists."""
        cls = import_class("jupyter_scheduler.scheduler.Scheduler")
        from jupyter_scheduler.scheduler import Scheduler

        assert cls is Scheduler

    def test_import_nested_class(self):
        """Can import from nested modules."""
        cls = import_class("jupyter_scheduler.models.Status")
        from jupyter_scheduler.models import Status

        assert cls is Status

    def test_import_nonexistent_raises(self):
        """Importing nonexistent class raises ImportError or AttributeError."""
        with pytest.raises((ImportError, AttributeError)):
            import_class("jupyter_scheduler.nonexistent.FakeClass")


class TestBackendRegistry:
    """Tests for BackendRegistry."""

    @pytest.fixture
    def local_backend_config(self):
        """Create a local backend config for testing."""
        return BackendConfig(
            id="local",
            name="Local Execution",
            description="Execute notebooks locally",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            file_extensions=["ipynb"],
            is_default=True,
            priority=0,
        )

    @pytest.fixture
    def mock_backend_config(self):
        """Create a mock/secondary backend config for testing."""
        return BackendConfig(
            id="mock",
            name="Mock Backend",
            description="A mock backend for testing",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            file_extensions=["ipynb", "py"],
            is_default=False,
            priority=10,
        )

    @pytest.fixture
    def high_priority_backend_config(self):
        """Create a high priority backend config for testing."""
        return BackendConfig(
            id="high_priority",
            name="High Priority",
            description="A high priority backend",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            file_extensions=["ipynb"],
            is_default=False,
            priority=100,
        )

    def test_registry_init(self, local_backend_config):
        """Registry initializes with configs and default."""
        registry = BackendRegistry([local_backend_config], "local")
        assert registry._default == "local"
        assert len(registry._configs) == 1

    def test_registry_len_before_initialize(self, local_backend_config):
        """Registry length is 0 before initialize is called."""
        registry = BackendRegistry([local_backend_config], "local")
        assert len(registry) == 0

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_initialize_creates_backends(
        self, mock_import, mock_create_tables, local_backend_config
    ):
        """Initialize creates backend instances."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_instance = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler_instance
        mock_import.return_value = mock_scheduler_class

        mock_env_manager = MagicMock()

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize(
            root_dir="/tmp/test",
            environments_manager=mock_env_manager,
            db_url="sqlite:///test.db",
            config=None,
        )

        assert len(registry) == 1
        assert "local" in registry
        mock_create_tables.assert_called_once_with("sqlite:///test.db")

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_backend_by_id(self, mock_import, mock_create_tables, local_backend_config):
        """Can retrieve specific backend by ID."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_instance = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler_instance
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_backend("local")
        assert backend is not None
        assert backend.config.id == "local"
        assert backend.config.name == "Local Execution"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_backend_returns_none_for_unknown(
        self, mock_import, mock_create_tables, local_backend_config
    ):
        """Returns None for unknown backend ID."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_backend("unknown")
        assert backend is None

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_default_backend(self, mock_import, mock_create_tables, local_backend_config):
        """Default backend is returned correctly."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        default = registry.get_default()
        assert default.config.id == "local"
        assert default.config.is_default is True

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_default_raises_for_missing(self, mock_import, mock_create_tables):
        """Raises KeyError if default backend not found."""
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
        self, mock_import, mock_create_tables, local_backend_config, mock_backend_config
    ):
        """Auto-selection based on file extension works."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config, mock_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        # .py only supported by mock backend
        backend = registry.get_for_file("script.py")
        assert backend.config.id == "mock"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_returns_highest_priority(
        self,
        mock_import,
        mock_create_tables,
        local_backend_config,
        mock_backend_config,
        high_priority_backend_config,
    ):
        """When multiple backends match, highest priority wins."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry(
            [local_backend_config, mock_backend_config, high_priority_backend_config], "local"
        )
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        # All three support .ipynb, high_priority has priority=100
        backend = registry.get_for_file("notebook.ipynb")
        assert backend.config.id == "high_priority"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_returns_default_for_unknown_extension(
        self, mock_import, mock_create_tables, local_backend_config
    ):
        """Returns default backend for unrecognized extensions."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_for_file("data.csv")
        assert backend.config.id == "local"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_get_for_file_handles_no_extension(
        self, mock_import, mock_create_tables, local_backend_config
    ):
        """Returns default backend for files without extension."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backend = registry.get_for_file("README")
        assert backend.config.id == "local"

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_list_backends_returns_all(
        self, mock_import, mock_create_tables, local_backend_config, mock_backend_config
    ):
        """list_backends returns all registered backends."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config, mock_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backends = registry.list_backends()
        assert len(backends) == 2
        assert all(isinstance(b, DescribeBackend) for b in backends)

        backend_ids = {b.id for b in backends}
        assert backend_ids == {"local", "mock"}

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_list_backends_returns_describe_backend_model(
        self, mock_import, mock_create_tables, local_backend_config
    ):
        """list_backends returns DescribeBackend objects with correct fields."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        backends = registry.list_backends()
        assert len(backends) == 1

        backend = backends[0]
        assert backend.id == "local"
        assert backend.name == "Local Execution"
        assert backend.description == "Execute notebooks locally"
        assert backend.file_extensions == ["ipynb"]
        assert backend.is_default is True

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_contains_operator(self, mock_import, mock_create_tables, local_backend_config):
        """Contains operator works correctly."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        assert "local" in registry
        assert "unknown" not in registry

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_list_backend_instances(
        self, mock_import, mock_create_tables, local_backend_config, mock_backend_config
    ):
        """list_backend_instances returns all BackendInstance objects."""
        mock_scheduler_class = MagicMock()
        mock_scheduler_class.return_value = MagicMock()
        mock_import.return_value = mock_scheduler_class

        registry = BackendRegistry([local_backend_config, mock_backend_config], "local")
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

        instances = registry.list_backend_instances()
        assert len(instances) == 2
        assert all(isinstance(i, BackendInstance) for i in instances)

    @patch("jupyter_scheduler.backend_registry.create_tables")
    def test_skips_create_tables_for_custom_database_manager(self, mock_create_tables):
        """Does not create tables when backend has custom database_manager_class."""
        config = BackendConfig(
            id="k8s",
            name="K8s Backend",
            description="Backend with custom storage",
            scheduler_class="jupyter_scheduler.scheduler.Scheduler",
            execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
            database_manager_class="some_package.K8sDatabaseManager",
            db_url="k8s://default",
        )

        with patch("jupyter_scheduler.backend_registry.import_class") as mock_import:
            mock_scheduler_class = MagicMock()
            mock_scheduler_class.return_value = MagicMock()
            mock_import.return_value = mock_scheduler_class

            registry = BackendRegistry([config], "k8s")
            registry.initialize("/tmp", MagicMock(), "sqlite:///global.db")

            # Should not call create_tables because backend has custom database_manager_class
            mock_create_tables.assert_not_called()

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_uses_backend_specific_db_url(self, mock_import, mock_create_tables):
        """Uses backend-specific db_url when provided."""
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

        # Should use backend-specific URL
        mock_create_tables.assert_called_once_with("sqlite:///custom.db")

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_uses_global_db_url_when_backend_has_none(self, mock_import, mock_create_tables):
        """Uses global db_url when backend doesn't specify one."""
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

        # Should use global URL
        mock_create_tables.assert_called_once_with("sqlite:///global.db")

    @patch("jupyter_scheduler.backend_registry.create_tables")
    @patch("jupyter_scheduler.backend_registry.import_class")
    def test_extension_map_normalizes_extensions(self, mock_import, mock_create_tables):
        """Extension map normalizes extensions (lowercase, no leading dot)."""
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

        # All extensions should be lowercase without dots
        assert "ipynb" in registry._extension_map
        assert "py" in registry._extension_map
        assert "qasm" in registry._extension_map

        # Case-insensitive file matching
        backend = registry.get_for_file("test.IPYNB")
        assert backend.config.id == "test"
