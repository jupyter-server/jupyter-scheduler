from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ExecutionConfig:
    """
    Config values passed to the
    execution manager and scheduler
    """

    db_url: str
    root_dir: str
    execution_manager_class: Any
    environments_manager_class: Any
    task_runner_run_interval: int
