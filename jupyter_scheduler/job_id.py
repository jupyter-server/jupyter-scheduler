LEGACY_BACKEND_ID = "jupyter_server_nb"


def make_job_id(backend_id: str, uuid: str) -> str:
    """Create a job ID in the standard 'backend:uuid' format."""
    return f"{backend_id}:{uuid}"
