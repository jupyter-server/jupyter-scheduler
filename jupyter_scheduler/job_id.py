from typing import Tuple

LEGACY_BACKEND_ID = "jupyter_server_nb"


def make_job_id(backend_id: str, uuid: str) -> str:
    """Create a job ID in the standard 'backend:uuid' format."""
    return f"{backend_id}:{uuid}"


def parse_job_id(job_id: str) -> Tuple[str, str]:
    """Parse job ID into (backend_id, uuid).

    For standard format 'backend:uuid', splits on first colon.
    For legacy format (no colon), returns (LEGACY_BACKEND_ID, job_id).
    """
    if ":" in job_id:
        backend_id, uuid = job_id.split(":", 1)
        return (backend_id, uuid)
    return (LEGACY_BACKEND_ID, job_id)


# Backwards compatibility aliases (deprecated)
encode_job_id = make_job_id
decode_job_id = parse_job_id
