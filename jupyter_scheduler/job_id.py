from typing import Tuple

LEGACY_BACKEND_ID = "jupyter_server_nb"


def encode_job_id(backend_id: str, uuid: str) -> str:
    """Encode backend ID and UUID into '{backend_id}:{uuid}' format."""
    return f"{backend_id}:{uuid}"


def decode_job_id(job_id: str) -> Tuple[str, str]:
    """Decode job ID into (backend_id, uuid). Legacy IDs route to LEGACY_BACKEND_ID."""
    if ":" in job_id:
        backend_id, uuid = job_id.split(":", 1)
        return (backend_id, uuid)
    return (LEGACY_BACKEND_ID, job_id)
