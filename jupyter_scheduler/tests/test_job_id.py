import pytest

from jupyter_scheduler.job_id import LEGACY_BACKEND_ID, decode_job_id, encode_job_id


class TestEncodeJobId:
    def test_encode_simple(self):
        result = encode_job_id("jupyter_server_nb", "abc123")
        assert result == "jupyter_server_nb:abc123"

    def test_encode_custom_backend(self):
        result = encode_job_id("custom", "xyz789")
        assert result == "custom:xyz789"

    def test_encode_preserves_uuid_with_special_chars(self):
        result = encode_job_id("jupyter_server_nb", "550e8400-e29b-41d4-a716-446655440000")
        assert result == "jupyter_server_nb:550e8400-e29b-41d4-a716-446655440000"

    def test_encode_with_empty_uuid(self):
        result = encode_job_id("jupyter_server_nb", "")
        assert result == "jupyter_server_nb:"


class TestDecodeJobId:
    def test_decode_encoded_job_id(self):
        backend_id, uuid = decode_job_id("jupyter_server_nb:abc123")
        assert backend_id == "jupyter_server_nb"
        assert uuid == "abc123"

    def test_decode_custom_backend_job_id(self):
        backend_id, uuid = decode_job_id("custom:xyz789")
        assert backend_id == "custom"
        assert uuid == "xyz789"

    def test_decode_preserves_uuid_with_colons(self):
        backend_id, uuid = decode_job_id("custom:job:with:colons")
        assert backend_id == "custom"
        assert uuid == "job:with:colons"

    def test_decode_legacy_id_without_prefix(self):
        backend_id, uuid = decode_job_id("abc123def456")
        assert backend_id == LEGACY_BACKEND_ID
        assert uuid == "abc123def456"

    def test_decode_legacy_uuid_format(self):
        backend_id, uuid = decode_job_id("550e8400-e29b-41d4-a716-446655440000")
        assert backend_id == LEGACY_BACKEND_ID
        assert uuid == "550e8400-e29b-41d4-a716-446655440000"


class TestRoundTrip:
    @pytest.mark.parametrize(
        "backend_id,uuid",
        [
            ("jupyter_server_nb", "abc123"),
            ("custom", "xyz789"),
            ("another-backend", "some-uuid-value"),
            ("jupyter_server_nb", "550e8400-e29b-41d4-a716-446655440000"),
        ],
    )
    def test_round_trip(self, backend_id, uuid):
        encoded = encode_job_id(backend_id, uuid)
        decoded_backend, decoded_uuid = decode_job_id(encoded)
        assert decoded_backend == backend_id
        assert decoded_uuid == uuid
