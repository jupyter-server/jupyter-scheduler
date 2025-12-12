"""Unit tests for job ID encoding/decoding utilities."""

import pytest

from jupyter_scheduler.job_id import (
    LEGACY_BACKEND_ID,
    decode_job_id,
    encode_job_id,
)


class TestEncodeJobId:
    """Tests for encode_job_id function."""

    def test_encode_simple(self):
        """Encodes backend and UUID correctly."""
        result = encode_job_id("local", "abc123")
        assert result == "local:abc123"

    def test_encode_k8s_backend(self):
        """Encodes k8s backend correctly."""
        result = encode_job_id("k8s", "xyz789")
        assert result == "k8s:xyz789"

    def test_encode_preserves_uuid_with_special_chars(self):
        """Preserves UUIDs containing special characters."""
        # UUIDs might contain hyphens or other chars
        result = encode_job_id("local", "550e8400-e29b-41d4-a716-446655440000")
        assert result == "local:550e8400-e29b-41d4-a716-446655440000"

    def test_encode_with_empty_uuid(self):
        """Handles empty UUID (edge case)."""
        result = encode_job_id("local", "")
        assert result == "local:"


class TestDecodeJobId:
    """Tests for decode_job_id function."""

    def test_decode_encoded_job_id(self):
        """Decodes an encoded job ID correctly."""
        backend_id, uuid = decode_job_id("local:abc123")
        assert backend_id == "local"
        assert uuid == "abc123"

    def test_decode_k8s_job_id(self):
        """Decodes k8s backend job IDs."""
        backend_id, uuid = decode_job_id("k8s:xyz789")
        assert backend_id == "k8s"
        assert uuid == "xyz789"

    def test_decode_preserves_uuid_with_colons(self):
        """Handles UUIDs that might contain colons (splits on first only)."""
        backend_id, uuid = decode_job_id("k8s:job:with:colons")
        assert backend_id == "k8s"
        assert uuid == "job:with:colons"

    def test_decode_legacy_id_without_prefix(self):
        """Legacy IDs without prefix route to LEGACY_BACKEND_ID."""
        backend_id, uuid = decode_job_id("abc123def456")
        assert backend_id == LEGACY_BACKEND_ID
        assert uuid == "abc123def456"

    def test_decode_legacy_uuid_format(self):
        """Legacy UUIDs (hyphenated) route to legacy backend."""
        backend_id, uuid = decode_job_id("550e8400-e29b-41d4-a716-446655440000")
        assert backend_id == LEGACY_BACKEND_ID
        assert uuid == "550e8400-e29b-41d4-a716-446655440000"


class TestRoundTrip:
    """Tests for encode/decode round-trip consistency."""

    @pytest.mark.parametrize(
        "backend_id,uuid",
        [
            ("local", "abc123"),
            ("k8s", "xyz789"),
            ("custom-backend", "some-uuid-value"),
            ("local", "550e8400-e29b-41d4-a716-446655440000"),
        ],
    )
    def test_round_trip(self, backend_id, uuid):
        """Encode then decode returns original values."""
        encoded = encode_job_id(backend_id, uuid)
        decoded_backend, decoded_uuid = decode_job_id(encoded)
        assert decoded_backend == backend_id
        assert decoded_uuid == uuid


class TestLegacyBackendConstant:
    """Tests for LEGACY_BACKEND_ID constant."""

    def test_legacy_backend_id_is_local(self):
        """LEGACY_BACKEND_ID should be 'local' for backward compatibility."""
        assert LEGACY_BACKEND_ID == "local"
