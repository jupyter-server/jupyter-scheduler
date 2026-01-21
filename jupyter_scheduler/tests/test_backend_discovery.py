from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.backend_utils import (
    ENTRY_POINT_GROUP,
    discover_backends,
    get_default_backend_id,
)
from jupyter_scheduler.backends import (
    JUPYTER_SERVER_NB_BACKEND_ID,
    JupyterServerNotebookBackend,
)
from jupyter_scheduler.base_backend import BaseBackend

SCHEDULER_CLASS = "jupyter_scheduler.scheduler.Scheduler"
EXECUTION_MANAGER_CLASS = "jupyter_scheduler.executors.DefaultExecutionManager"


class MockBackend(BaseBackend):
    """Mock backend with py extension support."""

    id = "mock"
    name = "Mock"
    scheduler_class = SCHEDULER_CLASS
    execution_manager_class = EXECUTION_MANAGER_CLASS
    file_extensions = ["ipynb", "py"]
    priority = 10


class HighPriorityBackend(BaseBackend):
    """Mock backend with high priority for testing priority selection."""

    id = "high_priority"
    name = "High Priority"
    scheduler_class = SCHEDULER_CLASS
    execution_manager_class = EXECUTION_MANAGER_CLASS
    file_extensions = ["ipynb"]
    priority = 100


def _create_mock_entry_point(name: str, backend_class):
    """Helper to create mock entry points for testing."""
    ep = MagicMock()
    ep.name = name
    ep.load.return_value = backend_class
    return ep


# BaseBackend tests


def test_to_dict_returns_expected_structure():
    result = MockBackend.to_dict()

    expected_keys = {
        "id",
        "name",
        "description",
        "scheduler_class",
        "execution_manager_class",
        "database_manager_class",
        "file_extensions",
        "output_formats",
        "priority",
    }
    assert set(result.keys()) == expected_keys
    assert isinstance(result["file_extensions"], list)
    assert isinstance(result["output_formats"], list)
    assert result["id"] == MockBackend.id


# discover_backends tests


def test_discovers_registered_backends():
    mock_eps = MagicMock()
    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        _create_mock_entry_point("mock", MockBackend),
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends()

    assert len(backends) == 2
    assert JUPYTER_SERVER_NB_BACKEND_ID in backends
    assert "mock" in backends
    assert backends[JUPYTER_SERVER_NB_BACKEND_ID] is JupyterServerNotebookBackend
    assert backends["mock"] is MockBackend


def test_handles_import_error_gracefully():
    mock_eps = MagicMock()
    failing_ep = MagicMock()
    failing_ep.name = "missing_deps"
    failing_ep.load.side_effect = ImportError("missing_package")

    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        failing_ep,
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends()

    assert len(backends) == 1
    assert JUPYTER_SERVER_NB_BACKEND_ID in backends
    assert "missing_deps" not in backends


def test_handles_generic_exception_gracefully():
    mock_eps = MagicMock()
    failing_ep = MagicMock()
    failing_ep.name = "broken"
    failing_ep.load.side_effect = RuntimeError("Something went wrong")

    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        failing_ep,
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends()

    assert len(backends) == 1
    assert JUPYTER_SERVER_NB_BACKEND_ID in backends


def test_skips_backend_without_id_attribute():
    mock_eps = MagicMock()

    class BadBackend:
        name = "Bad"

    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        _create_mock_entry_point("bad", BadBackend),
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends()

    assert len(backends) == 1
    assert JUPYTER_SERVER_NB_BACKEND_ID in backends


def test_blocked_backends_are_excluded():
    mock_eps = MagicMock()
    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        _create_mock_entry_point("mock", MockBackend),
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends(blocked_backends=[JUPYTER_SERVER_NB_BACKEND_ID])

    assert len(backends) == 1
    assert "mock" in backends
    assert JUPYTER_SERVER_NB_BACKEND_ID not in backends


