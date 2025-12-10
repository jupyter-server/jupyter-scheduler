"""Unit tests for backend discovery via entry points."""

from unittest.mock import MagicMock, PropertyMock, patch

import pytest

from jupyter_scheduler.backend_utils import (
    ENTRY_POINT_GROUP,
    discover_backends,
    get_default_backend_id,
)
from jupyter_scheduler.backends import LocalBackend
from jupyter_scheduler.base_backend import BaseBackend


class MockBackend(BaseBackend):
    """Mock backend for testing."""

    id = "mock"
    name = "Mock Backend"
    description = "A mock backend for testing"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.executors.DefaultExecutionManager"
    file_extensions = ["ipynb", "py"]
    priority = 10


class HighPriorityBackend(BaseBackend):
    """High priority backend for testing."""

    id = "high_priority"
    name = "High Priority Backend"
    description = "A high priority backend"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.executors.DefaultExecutionManager"
    file_extensions = ["ipynb"]
    priority = 100


class TestBaseBackend:
    """Tests for BaseBackend class."""

    def test_local_backend_class_attributes(self):
        """LocalBackend has correct class attributes."""
        assert LocalBackend.id == "local"
        assert LocalBackend.name == "Local Execution"
        assert LocalBackend.scheduler_class == "jupyter_scheduler.scheduler.Scheduler"
        assert (
            LocalBackend.execution_manager_class
            == "jupyter_scheduler.executors.DefaultExecutionManager"
        )
        assert LocalBackend.file_extensions == ["ipynb"]
        assert LocalBackend.priority == 0

    def test_to_dict_method(self):
        """to_dict returns correct dictionary."""
        result = MockBackend.to_dict()

        assert result["id"] == "mock"
        assert result["name"] == "Mock Backend"
        assert result["description"] == "A mock backend for testing"
        assert result["scheduler_class"] == "jupyter_scheduler.scheduler.Scheduler"
        assert result["file_extensions"] == ["ipynb", "py"]
        assert result["priority"] == 10
        assert result["database_manager_class"] is None


class TestDiscoverBackends:
    """Tests for discover_backends function."""

    def _create_mock_entry_point(self, name: str, backend_class):
        """Create a mock entry point that returns the given backend class."""
        ep = MagicMock()
        ep.name = name
        ep.load.return_value = backend_class
        return ep

    def test_discovers_registered_backends(self):
        """Discovers backends from entry points."""
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            self._create_mock_entry_point("mock", MockBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 2
        assert "local" in backends
        assert "mock" in backends
        assert backends["local"] is LocalBackend
        assert backends["mock"] is MockBackend

    def test_handles_import_error_gracefully(self):
        """Skips backends with missing dependencies."""
        mock_eps = MagicMock()
        failing_ep = MagicMock()
        failing_ep.name = "missing_deps"
        failing_ep.load.side_effect = ImportError("missing_package")

        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            failing_ep,
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "local" in backends
        assert "missing_deps" not in backends

    def test_handles_generic_exception_gracefully(self):
        """Skips backends that fail to load for any reason."""
        mock_eps = MagicMock()
        failing_ep = MagicMock()
        failing_ep.name = "broken"
        failing_ep.load.side_effect = RuntimeError("Something went wrong")

        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            failing_ep,
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "local" in backends

    def test_skips_backend_without_id_attribute(self):
        """Skips classes that don't define 'id' attribute."""
        mock_eps = MagicMock()

        class BadBackend:
            """Backend without id attribute."""

            name = "Bad"

        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            self._create_mock_entry_point("bad", BadBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "local" in backends

    def test_blocked_backends_are_excluded(self):
        """Blocked backends are not included in results."""
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            self._create_mock_entry_point("mock", MockBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(blocked_backends=["local"])

        assert len(backends) == 1
        assert "mock" in backends
        assert "local" not in backends

    def test_allowed_backends_whitelist(self):
        """Only allowed backends are included when allow list is set."""
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            self._create_mock_entry_point("mock", MockBackend),
            self._create_mock_entry_point("high_priority", HighPriorityBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(allowed_backends=["local", "mock"])

        assert len(backends) == 2
        assert "local" in backends
        assert "mock" in backends
        assert "high_priority" not in backends

    def test_allowed_and_blocked_can_coexist(self):
        """Both allow and block lists can be applied."""
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
            self._create_mock_entry_point("mock", MockBackend),
            self._create_mock_entry_point("high_priority", HighPriorityBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            # Allow local and mock, but also block local
            backends = discover_backends(
                allowed_backends=["local", "mock"],
                blocked_backends=["local"],
            )

        # Only mock should remain (local is blocked)
        assert len(backends) == 1
        assert "mock" in backends

    def test_empty_result_when_all_blocked(self):
        """Returns empty dict when all backends are blocked."""
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
        ]

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends(blocked_backends=["local"])

        assert len(backends) == 0

    def test_logs_discovery(self):
        """Logs backend discovery messages."""
        mock_eps = MagicMock()
        mock_eps.select.return_value = [
            self._create_mock_entry_point("local", LocalBackend),
        ]
        mock_logger = MagicMock()

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            discover_backends(log=mock_logger)

        # Should log successful registration
        mock_logger.info.assert_called()

    def test_python39_entry_points_format(self):
        """Handles Python 3.9 entry_points() return format (dict)."""
        # Python 3.9 returns a dict-like object without .select()
        mock_eps = {
            ENTRY_POINT_GROUP: [
                self._create_mock_entry_point("local", LocalBackend),
            ]
        }

        with patch("jupyter_scheduler.backend_utils.entry_points", return_value=mock_eps):
            backends = discover_backends()

        assert len(backends) == 1
        assert "local" in backends


class TestGetDefaultBackendId:
    """Tests for get_default_backend_id function."""

    def test_returns_configured_default_when_available(self):
        """Returns explicitly configured default."""
        backends = {"local": LocalBackend, "mock": MockBackend}

        result = get_default_backend_id(backends, configured_default="mock")

        assert result == "mock"

    def test_ignores_configured_default_when_not_available(self):
        """Falls back when configured default is not available."""
        backends = {"local": LocalBackend, "mock": MockBackend}

        result = get_default_backend_id(backends, configured_default="nonexistent")

        # Should fall back to "local"
        assert result == "local"

    def test_prefers_local_when_no_config(self):
        """Returns 'local' when no default is configured."""
        backends = {"local": LocalBackend, "mock": MockBackend, "other": HighPriorityBackend}

        result = get_default_backend_id(backends, configured_default=None)

        assert result == "local"

    def test_returns_first_sorted_when_local_unavailable(self):
        """Returns first backend (sorted) when 'local' is not available."""
        backends = {"zebra": MockBackend, "alpha": HighPriorityBackend}

        result = get_default_backend_id(backends, configured_default=None)

        # Should return 'alpha' (first alphabetically)
        assert result == "alpha"

    def test_raises_when_no_backends_available(self):
        """Raises ValueError when no backends are available."""
        backends = {}

        with pytest.raises(ValueError, match="No scheduler backends available"):
            get_default_backend_id(backends, configured_default=None)

    def test_single_backend_is_default(self):
        """Single available backend becomes default."""
        backends = {"only_one": MockBackend}

        result = get_default_backend_id(backends, configured_default=None)

        assert result == "only_one"
