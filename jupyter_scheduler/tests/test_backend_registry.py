from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.backend_registry import BackendRegistry, import_class
from jupyter_scheduler.backends import BackendConfig, DescribeBackendResponse

SCHEDULER_CLASS = "jupyter_scheduler.scheduler.Scheduler"
EXECUTION_MANAGER_CLASS = "jupyter_scheduler.executors.DefaultExecutionManager"


def make_backend_config(
    id: str,
    name: str = None,
    file_extensions: list = None,
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
        **kwargs,
    )


@pytest.fixture
def jupyter_server_nb_backend_config():
    return make_backend_config("jupyter_server_nb", name="Jupyter Server Nb")


@pytest.fixture
def mock_backend_config():
    return make_backend_config("mock", file_extensions=["ipynb", "py"])


@pytest.fixture
def alpha_backend_config():
    """Backend with name that comes first alphabetically."""
    return make_backend_config("alpha", name="Alpha Backend", file_extensions=["ipynb"])


@pytest.fixture
def zulu_backend_config():
    """Backend with name that comes last alphabetically."""
    return make_backend_config("zulu", name="Zulu Backend", file_extensions=["ipynb"])


# import_class tests


def test_import_nonexistent_raises():
    with pytest.raises((ImportError, AttributeError)):
        import_class("jupyter_scheduler.nonexistent.FakeClass")


# BackendRegistry tests


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_initialize_creates_backends(
    mock_import, mock_create_tables, jupyter_server_nb_backend_config
):
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
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


def test_initialize_raises_for_duplicate_ids():
    """Duplicate backend IDs should raise ValueError."""
    config1 = make_backend_config("duplicate_id", name="Backend 1")
    config2 = make_backend_config("duplicate_id", name="Backend 2")

    registry = BackendRegistry([config1, config2], "duplicate_id")

    with pytest.raises(ValueError, match="Duplicate backend ID: 'duplicate_id'"):
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")


