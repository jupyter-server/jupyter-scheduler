import logging
from importlib.metadata import entry_points
from typing import Dict, Optional, Type

from jupyter_scheduler.backends import DEFAULT_FALLBACK_BACKEND_ID
from jupyter_scheduler.base_backend import BaseBackend

ENTRY_POINT_GROUP = "jupyter_scheduler.backends"

logger = logging.getLogger(__name__)


def discover_backends(
    log: Optional[logging.Logger] = None,
) -> Dict[str, Type[BaseBackend]]:
    """Discover backends registered in the 'jupyter_scheduler.backends' entry point group."""
    if log is None:
        log = logger

    backends: Dict[str, Type[BaseBackend]] = {}

    eps = entry_points()
    if hasattr(eps, "select"):
        backend_eps = eps.select(group=ENTRY_POINT_GROUP)
    else:
        backend_eps = eps.get(ENTRY_POINT_GROUP, [])

    for ep in backend_eps:
        try:
            backend_class = ep.load()
        except ImportError as e:
            missing_package = getattr(e, "name", str(e))
            log.warning(
                f"Unable to load backend '{ep.name}': missing dependency '{missing_package}'. "
                f"Install the required package to enable this backend."
            )
            continue
        except Exception as e:
            log.warning(f"Unable to load backend '{ep.name}': {e}")
            continue

        if not hasattr(backend_class, "id"):
            log.warning(f"Backend '{ep.name}' does not define 'id' attribute. Skipping.")
            continue

        backend_id = backend_class.id
        backends[backend_id] = backend_class
        log.info(f"Registered backend '{backend_id}' ({backend_class.name})")

    return backends


def get_legacy_job_backend_id(
    available_backends: Dict[str, Type[BaseBackend]],
    legacy_job_backend: Optional[str] = None,
) -> str:
    """Get backend ID for routing legacy jobs (UUID-only IDs from pre-3.0)."""
    if not available_backends:
        raise ValueError("No scheduler backends available.")

    if legacy_job_backend and legacy_job_backend in available_backends:
        return legacy_job_backend

    if DEFAULT_FALLBACK_BACKEND_ID in available_backends:
        return DEFAULT_FALLBACK_BACKEND_ID

    raise ValueError(
        f"No backend for legacy jobs. Set SchedulerApp.legacy_job_backend. "
        f"Available: {list(available_backends.keys())}"
    )
