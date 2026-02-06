"""Tests for job ID encoding and parsing utilities."""

from unittest.mock import MagicMock

import pytest

from jupyter_scheduler.job_id import make_job_id, parse_job_id, resolve_scheduler


class TestMakeJobId:
    """Tests for make_job_id function."""

    def test_encodes_backend_and_uuid(self):
        """Job ID should be 'backend_id:uuid' format."""
        result = make_job_id("jupyter_server_nb", "abc-123")
        assert result == "jupyter_server_nb:abc-123"

    def test_encodes_different_backends(self):
        """Different backends should produce different prefixes."""
        nb_id = make_job_id("jupyter_server_nb", "uuid1")
        py_id = make_job_id("jupyter_server_py", "uuid1")
        assert nb_id.startswith("jupyter_server_nb:")
        assert py_id.startswith("jupyter_server_py:")
        assert nb_id != py_id


class TestParseJobId:
    """Tests for parse_job_id function."""

    def test_extracts_backend_and_uuid(self):
        """Should split on first colon."""
        backend, uuid = parse_job_id("my_backend:uuid-456")
        assert backend == "my_backend"
        assert uuid == "uuid-456"

    def test_handles_legacy_format(self):
        """Legacy job IDs (no colon) return None backend_id."""
        backend, uuid = parse_job_id("legacy-uuid-only")
        assert backend is None
        assert uuid == "legacy-uuid-only"

    def test_handles_uuid_with_colons(self):
        """UUID portion may contain colons - only split on first."""
        backend, uuid = parse_job_id("backend:uuid:with:colons")
        assert backend == "backend"
        assert uuid == "uuid:with:colons"

    def test_roundtrip(self):
        """parse_job_id should reverse make_job_id."""
        original_backend = "test_backend"
        original_uuid = "test-uuid-123"
        job_id = make_job_id(original_backend, original_uuid)
        backend, uuid = parse_job_id(job_id)
        assert backend == original_backend
        assert uuid == original_uuid


class TestResolveScheduler:
    """Tests for resolve_scheduler function."""

    def test_returns_scheduler_for_known_backend(self):
        """Should return scheduler from backend registry for known backend."""
        mock_scheduler = MagicMock()
        mock_backend = MagicMock()
        mock_backend.scheduler = mock_scheduler

        mock_registry = MagicMock()
        mock_registry.get_backend.return_value = mock_backend

        result = resolve_scheduler("my_backend:uuid-123", mock_registry)

        mock_registry.get_backend.assert_called_once_with("my_backend")
        assert result == mock_scheduler

    def test_returns_legacy_backend_for_uuid_only(self):
        """Legacy job IDs (no colon) should route to legacy job backend."""
        mock_scheduler = MagicMock()
        mock_backend = MagicMock()
        mock_backend.scheduler = mock_scheduler

        mock_registry = MagicMock()
        mock_registry.get_legacy_job_backend.return_value = mock_backend

        result = resolve_scheduler("uuid-only-no-colon", mock_registry)

        mock_registry.get_legacy_job_backend.assert_called_once()
        mock_registry.get_backend.assert_not_called()
        assert result == mock_scheduler

    def test_raises_for_unknown_backend(self):
        """Should raise ValueError when backend is not available."""
        mock_registry = MagicMock()
        mock_registry.get_backend.return_value = None

        with pytest.raises(ValueError):
            resolve_scheduler("unknown_backend:uuid-123", mock_registry)

        mock_registry.get_backend.assert_called_once_with("unknown_backend")
