"""Backend discovery utilities.

This module provides functions for discovering scheduler backends registered
via Python entry points. The entry point group "jupyter_scheduler.backends"
is scanned at startup to find all available backend implementations.

The discovery system supports:
- Automatic registration of pip-installed backend packages
- Allow/block lists for filtering available backends
- Graceful handling of missing dependencies
"""

import logging
from importlib.metadata import entry_points
from typing import Dict, List, Optional, Type

from jupyter_scheduler.base_backend import BaseBackend

ENTRY_POINT_GROUP = "jupyter_scheduler.backends"

logger = logging.getLogger(__name__)


def discover_backends(
    log: Optional[logging.Logger] = None,
    allowed_backends: Optional[List[str]] = None,
    blocked_backends: Optional[List[str]] = None,
) -> Dict[str, Type[BaseBackend]]:
    """Discover all registered backends via entry points.

    Scans the "jupyter_scheduler.backends" entry point group for registered
    backend classes. Each entry point should reference a class that inherits
    from BaseBackend.

    Parameters
    ----------
    log : logging.Logger, optional
        Logger for status messages. If None, uses module logger.
    allowed_backends : list of str, optional
        If provided, only backends with IDs in this list are included.
        Takes precedence over blocked_backends for the same ID.
    blocked_backends : list of str, optional
        If provided, backends with IDs in this list are excluded.

    Returns
    -------
    dict
        Mapping of backend_id -> backend class for all discovered backends.

    Notes
    -----
    Backends are filtered in this order:
    1. Entry point is loaded (skip on ImportError with warning)
    2. Backend ID is checked against blocked_backends (skip if blocked)
    3. Backend ID is checked against allowed_backends (skip if not allowed)

    Example entry point registration in pyproject.toml:

        [project.entry-points."jupyter_scheduler.backends"]
        local = "jupyter_scheduler.backends:LocalBackend"
        k8s = "jupyter_scheduler_k8s:K8sBackend"
    """
    if log is None:
        log = logger

    backends: Dict[str, Type[BaseBackend]] = {}

    # Get entry points for the backends group
    # Compatible with Python 3.9+ importlib.metadata
    eps = entry_points()
    if hasattr(eps, "select"):
        # Python 3.10+ / importlib_metadata style
        backend_eps = eps.select(group=ENTRY_POINT_GROUP)
    else:
        # Python 3.9 style (returns dict)
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
            log.warning(
                f"Backend '{ep.name}' does not define 'id' attribute. Skipping."
            )
            continue

        backend_id = backend_class.id

        # Apply block list
        if blocked_backends and backend_id in blocked_backends:
            log.debug(f"Backend '{backend_id}' is blocked by configuration.")
            continue

        # Apply allow list (if specified, only allowed backends pass)
        if allowed_backends is not None and backend_id not in allowed_backends:
            log.debug(f"Backend '{backend_id}' is not in allowed list.")
            continue

        backends[backend_id] = backend_class
        log.info(f"Registered backend '{backend_id}' ({backend_class.name})")

    return backends


def get_default_backend_id(
    available_backends: Dict[str, Type[BaseBackend]],
    configured_default: Optional[str] = None,
) -> str:
    """Determine the default backend ID.

    Selection priority:
    1. Explicitly configured default (if available)
    2. "local" backend (if available)
    3. First available backend (sorted by ID for determinism)

    Parameters
    ----------
    available_backends : dict
        Mapping of backend_id -> backend class from discover_backends().
    configured_default : str, optional
        Administrator-configured default backend ID.

    Returns
    -------
    str
        The backend ID to use as default.

    Raises
    ------
    ValueError
        If no backends are available.
    """
    if not available_backends:
        raise ValueError(
            "No scheduler backends available. "
            "Ensure at least one backend package is installed."
        )

    # Explicit configuration takes precedence
    if configured_default and configured_default in available_backends:
        return configured_default

    # Warn if configured default is not available
    if configured_default and configured_default not in available_backends:
        logger.warning(
            f"Configured default_backend '{configured_default}' not found. "
            f"Available backends: {list(available_backends.keys())}"
        )

    # Fall back to "local" if available
    if "local" in available_backends:
        return "local"

    # Last resort: first available (sorted for determinism)
    return sorted(available_backends.keys())[0]
