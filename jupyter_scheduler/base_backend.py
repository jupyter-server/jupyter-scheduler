from typing import Any, ClassVar, Dict, List, Optional


class BaseBackend:
    """Base class defining backend capabilities via class attributes."""

    id: ClassVar[str]
    name: ClassVar[str]
    description: ClassVar[str] = ""
    scheduler_class: ClassVar[str]
    execution_manager_class: ClassVar[str]
    database_manager_class: ClassVar[Optional[str]] = None
    file_extensions: ClassVar[List[str]] = []
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
            "priority": cls.priority,
        }