def test_allowed_backends_whitelist():
    mock_eps = MagicMock()
    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        _create_mock_entry_point("mock", MockBackend),
        _create_mock_entry_point("high_priority", HighPriorityBackend),
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends(allowed_backends=[JUPYTER_SERVER_NB_BACKEND_ID, "mock"])

    assert len(backends) == 2
    assert JUPYTER_SERVER_NB_BACKEND_ID in backends
    assert "mock" in backends
    assert "high_priority" not in backends


def test_allowed_and_blocked_can_coexist():
    mock_eps = MagicMock()
    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        _create_mock_entry_point("mock", MockBackend),
        _create_mock_entry_point("high_priority", HighPriorityBackend),
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends(
            allowed_backends=[JUPYTER_SERVER_NB_BACKEND_ID, "mock"],
            blocked_backends=[JUPYTER_SERVER_NB_BACKEND_ID],
        )

    assert len(backends) == 1
    assert "mock" in backends


def test_empty_result_when_all_blocked():
    mock_eps = MagicMock()
    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
    ]

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends(blocked_backends=[JUPYTER_SERVER_NB_BACKEND_ID])

    assert len(backends) == 0


def test_logs_discovery():
    mock_eps = MagicMock()
    mock_eps.select.return_value = [
        _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
    ]
    mock_logger = MagicMock()

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        discover_backends(log=mock_logger)

    mock_logger.info.assert_called()


def test_python39_entry_points_format():
    mock_eps = {
        ENTRY_POINT_GROUP: [
            _create_mock_entry_point(JUPYTER_SERVER_NB_BACKEND_ID, JupyterServerNotebookBackend),
        ]
    }

    with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
        backends = discover_backends()

    assert len(backends) == 1
    assert JUPYTER_SERVER_NB_BACKEND_ID in backends


# get_default_backend_id tests


def test_returns_configured_default_when_available():
    backends = {JUPYTER_SERVER_NB_BACKEND_ID: JupyterServerNotebookBackend, "mock": MockBackend}

    result = get_default_backend_id(backends, configured_default="mock")

    assert result == "mock"


def test_ignores_configured_default_when_not_available():
    backends = {JUPYTER_SERVER_NB_BACKEND_ID: JupyterServerNotebookBackend, "mock": MockBackend}

    result = get_default_backend_id(backends, configured_default="nonexistent")

    assert result == JUPYTER_SERVER_NB_BACKEND_ID


def test_prefers_default_fallback_backend_when_no_config():
    backends = {
        JUPYTER_SERVER_NB_BACKEND_ID: JupyterServerNotebookBackend,
        "mock": MockBackend,
        "other": HighPriorityBackend,
    }

    result = get_default_backend_id(backends, configured_default=None)

    assert result == JUPYTER_SERVER_NB_BACKEND_ID


def test_raises_when_default_fallback_unavailable():
    """When jupyter_server_nb unavailable and no default configured, raise error."""
    backends = {"zebra": MockBackend, "alpha": HighPriorityBackend}

    with pytest.raises(ValueError, match="Set SchedulerApp.default_backend explicitly"):
        get_default_backend_id(backends, configured_default=None)


def test_raises_when_no_backends_available():
    backends = {}

    with pytest.raises(ValueError, match="No scheduler backends available"):
        get_default_backend_id(backends, configured_default=None)


def test_raises_when_single_non_default_backend():
    """Even with single backend, require explicit config if it's not jupyter_server_nb."""
    backends = {"only_one": MockBackend}

    with pytest.raises(ValueError, match="Set SchedulerApp.default_backend explicitly"):
        get_default_backend_id(backends, configured_default=None)


def test_single_backend_works_with_explicit_config():
    """Single non-default backend works when explicitly configured."""
    backends = {"only_one": MockBackend}

    result = get_default_backend_id(backends, configured_default="only_one")

    assert result == "only_one"
