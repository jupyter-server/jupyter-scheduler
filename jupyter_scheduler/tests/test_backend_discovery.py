from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.backend_utils import (
    ENTRY_POINT_GROUP,
    discover_backends,
    get_legacy_job_backend_id,
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


class AnotherBackend(BaseBackend):
    """Another mock backend for testing."""

    id = "another"
    name = "Another Backend"
    scheduler_class = SCHEDULER_CLASS
    execution_manager_class = EXECUTION_MANAGER_CLASS
    file_extensions = ["ipynb"]


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


# get_legacy_job_backend_id tests


def test_returns_configured_legacy_backend_when_available():
    backends = {JUPYTER_SERVER_NB_BACKEND_ID: JupyterServerNotebookBackend, "mock": MockBackend}

    result = get_legacy_job_backend_id(backends, legacy_job_backend="mock")

    assert result == "mock"


def test_ignores_configured_legacy_backend_when_not_available():
    backends = {JUPYTER_SERVER_NB_BACKEND_ID: JupyterServerNotebookBackend, "mock": MockBackend}

    result = get_legacy_job_backend_id(backends, legacy_job_backend="nonexistent")

    assert result == JUPYTER_SERVER_NB_BACKEND_ID


def test_prefers_default_fallback_backend_when_no_config():
    backends = {
        JUPYTER_SERVER_NB_BACKEND_ID: JupyterServerNotebookBackend,
        "mock": MockBackend,
        "other": AnotherBackend,
    }

    result = get_legacy_job_backend_id(backends, legacy_job_backend=None)

    assert result == JUPYTER_SERVER_NB_BACKEND_ID


def test_raises_when_default_fallback_unavailable():
    """When jupyter_server_nb unavailable and no legacy_job_backend configured, raise error."""
    backends = {"zebra": MockBackend, "alpha": AnotherBackend}

    with pytest.raises(ValueError):
        get_legacy_job_backend_id(backends, legacy_job_backend=None)


def test_raises_when_no_backends_available():
    backends = {}

    with pytest.raises(ValueError):
        get_legacy_job_backend_id(backends, legacy_job_backend=None)


def test_raises_when_single_non_default_backend():
    """Even with single backend, require explicit config if it's not jupyter_server_nb."""
    backends = {"only_one": MockBackend}

    with pytest.raises(ValueError):
        get_legacy_job_backend_id(backends, legacy_job_backend=None)


def test_single_backend_works_with_explicit_config():
    """Single non-default backend works when explicitly configured."""
    backends = {"only_one": MockBackend}

    result = get_legacy_job_backend_id(backends, legacy_job_backend="only_one")

    assert result == "only_one"
