from typing import TYPE_CHECKING, Optional, Tuple

if TYPE_CHECKING:
    from jupyter_scheduler.backend_registry import BackendRegistry
    from jupyter_scheduler.scheduler import BaseScheduler


def make_job_id(backend_id: str, uuid: str) -> str:
    """Create a job ID in the standard 'backend_id:uuid' format."""
    return f"{backend_id}:{uuid}"


def parse_job_id(job_id: str) -> Tuple[Optional[str], str]:
    """Parse job ID into (backend_id, uuid). Returns (None, uuid) for legacy IDs (no colon)."""
    if ":" not in job_id:
        return None, job_id
    backend_id, uuid = job_id.split(":", 1)
    return backend_id, uuid


def resolve_scheduler(job_id: str, backend_registry: "BackendRegistry") -> "BaseScheduler":
    """Get scheduler for job ID. Legacy IDs (no colon) route to legacy_job_backend."""
    backend_id, _ = parse_job_id(job_id)
    if not backend_id:
        return backend_registry.get_legacy_job_backend().scheduler
    backend = backend_registry.get_backend(backend_id)
    if backend:
        return backend.scheduler
    raise ValueError(f"Backend '{backend_id}' not available")
