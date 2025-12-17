from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.backend_utils import (
    ENTRY_POINT_GROUP,
    discover_backends,
    get_default_backend_id,
)
from jupyter_scheduler.backends import JupyterServerNotebookBackend
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


class TestBaseBackend:
    def test_to_dict_returns_expected_structure(self):
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


class TestDiscoverBackends:
    def _create_mock_entry_point(self, name: str, backend_class):
        ep = MagicMock()
        ep.name = name
        ep.load.return_value = backend_class
        return ep

    def test_discovers_registered_backends(self):
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            self._create_mock_entry_point("mock", MockBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 2
        assert "jupyter_server_nb" in backends
        assert "mock" in backends
        assert backends["jupyter_server_nb"] is JupyterServerNotebookBackend
        assert backends["mock"] is MockBackend

    def test_handles_import_error_gracefully(self):
        mock_eps = MagicMock()
        failing_ep = MagicMock()
        failing_ep.name = "missing_deps"
        failing_ep.load.side_effect = ImportError("missing_package")

        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            failing_ep,
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "jupyter_server_nb" in backends
        assert "missing_deps" not in backends

    def test_handles_generic_exception_gracefully(self):
        mock_eps = MagicMock()
        failing_ep = MagicMock()
        failing_ep.name = "broken"
        failing_ep.load.side_effect = RuntimeError("Something went wrong")

        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            failing_ep,
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "jupyter_server_nb" in backends

    def test_skips_backend_without_id_attribute(self):
        mock_eps = MagicMock()

        class BadBackend:
            name = "Bad"

        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            self._create_mock_entry_point("bad", BadBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "jupyter_server_nb" in backends

    def test_blocked_backends_are_excluded(self):
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            self._create_mock_entry_point("mock", MockBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(blocked_backends=["jupyter_server_nb"])

        assert len(backends) == 1
        assert "mock" in backends
        assert "jupyter_server_nb" not in backends

    def test_allowed_backends_whitelist(self):
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            self._create_mock_entry_point("mock", MockBackend),
            self._create_mock_entry_point("high_priority", HighPriorityBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(allowed_backends=["jupyter_server_nb", "mock"])

        assert len(backends) == 2
        assert "jupyter_server_nb" in backends
        assert "mock" in backends
        assert "high_priority" not in backends

    def test_allowed_and_blocked_can_coexist(self):
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            self._create_mock_entry_point("mock", MockBackend),
            self._create_mock_entry_point("high_priority", HighPriorityBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(
                allowed_backends=["jupyter_server_nb", "mock"],
                blocked_backends=["jupyter_server_nb"],
            )

        assert len(backends) == 1
        assert "mock" in backends

    def test_empty_result_when_all_blocked(self):
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(blocked_backends=["jupyter_server_nb"])

        assert len(backends) == 0

    def test_logs_discovery(self):
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
        ]
        mock_logger = MagicMock()

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            discover_backends(log=mock_logger)

        mock_logger.info.assert_called()

    def test_python39_entry_points_format(self):
        mock_eps = {
            ENTRY_POINT_GROUP: [
                self._create_mock_entry_point("jupyter_server_nb", JupyterServerNotebookBackend),
            ]
        }

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "jupyter_server_nb" in backends


class TestGetDefaultBackendId:
    def test_returns_configured_default_when_available(self):
        backends = {"jupyter_server_nb": JupyterServerNotebookBackend, "mock": MockBackend}

        result = get_default_backend_id(backends, configured_default="mock")

        assert result == "mock"

    def test_ignores_configured_default_when_not_available(self):
        backends = {"jupyter_server_nb": JupyterServerNotebookBackend, "mock": MockBackend}

        result = get_default_backend_id(backends, configured_default="nonexistent")

        assert result == "jupyter_server_nb"

    def test_prefers_jupyter_server_nb_when_no_config(self):
        backends = {
            "jupyter_server_nb": JupyterServerNotebookBackend,
            "mock": MockBackend,
            "other": HighPriorityBackend,
        }

        result = get_default_backend_id(backends, configured_default=None)

        assert result == "jupyter_server_nb"

    def test_returns_first_sorted_when_jupyter_server_nb_unavailable(self):
        backends = {"zebra": MockBackend, "alpha": HighPriorityBackend}

        result = get_default_backend_id(backends, configured_default=None)

        assert result == "alpha"

    def test_raises_when_no_backends_available(self):
        backends = {}

        with pytest.raises(ValueError, match="No scheduler backends available"):
            get_default_backend_id(backends, configured_default=None)

    def test_single_backend_is_default(self):
        backends = {"only_one": MockBackend}

        result = get_default_backend_id(backends, configured_default=None)

        assert result == "only_one"
