"""Job ID encoding/decoding utilities for multi-backend routing.

Job IDs encode the backend in their format: {backend_id}:{uuid}
Examples: 'local:abc123def456', 'k8s:xyz789'

This enables O(1) backend routing without querying all backends.
Legacy IDs (without prefix) route to the legacy notebook backend for backward compatibility.
"""

from typing import Tuple

# The legacy backend ID - all job IDs created before multi-backend support
# used the "local" notebook execution backend. Do NOT change this value
# even if you rename the backend or add new local backends (e.g., "python").
LEGACY_BACKEND_ID = "local"


def encode_job_id(backend_id: str, uuid: str) -> str:
    """Encode backend ID and UUID into a composite job ID.

    Args:
        backend_id: The backend identifier (e.g., 'local', 'k8s')
        uuid: The unique job identifier from the scheduler

    Returns:
        Encoded job ID in format 'backend_id:uuid'
    """
    return f"{backend_id}:{uuid}"


def decode_job_id(job_id: str) -> Tuple[str, str]:
    """Decode a job ID into (backend_id, uuid).

    Handles legacy IDs without prefix by routing to the legacy notebook backend.

    Args:
        job_id: The job ID (may or may not have backend prefix)

    Returns:
        Tuple of (backend_id, uuid)
    """
    if ":" in job_id:
        backend_id, uuid = job_id.split(":", 1)
        return (backend_id, uuid)
    # Legacy ID without prefix - route to original notebook backend
    return (LEGACY_BACKEND_ID, job_id)
