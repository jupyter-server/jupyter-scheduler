from typing import Any, ClassVar, Dict, List, Optional


class BaseBackend:
    """Base class defining backend capabilities via class attributes.

    Attributes
    ----------
    id : str
        Unique identifier for the backend (e.g., "jupyter_server_nb").
    name : str
        Human-readable display name for the backend.
    description : str
        Description shown in the UI when selecting backends.
    scheduler_class : str
        Fully qualified class name for the scheduler implementation.
    execution_manager_class : str
        Fully qualified class name for the execution manager.
    database_manager_class : str, optional
        Fully qualified class name for custom database manager.
    file_extensions : List[str]
        File extensions this backend can execute (e.g., ["ipynb", "py"]).
    output_formats : List[Dict[str, str]]
        Output file formats produced by this backend. Each format is a dict with:
        - id: Format identifier used as key in staging_paths (e.g., "ipynb", "json")
        - label: Human-readable name shown in UI (e.g., "Notebook", "Results")
        - description: Optional tooltip text explaining the format
    priority : int
        Priority for backend selection when multiple backends support a file type.
        Higher values = higher priority (selected first).
    """

    id: ClassVar[str]
    name: ClassVar[str]
    description: ClassVar[str] = ""
    scheduler_class: ClassVar[str]
    execution_manager_class: ClassVar[str]
    database_manager_class: ClassVar[Optional[str]] = None
    file_extensions: ClassVar[List[str]] = []
    output_formats: ClassVar[List[Dict[str, str]]] = []
    priority: ClassVar[int] = 0

    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert class attributes to dictionary for BackendConfig creation."""
        return {
            "id": cls.id,
            "name": cls.name,
            "description": cls.description,
            "scheduler_class": cls.scheduler_class,
            "execution_manager_class": cls.execution_manager_class,
            "database_manager_class": cls.database_manager_class,
            "file_extensions": list(cls.file_extensions),
            "output_formats": list(cls.output_formats),
            "priority": cls.priority,
        }
