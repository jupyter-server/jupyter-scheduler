"""Base class for scheduler backends.

This module defines the BaseBackend class that all scheduler backends must inherit from.
Backend packages declare their capabilities via class attributes, enabling automatic
discovery through Python entry points.

Third-party packages register backends in their pyproject.toml:

    [project.entry-points."jupyter_scheduler.backends"]
    mybackend = "my_package:MyBackend"

Example backend implementation:

    class MyBackend(BaseBackend):
        id = "mybackend"
        name = "My Custom Backend"
        description = "Execute notebooks on my infrastructure"
        scheduler_class = "my_package.scheduler.MyScheduler"
        execution_manager_class = "my_package.executors.MyExecutionManager"
        file_extensions = ["ipynb", "py"]
        priority = 10
"""

from typing import Any, ClassVar, Dict, List, Optional


class BaseBackend:
    """Base class for scheduler backends.

    Backend implementations declare their capabilities through class attributes.
    The entry points system discovers these classes at runtime, enabling
    pip-installable backend packages that auto-register without configuration.

    Class Attributes
    ----------------
    id : str
        Unique identifier used in API requests and configuration.
        Convention: lowercase, alphanumeric with hyphens (e.g., "local", "k8s", "sagemaker").

    name : str
        Human-readable display name shown in the UI.

    description : str
        Help text explaining the backend's purpose and requirements.

    scheduler_class : str
        Fully qualified path to the scheduler class (e.g., "module.submodule.ClassName").
        Must be a subclass of jupyter_scheduler.scheduler.BaseScheduler.

    execution_manager_class : str
        Fully qualified path to the execution manager class.
        Must be a subclass of jupyter_scheduler.executors.ExecutionManager.

    database_manager_class : str, optional
        Fully qualified path to a custom database manager class.
        If None, uses the default SQLAlchemy-based storage.

    file_extensions : list of str
        File extensions this backend supports (e.g., ["ipynb", "py"]).
        Empty list means all extensions are supported.

    priority : int
        Auto-selection priority when multiple backends support the same file type.
        Higher values take precedence. Default is 0.

    Notes
    -----
    This class intentionally does not inherit from pydantic.BaseModel to avoid
    adding pydantic validation overhead for what is essentially a static
    configuration container. The class attributes are read once at startup.
    """

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
        """Convert class attributes to a dictionary for BackendConfig creation.

        Returns
        -------
        dict
            Dictionary containing all backend configuration attributes.
        """
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
