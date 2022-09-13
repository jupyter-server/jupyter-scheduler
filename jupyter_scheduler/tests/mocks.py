from typing import Dict, List

from jupyter_scheduler.config import ExecutionConfig
from jupyter_scheduler.environments import EnvironmentManager
from jupyter_scheduler.executors import ExecutionManager
from jupyter_scheduler.models import JobFeature, OutputFormat, RuntimeEnvironment
from jupyter_scheduler.scheduler import BaseScheduler


class MockExecutionManager(ExecutionManager):
    def __init__(self, job_id: str, config: ExecutionConfig = {}):
        pass

    def execute(self):
        pass

    def process(self):
        pass

    def supported_features(cls) -> Dict[JobFeature, bool]:
        return {
            JobFeature.job_name: True,
            JobFeature.output_formats: True,
            JobFeature.job_definition: False,
        }


class MockEnvironmentManager(EnvironmentManager):
    def list_environments(self) -> List[RuntimeEnvironment]:
        file_extensions = ["ipynb"]
        output_formats = [OutputFormat(name="ipynb", label="Notebook")]
        return [
            RuntimeEnvironment(
                name="env_a",
                label="env_a",
                description="/opt/anaconda3/envs/a",
                file_extensions=file_extensions,
                output_formats=output_formats,
            ),
            RuntimeEnvironment(
                name="env_b",
                label="env_a",
                description="/opt/anaconda3/envs/b",
                file_extensions=file_extensions,
                output_formats=output_formats,
            ),
        ]

    def manage_environments_command(self) -> str:
        return "command_a"
