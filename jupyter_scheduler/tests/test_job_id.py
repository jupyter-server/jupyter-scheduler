"""Tests for job ID encoding and parsing utilities."""

import pytest

from jupyter_scheduler.job_id import (
    make_job_id,
    parse_job_id,
    validate_backend_id,
)


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


class TestValidateBackendId:
    """Tests for validate_backend_id function."""

    def test_accepts_valid_ids(self):
        """Valid backend IDs should not raise."""
        valid_ids = [
            "local",
            "jupyter_server_nb",
            "jupyter_server_py",
            "my-backend",
            "Backend123",
            "a",
            "A1_test-name",
        ]
        for backend_id in valid_ids:
            validate_backend_id(backend_id)  # Should not raise

    def test_rejects_empty(self):
        """Empty string should raise ValueError."""
        with pytest.raises(ValueError):
            validate_backend_id("")

    def test_rejects_colons(self):
        """Backend ID with colon should raise ValueError."""
        with pytest.raises(ValueError):
            validate_backend_id("invalid:id")

    def test_rejects_starting_with_number(self):
        """Backend ID starting with number should raise ValueError."""
        with pytest.raises(ValueError):
            validate_backend_id("123backend")

    def test_rejects_special_characters(self):
        """Backend ID with special chars should raise ValueError."""
        invalid_ids = ["back end", "backend@test", "backend.test", "backend/test"]
        for backend_id in invalid_ids:
            with pytest.raises(ValueError):
                validate_backend_id(backend_id)
