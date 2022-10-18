from typing import Dict, List

from jupyter_scheduler.environments import EnvironmentManager
from jupyter_scheduler.executors import ExecutionManager
from jupyter_scheduler.models import JobFeature, RuntimeEnvironment, UpdateJobDefinition
from jupyter_scheduler.task_runner import BaseTaskRunner


class MockExecutionManager(ExecutionManager):
    def __init__(self, job_id: str, staging_paths: Dict[str, str], root_dir: str, db_url: str):
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
        output_formats = ["ipynb", "html"]
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

    def output_formats_mapping(self) -> Dict[str, str]:
        return {"ipynb": "Notebook", "html": "HTML"}


class MockTaskRunner(BaseTaskRunner):
    def __init__(self, config=None, **kwargs):
        super().__init__(config=config)

    async def start(self):
        pass

    def add_job_definition(self, job_definition_id: str):
        pass

    def update_job_definition(self, job_definition_id: str, model: UpdateJobDefinition):
        pass

    def delete_job_definition(self, job_definition_id: str):
        pass

    def pause_jobs(self, job_definition_id: str):
        pass

    def resume_jobs(self, job_definition_id: str):
        pass
