import os
import subprocess
import sys
from typing import Dict

import fsspec

from jupyter_scheduler.executors import ExecutionManager
from jupyter_scheduler.models import JobFeature
from jupyter_scheduler.orm import Job


class PythonScriptExecutionManager(ExecutionManager):
    """Execute Python scripts via subprocess."""

    def execute(self) -> None:
        """Execute the Python script and capture output."""
        job = self.model
        staging_dir = os.path.dirname(self.staging_paths["input"])

        env = os.environ.copy()
        if job.parameters:
            for key, value in job.parameters.items():
                env[f"JUPYTER_PARAM_{key}"] = str(value)

        result = subprocess.run(
            [sys.executable, self.staging_paths["input"]],
            cwd=staging_dir,
            capture_output=True,
            text=True,
            env=env,
        )

        stdout_path = self.staging_paths["stdout"]
        stderr_path = self.staging_paths["stderr"]

        if result.stdout:
            with fsspec.open(stdout_path, "w", encoding="utf-8") as f:
                f.write(result.stdout)
        if result.stderr:
            with fsspec.open(stderr_path, "w", encoding="utf-8") as f:
                f.write(result.stderr)

        # Capture any additional side effect files AFTER writing stdout/stderr
        self.add_side_effects_files(staging_dir)

        if result.returncode != 0:
            raise RuntimeError(
                f"Script exited with code {result.returncode}. See 'Errors' output for full error trace."
            )

    def add_side_effects_files(self, staging_dir: str) -> None:
        """Scan for files created during execution and update job's packaged_files."""
        input_script = os.path.basename(self.staging_paths["input"])
        new_files = set()
        for root, _, files in os.walk(staging_dir):
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), staging_dir)
                if rel_path != input_script:
                    new_files.add(rel_path)

        if new_files:
            with self.db_session() as session:
                current = set(
                    session.query(Job.packaged_files).filter(Job.job_id == self.job_id).scalar()
                    or []
                )
                session.query(Job).filter(Job.job_id == self.job_id).update(
                    {"packaged_files": list(current.union(new_files))}
                )
                session.commit()

    def validate(cls, input_path: str) -> bool:
        """Python scripts don't require kernel validation like notebooks."""
        return True

    @classmethod
    def supported_features(cls) -> Dict[JobFeature, bool]:
        return {
            JobFeature.job_name: True,
            JobFeature.output_formats: False,  # No notebook conversion for .py
            JobFeature.job_definition: False,
            JobFeature.idempotency_token: False,
            JobFeature.tags: False,
            JobFeature.email_notifications: False,
            JobFeature.timeout_seconds: False,
            JobFeature.retry_on_timeout: False,
            JobFeature.max_retries: False,
            JobFeature.min_retry_interval_millis: False,
            JobFeature.output_filename_template: False,
            JobFeature.stop_job: True,
            JobFeature.delete_job: True,
        }
