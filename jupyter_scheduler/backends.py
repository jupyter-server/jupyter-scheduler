from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from jupyter_scheduler.base_backend import BaseBackend
from jupyter_scheduler.pydantic_v1 import BaseModel


class JupyterServerNotebookBackend(BaseBackend):
    """Built-in backend executing notebooks via nbconvert on the Jupyter server."""

    id = "jupyter_server_nb"
    name = "Jupyter Server (Notebook)"
    description = "Execute notebooks on the Jupyter server"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.executors.DefaultExecutionManager"
    file_extensions = ["ipynb"]
    priority = 0


class JupyterServerPythonBackend(BaseBackend):
    """Built-in backend executing Python scripts via subprocess on the Jupyter server."""

    id = "jupyter_server_py"
    name = "Python Script"
    description = "Execute Python scripts on the Jupyter server"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.python_executor.PythonScriptExecutionManager"
    file_extensions = ["py"]
    priority = 0


@dataclass
class BackendConfig:
    """Runtime configuration for an initialized backend instance."""

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
    """API response model for GET /scheduler/backends."""

    id: str
    name: str
    description: str
    file_extensions: List[str]
    is_default: bool

    class Config:
        orm_mode = True