def test_initialize_raises_for_backend_id_with_colon():
    """Backend IDs cannot contain ':' as it's the job_id delimiter."""
    config = make_backend_config("invalid:backend", name="Invalid Backend")

    registry = BackendRegistry([config], "invalid:backend")

    with pytest.raises(ValueError, match="Backend ID cannot contain ':'"):
        registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_get_backend_by_id(mock_import, mock_create_tables, jupyter_server_nb_backend_config):
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
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
    mock_import, mock_create_tables, jupyter_server_nb_backend_config
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
def test_get_legacy_job_backend_returns_configured(
    mock_import, mock_create_tables, jupyter_server_nb_backend_config
):
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    legacy_backend = registry.get_legacy_job_backend()
    assert legacy_backend.config.id == "jupyter_server_nb"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_get_legacy_job_backend_raises_for_missing(mock_import, mock_create_tables):
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

    with pytest.raises(KeyError):
        registry.get_legacy_job_backend()


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_get_for_file_matches_extension(
    mock_import, mock_create_tables, jupyter_server_nb_backend_config, mock_backend_config
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
def test_get_for_file_uses_preferred_backend(
    mock_import,
    mock_create_tables,
    jupyter_server_nb_backend_config,
    mock_backend_config,
):
    """Preferred backend for extension takes precedence."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    registry = BackendRegistry(
        [jupyter_server_nb_backend_config, mock_backend_config],
        "jupyter_server_nb",
        preferred_backends={"ipynb": "mock"},
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    backend = registry.get_for_file("notebook.ipynb")
    assert backend.config.id == "mock"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_get_for_file_falls_back_to_alphabetical(
    mock_import,
    mock_create_tables,
    alpha_backend_config,
    zulu_backend_config,
):
    """Falls back to alphabetical by name when default doesn't support extension."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    # Default is some other backend that doesn't support ipynb
    other = make_backend_config("other", file_extensions=["py"])

    registry = BackendRegistry(
        [alpha_backend_config, zulu_backend_config, other],
        "other",  # default doesn't support .ipynb
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    backend = registry.get_for_file("notebook.ipynb")
    # Alpha Backend comes before Zulu Backend alphabetically
    assert backend.config.id == "alpha"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_get_for_file_ignores_invalid_preference(
    mock_import,
    mock_create_tables,
    jupyter_server_nb_backend_config,
    mock_backend_config,
):
    """Invalid preferred backend is ignored, falls back to alphabetical."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    registry = BackendRegistry(
        [jupyter_server_nb_backend_config, mock_backend_config],
        "jupyter_server_nb",
        preferred_backends={"ipynb": "nonexistent"},  # Invalid backend ID
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    backend = registry.get_for_file("notebook.ipynb")
    # Falls back to alphabetical: "Jupyter Server Nb" < "Mock"
    assert backend.config.id == "jupyter_server_nb"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_get_for_file_raises_for_unknown_extension(
    mock_import, mock_create_tables, jupyter_server_nb_backend_config
):
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    registry = BackendRegistry([jupyter_server_nb_backend_config], "jupyter_server_nb")
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    with pytest.raises(ValueError, match="No backend supports file extension '.csv'"):
        registry.get_for_file("data.csv")


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_describe_backends_returns_all(
    mock_import, mock_create_tables, jupyter_server_nb_backend_config, mock_backend_config
):
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    registry = BackendRegistry(
        [jupyter_server_nb_backend_config, mock_backend_config], "jupyter_server_nb"
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    backends = registry.describe_backends()
    assert len(backends) == 2
    assert all(isinstance(b, DescribeBackendResponse) for b in backends)

    backend_ids = {b.id for b in backends}
    assert backend_ids == {"jupyter_server_nb", "mock"}


@patch("jupyter_scheduler.backend_registry.create_tables")
def test_skips_create_tables_for_custom_database_manager(mock_create_tables):
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
def test_uses_backend_specific_db_url(mock_import, mock_create_tables):
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
def test_uses_global_db_url_when_backend_has_none(mock_import, mock_create_tables):
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
def test_extension_map_normalizes_extensions(mock_import, mock_create_tables):
    config = BackendConfig(
        id="test",
        name="Test",
        description="Test backend",
        scheduler_class="jupyter_scheduler.scheduler.Scheduler",
        execution_manager_class="jupyter_scheduler.executors.DefaultExecutionManager",
        file_extensions=[".IPYNB", "PY", ".Qasm"],
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


# preferred_backends selection tests


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_preferred_backends_for_multiple_extensions(mock_import, mock_create_tables):
    """Different extensions can have different preferred backends."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    ipynb_backend = make_backend_config("nb_backend", file_extensions=["ipynb"])
    py_backend = make_backend_config("py_backend", file_extensions=["py"])
    universal_backend = make_backend_config("universal", file_extensions=["ipynb", "py"])

    registry = BackendRegistry(
        [ipynb_backend, py_backend, universal_backend],
        "nb_backend",
        preferred_backends={"ipynb": "universal", "py": "py_backend"},
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    # .ipynb uses preferred "universal"
    assert registry.get_for_file("notebook.ipynb").config.id == "universal"
    # .py uses preferred "py_backend"
    assert registry.get_for_file("script.py").config.id == "py_backend"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_preferred_backend_must_support_extension(mock_import, mock_create_tables):
    """Preferred backend is ignored if it doesn't support the file extension."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    ipynb_only = make_backend_config("ipynb_only", file_extensions=["ipynb"])
    py_only = make_backend_config("py_only", file_extensions=["py"])

    registry = BackendRegistry(
        [ipynb_only, py_only],
        "ipynb_only",
        # py_only doesn't support .ipynb, so this should be ignored
        preferred_backends={"ipynb": "py_only"},
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    # Falls back to default since preferred doesn't support extension
    assert registry.get_for_file("notebook.ipynb").config.id == "ipynb_only"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_selection_order_preferred_over_default(mock_import, mock_create_tables):
    """Preferred backend takes precedence over default backend."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    default_backend = make_backend_config("default_be", file_extensions=["ipynb"])
    preferred_backend = make_backend_config("preferred_be", file_extensions=["ipynb"])

    registry = BackendRegistry(
        [default_backend, preferred_backend],
        "default_be",
        preferred_backends={"ipynb": "preferred_be"},
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    # Preferred wins over default
    assert registry.get_for_file("notebook.ipynb").config.id == "preferred_be"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_selection_order_alphabetical_when_no_preference(mock_import, mock_create_tables):
    """Alphabetical sorting is used when no preferred_backends configured."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    # "AAA" comes before "ZZZ" alphabetically
    aaa_backend = make_backend_config("aaa", name="AAA Backend", file_extensions=["ipynb"])
    zzz_backend = make_backend_config("zzz", name="ZZZ Backend", file_extensions=["ipynb"])

    registry = BackendRegistry(
        [aaa_backend, zzz_backend],
        "zzz",  # legacy_job_backend doesn't affect get_for_file selection
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    # Alphabetical wins: AAA < ZZZ
    assert registry.get_for_file("notebook.ipynb").config.id == "aaa"


@patch("jupyter_scheduler.backend_registry.create_tables")
@patch("jupyter_scheduler.backend_registry.import_class")
def test_empty_preferred_backends_dict(mock_import, mock_create_tables):
    """Empty preferred_backends dict should work and fall back to alphabetical."""
    mock_scheduler_class = MagicMock()
    mock_scheduler_class.return_value = MagicMock()
    mock_import.return_value = mock_scheduler_class

    backend = make_backend_config("test_backend", file_extensions=["ipynb"])

    registry = BackendRegistry(
        [backend],
        "test_backend",
        preferred_backends={},  # Explicitly empty
    )
    registry.initialize("/tmp", MagicMock(), "sqlite:///test.db")

    # Only one backend available, so it's selected
    assert registry.get_for_file("notebook.ipynb").config.id == "test_backend"
