"""Job ID encoding and parsing utilities.

Job IDs encode the backend identifier for O(1) routing:
- Format: "backend_id:uuid"
- Legacy format (pre-v3): "uuid" (no colon, maps to LEGACY_BACKEND_ID)
"""

import re
from typing import Tuple

# Backend ID for jobs created before multiple backends support
LEGACY_BACKEND_ID = "jupyter_server_nb"

# Valid backend ID pattern: starts with letter, contains alphanumeric, underscore, or hyphen
BACKEND_ID_PATTERN = re.compile(r'^[a-zA-Z][a-zA-Z0-9_-]*$')


def validate_backend_id(backend_id: str) -> None:
    """Validate that a backend ID is well-formed.

    Raises:
        ValueError: If backend_id is invalid (empty, contains colon, or wrong format)
    """
    if not backend_id:
        raise ValueError("Backend ID cannot be empty")
    if ':' in backend_id:
        raise ValueError(f"Backend ID cannot contain ':': {backend_id}")
    if not BACKEND_ID_PATTERN.match(backend_id):
        raise ValueError(
            f"Invalid backend ID format: {backend_id}. "
            "Must start with a letter and contain only alphanumeric, underscore, or hyphen."
        )


def make_job_id(backend_id: str, uuid: str) -> str:
    """Create a job ID in the standard 'backend_id:uuid' format."""
    return f"{backend_id}:{uuid}"


def parse_job_id(job_id: str) -> Tuple[str, str]:
    """Parse a job ID into (backend_id, uuid).

    Handles both new format ("backend_id:uuid") and legacy format ("uuid").

    Returns:
        Tuple of (backend_id, uuid)
    """
    if ":" not in job_id:
        # Legacy format: no backend prefix
        return LEGACY_BACKEND_ID, job_id
    backend_id, uuid = job_id.split(":", 1)
    return backend_id, uuid
