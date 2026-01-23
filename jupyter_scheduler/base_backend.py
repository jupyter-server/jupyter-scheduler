from typing import TYPE_CHECKING, Any, ClassVar, Dict, List, Optional

if TYPE_CHECKING:
    # Import for type hints only (avoids circular import at runtime)
    from jupyter_scheduler.models import OutputFormat


class BaseBackend:
    """Base class for scheduler backends. Subclasses define capabilities via class attributes."""

    id: ClassVar[str]
    name: ClassVar[str]
    description: ClassVar[str] = ""
    scheduler_class: ClassVar[str]
    execution_manager_class: ClassVar[str]
    database_manager_class: ClassVar[Optional[str]] = None
    file_extensions: ClassVar[List[str]] = []
    output_formats: ClassVar[List["OutputFormat"]] = []

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
        }
