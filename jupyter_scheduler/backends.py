"""Backend configuration models for multi-backend support.

This module provides:
- BackendConfig: Runtime configuration dataclass for initialized backends
- DescribeBackend: API response model for frontend consumption
- LocalBackend: Built-in backend for local notebook execution

A backend bundles a tightly-coupled set of classes:
- scheduler_class: Manages job lifecycle and persistence
- execution_manager_class: Handles actual notebook execution
- database_manager_class (optional): Custom storage implementation

Backends are discovered via Python entry points at startup. Third-party packages
register backends in their pyproject.toml:

    [project.entry-points."jupyter_scheduler.backends"]
    mybackend = "my_package:MyBackend"
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from jupyter_scheduler.base_backend import BaseBackend
from jupyter_scheduler.pydantic_v1 import BaseModel


class LocalBackend(BaseBackend):
    """Built-in backend for local notebook execution.

    Executes notebooks as subprocesses on the Jupyter server host.
    This is the default backend when no other backends are configured.
    """

    id = "local"
    name = "Local Execution"
    description = "Execute notebooks locally on the Jupyter server"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.executors.DefaultExecutionManager"
    file_extensions = ["ipynb"]
    priority = 0  # Lowest priority allows other backends to take precedence


@dataclass
class BackendConfig:
    """Configuration for a backend instance.

    Attributes
    ----------
    id : str
        Unique identifier for this backend (e.g., "local", "kubernetes", "sagemaker")
    name : str
        Human-readable display name (e.g., "Local Execution")
    description : str
        Help text for UI
    scheduler_class : str
        Fully qualified class name for the scheduler
    execution_manager_class : str
        Fully qualified class name for the execution manager
    database_manager_class : str, optional
        Fully qualified class name for the database manager. If None, uses default SQLAlchemy.
    db_url : str, optional
        Backend-specific database URL. If None, uses the global db_url.
    file_extensions : list of str
        List of file extensions this backend supports (e.g., ["ipynb", "py"]).
        Empty list means all extensions are supported.
    is_default : bool
        Whether this is the default backend when no backend is specified.
    priority : int
        Priority for auto-selection when multiple backends support the same file type.
        Higher priority wins.
    metadata : dict, optional
        Additional backend-specific metadata (e.g., {"requires_s3": "true"})
    """

    id: str
    name: str
    description: str
    scheduler_class: str
    execution_manager_class: str
    database_manager_class: Optional[str] = None
    db_url: Optional[str] = None
    file_extensions: List[str] = field(default_factory=list)
    is_default: bool = False
    priority: int = 0
    metadata: Optional[Dict[str, Any]] = None


class DescribeBackend(BaseModel):
    """Backend information exposed to frontend via API.

    This is the response model for GET /scheduler/backends.
    """

    id: str
    name: str
    description: str
    file_extensions: List[str]
    is_default: bool

    class Config:
        """Pydantic config."""

        orm_mode = True
