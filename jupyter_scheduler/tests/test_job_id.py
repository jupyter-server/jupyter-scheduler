from jupyter_scheduler.job_id import make_job_id


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
