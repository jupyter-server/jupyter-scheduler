"""Job ID encoding and parsing utilities.

Job IDs encode the backend identifier for O(1) routing.
Format: "backend_id:uuid" (new) or "uuid" (legacy, pre-multiple-backends)
"""

from typing import TYPE_CHECKING, Optional, Tuple

if TYPE_CHECKING:
    from jupyter_scheduler.backend_registry import BackendRegistry
    from jupyter_scheduler.scheduler import BaseScheduler


def make_job_id(backend_id: str, uuid: str) -> str:
    """Create a job ID in the standard 'backend_id:uuid' format."""
    return f"{backend_id}:{uuid}"


def parse_job_id(job_id: str) -> Tuple[Optional[str], str]:
    """Parse a job ID into (backend_id, uuid).

    Args:
        job_id: Job ID in format "backend_id:uuid" or legacy "uuid"

    Returns:
        Tuple of (backend_id, uuid) where backend_id is None for legacy IDs.
        Callers should route legacy IDs to the default backend.
    """
    if ":" not in job_id:
        # Legacy format (pre-multiple-backends): return None to signal "use default"
        return None, job_id
    backend_id, uuid = job_id.split(":", 1)
    return backend_id, uuid


def resolve_scheduler(
    job_id: str, backend_registry: "BackendRegistry"
) -> "BaseScheduler":
    """Resolve the scheduler for a job ID.

    Args:
        job_id: Job ID in format "backend_id:uuid" or legacy "uuid"
        backend_registry: Registry containing all backend instances

    Returns:
        The scheduler for the backend encoded in the job ID, or the legacy
        job backend for pre-3.0 job IDs (no colon).

    Raises:
        ValueError: If backend specified in job ID is not available.
    """
    backend_id, _ = parse_job_id(job_id)
    if not backend_id:
        return backend_registry.get_legacy_job_backend().scheduler
    backend = backend_registry.get_backend(backend_id)
    if backend:
        return backend.scheduler
    raise ValueError(f"Backend '{backend_id}' not available")
