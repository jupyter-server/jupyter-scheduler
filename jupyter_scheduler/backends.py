from typing import Any, Dict, List, Optional

from jupyter_scheduler.base_backend import BaseBackend
from jupyter_scheduler.models import OutputFormat
from jupyter_scheduler.pydantic_v1 import BaseModel, Field

JUPYTER_SERVER_NB_BACKEND_ID = "jupyter_server_nb"
JUPYTER_SERVER_PY_BACKEND_ID = "jupyter_server_py"
DEFAULT_FALLBACK_BACKEND_ID = JUPYTER_SERVER_NB_BACKEND_ID


class BackendConfig(BaseModel):
    """Runtime configuration for an initialized backend instance."""

    id: str
    name: str
    description: str
    scheduler_class: str
    execution_manager_class: str
    database_manager_class: Optional[str] = None
    db_url: Optional[str] = None
    file_extensions: List[str] = Field(default_factory=list)
    output_formats: List[Dict[str, str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None


class DescribeBackendResponse(BaseModel):
    """API response model for GET /scheduler/backends.

    Backends are returned sorted alphabetically by name for consistent UI ordering.
    Use preferred_backends config to control which backend is pre-selected per file extension.
    """

    id: str
    name: str
    description: str
    file_extensions: List[str]
    output_formats: List[OutputFormat]

    class Config:
        orm_mode = True


class JupyterServerNotebookBackend(BaseBackend):
    """Built-in backend executing notebooks via nbconvert on the Jupyter server."""

    id = JUPYTER_SERVER_NB_BACKEND_ID
    name = "Jupyter Server Notebook"
    description = "Execute notebooks on the Jupyter server"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.executors.DefaultExecutionManager"
    file_extensions = ["ipynb"]
    output_formats = [
        {"id": "ipynb", "label": "Notebook", "description": "Executed notebook with outputs"},
        {"id": "html", "label": "HTML", "description": "HTML export of notebook"},
    ]


class JupyterServerPythonBackend(BaseBackend):
    """Built-in backend executing Python scripts via subprocess on the Jupyter server."""

    id = JUPYTER_SERVER_PY_BACKEND_ID
    name = "Jupyter Server Python"
    description = "Execute Python scripts on the Jupyter server"
    scheduler_class = "jupyter_scheduler.scheduler.Scheduler"
    execution_manager_class = "jupyter_scheduler.python_executor.PythonScriptExecutionManager"
    file_extensions = ["py"]
    output_formats = [
        {"id": "stdout", "label": "Output", "description": "Standard output from script"},
        {"id": "stderr", "label": "Errors", "description": "Standard error from script"},
        {"id": "json", "label": "JSON", "description": "JSON result if script produces one"},
    ]
