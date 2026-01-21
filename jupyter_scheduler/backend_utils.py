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
        # Attempt to load the backend class
        try:
            backend_class = ep.load()
        except ImportError as e:
            # Missing dependency - provide actionable message
            missing_package = getattr(e, "name", str(e))
            log.warning(
                f"Unable to load backend '{ep.name}': missing dependency '{missing_package}'. "
                f"Install the required package to enable this backend."
            )
            continue
        except Exception as e:
            log.warning(f"Unable to load backend '{ep.name}': {e}")
            continue

        # Validate the backend class has required attributes
        if not hasattr(backend_class, "id"):
            log.warning(f"Backend '{ep.name}' does not define 'id' attribute. Skipping.")
            continue

        backend_id = backend_class.id
        backends[backend_id] = backend_class
        log.info(f"Registered backend '{backend_id}' ({backend_class.name})")

    return backends


def get_default_backend_id(
    available_backends: Dict[str, Type[BaseBackend]],
    configured_default: Optional[str] = None,
) -> str:
    """Select default backend with priority: configured > DEFAULT_FALLBACK_BACKEND_ID > error.

    Args:
        available_backends: Dict of backend_id -> backend class
        configured_default: Admin-configured default backend ID (optional)

    Returns:
        The backend ID to use as default

    Raises:
        ValueError: If no backends available, or if DEFAULT_FALLBACK_BACKEND_ID is
            unavailable and no default is configured. Admins who customize backends
            must explicitly set SchedulerApp.default_backend.
    """
    if not available_backends:
        raise ValueError("No scheduler backends available.")

    if configured_default and configured_default in available_backends:
        return configured_default

    if configured_default and configured_default not in available_backends:
        logger.warning(
            f"Configured default_backend '{configured_default}' not found. "
            f"Available: {list(available_backends.keys())}"
        )

    if DEFAULT_FALLBACK_BACKEND_ID in available_backends:
        return DEFAULT_FALLBACK_BACKEND_ID

    # No silent fallback - require explicit configuration
    raise ValueError(
        f"Default backend '{DEFAULT_FALLBACK_BACKEND_ID}' not available. "
        f"Set SchedulerApp.default_backend explicitly. "
        f"Available backends: {list(available_backends.keys())}"
    )
