"""Backend configuration models for multi-backend support.

A backend bundles a tightly-coupled set of classes:
- scheduler_class
- execution_manager_class
- database_manager_class (optional)

This allows multiple execution backends to be configured and selected at job creation time.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

from jupyter_scheduler.pydantic_v1 import BaseModel


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
