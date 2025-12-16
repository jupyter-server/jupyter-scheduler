import pytest

from jupyter_scheduler.job_id import LEGACY_BACKEND_ID, make_job_id, parse_job_id


class TestMakeJobId:
    def test_make_simple(self):
        result = make_job_id("jupyter_server_nb", "abc123")
        assert result == "jupyter_server_nb:abc123"

    def test_make_custom_backend(self):
        result = make_job_id("custom", "xyz789")
        assert result == "custom:xyz789"

    def test_make_preserves_uuid_with_special_chars(self):
        result = make_job_id("jupyter_server_nb", "550e8400-e29b-41d4-a716-446655440000")
        assert result == "jupyter_server_nb:550e8400-e29b-41d4-a716-446655440000"

    def test_make_with_empty_uuid(self):
        result = make_job_id("jupyter_server_nb", "")
        assert result == "jupyter_server_nb:"


class TestParseJobId:
    def test_parse_standard_job_id(self):
        backend_id, uuid = parse_job_id("jupyter_server_nb:abc123")
        assert backend_id == "jupyter_server_nb"
        assert uuid == "abc123"

    def test_parse_custom_backend_job_id(self):
        backend_id, uuid = parse_job_id("custom:xyz789")
        assert backend_id == "custom"
        assert uuid == "xyz789"

    def test_parse_preserves_uuid_with_colons(self):
        backend_id, uuid = parse_job_id("custom:job:with:colons")
        assert backend_id == "custom"
        assert uuid == "job:with:colons"

    def test_parse_legacy_id_without_prefix(self):
        backend_id, uuid = parse_job_id("abc123def456")
        assert backend_id == LEGACY_BACKEND_ID
        assert uuid == "abc123def456"

    def test_parse_legacy_uuid_format(self):
        backend_id, uuid = parse_job_id("550e8400-e29b-41d4-a716-446655440000")
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
        job_id = make_job_id(backend_id, uuid)
        parsed_backend, parsed_uuid = parse_job_id(job_id)
        assert parsed_backend == backend_id
        assert parsed_uuid == uuid
