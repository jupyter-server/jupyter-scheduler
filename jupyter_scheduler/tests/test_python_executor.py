import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from jupyter_scheduler.models import DescribeJob
from jupyter_scheduler.orm import Job
from jupyter_scheduler.python_executor import PythonScriptExecutionManager


@pytest.fixture
def python_script_staging_dir(jp_scheduler_staging_dir) -> Path:
    """Create a staging directory with a simple Python script."""
    job_staging_dir = jp_scheduler_staging_dir / "job-py-1"
    job_staging_dir.mkdir()
    return job_staging_dir


@pytest.fixture
def simple_script(python_script_staging_dir) -> Path:
    """Create a simple print script."""
    script_path = python_script_staging_dir / "test_script.py"
    script_path.write_text('print("Hello from Python script!")\n')
    return script_path


@pytest.fixture
def script_with_params(python_script_staging_dir) -> Path:
    """Create a script that reads JUPYTER_PARAM_* env vars."""
    script_path = python_script_staging_dir / "param_script.py"
    script_path.write_text(
        """import os
learning_rate = os.environ.get('JUPYTER_PARAM_learning_rate', 'not_set')
batch_size = os.environ.get('JUPYTER_PARAM_batch_size', 'not_set')
print(f"lr={learning_rate}, batch={batch_size}")
"""
    )
    return script_path


@pytest.fixture
def failing_script(python_script_staging_dir) -> Path:
    """Create a script that exits with non-zero code."""
    script_path = python_script_staging_dir / "failing_script.py"
    script_path.write_text('import sys; print("error message", file=sys.stderr); sys.exit(1)\n')
    return script_path


@pytest.fixture
def script_with_side_effects(python_script_staging_dir) -> Path:
    """Create a script that creates output files."""
    script_path = python_script_staging_dir / "side_effects_script.py"
    script_path.write_text(
        """
with open('output.txt', 'w') as f:
    f.write('Generated output')
print("Created output.txt")
"""
    )
    return script_path


@pytest.fixture
def python_job_record(simple_script, jp_scheduler_db) -> str:
    """Create a job record for the Python script."""
    job = Job(
        name="test_python_job",
        runtime_environment_name="default",
        input_filename=simple_script.name,
    )
    jp_scheduler_db.add(job)
    jp_scheduler_db.commit()
    return job.job_id


@pytest.fixture
def python_job_with_params(script_with_params, jp_scheduler_db) -> str:
    """Create a job record with parameters."""
    job = Job(
        name="test_python_job_with_params",
        runtime_environment_name="default",
        input_filename=script_with_params.name,
        parameters={"learning_rate": "0.01", "batch_size": "32"},
    )
    jp_scheduler_db.add(job)
    jp_scheduler_db.commit()
    return job.job_id


class TestPythonScriptExecutionManager:
    def test_execute_simple_script(
        self,
        python_job_record,
        simple_script,
        jp_scheduler_root_dir,
        jp_scheduler_db_url,
        jp_scheduler_db,
    ):
        """Execute a simple print script and verify stdout is captured."""
        manager = PythonScriptExecutionManager(
            job_id=python_job_record,
            root_dir=str(jp_scheduler_root_dir),
            db_url=jp_scheduler_db_url,
            staging_paths={"input": str(simple_script)},
        )

        # Execute should not raise
        manager.execute()

        # Check stdout.log was created
        stdout_path = simple_script.parent / "stdout.log"
        assert stdout_path.exists()
        assert "Hello from Python script!" in stdout_path.read_text()

    def test_execute_with_parameters(
        self,
        python_job_with_params,
        script_with_params,
        jp_scheduler_root_dir,
        jp_scheduler_db_url,
        jp_scheduler_db,
    ):
        """Parameters are passed as JUPYTER_PARAM_* env vars."""
        manager = PythonScriptExecutionManager(
            job_id=python_job_with_params,
            root_dir=str(jp_scheduler_root_dir),
            db_url=jp_scheduler_db_url,
            staging_paths={"input": str(script_with_params)},
        )

        manager.execute()

        stdout_path = script_with_params.parent / "stdout.log"
        content = stdout_path.read_text()
        assert "lr=0.01" in content
        assert "batch=32" in content

    def test_execute_script_failure(
        self,
        failing_script,
        jp_scheduler_root_dir,
        jp_scheduler_db_url,
        jp_scheduler_db,
    ):
        """Non-zero exit code raises RuntimeError."""
        job = Job(
            name="test_failing_script",
            runtime_environment_name="default",
            input_filename=failing_script.name,
        )
        jp_scheduler_db.add(job)
        jp_scheduler_db.commit()

        manager = PythonScriptExecutionManager(
            job_id=job.job_id,
            root_dir=str(jp_scheduler_root_dir),
            db_url=jp_scheduler_db_url,
            staging_paths={"input": str(failing_script)},
        )

        with pytest.raises(RuntimeError) as exc_info:
            manager.execute()

        assert "exited with code 1" in str(exc_info.value)
        assert "error message" in str(exc_info.value)

    def test_stdout_stderr_captured(
        self,
        failing_script,
        jp_scheduler_root_dir,
        jp_scheduler_db_url,
        jp_scheduler_db,
    ):
        """Both stdout and stderr are written to files even on failure."""
        job = Job(
            name="test_stderr_capture",
            runtime_environment_name="default",
            input_filename=failing_script.name,
        )
        jp_scheduler_db.add(job)
        jp_scheduler_db.commit()

        manager = PythonScriptExecutionManager(
            job_id=job.job_id,
            root_dir=str(jp_scheduler_root_dir),
            db_url=jp_scheduler_db_url,
            staging_paths={"input": str(failing_script)},
        )

        with pytest.raises(RuntimeError):
            manager.execute()

        stderr_path = failing_script.parent / "stderr.log"
        assert stderr_path.exists()
        assert "error message" in stderr_path.read_text()

    def test_side_effects_captured(
        self,
        script_with_side_effects,
        jp_scheduler_root_dir,
        jp_scheduler_db_url,
        jp_scheduler_db,
    ):
        """Files created by the script are recorded in packaged_files."""
        job = Job(
            name="test_side_effects",
            runtime_environment_name="default",
            input_filename=script_with_side_effects.name,
        )
        jp_scheduler_db.add(job)
        jp_scheduler_db.commit()

        manager = PythonScriptExecutionManager(
            job_id=job.job_id,
            root_dir=str(jp_scheduler_root_dir),
            db_url=jp_scheduler_db_url,
            staging_paths={"input": str(script_with_side_effects)},
        )

        manager.execute()

        # Refresh job from DB
        jp_scheduler_db.expire_all()
        job = jp_scheduler_db.query(Job).filter(Job.job_id == job.job_id).one()

        # output.txt should be in packaged_files
        assert "output.txt" in job.packaged_files

    def test_supported_features(self):
        """Verify supported features match expected values."""
        from jupyter_scheduler.models import JobFeature

        features = PythonScriptExecutionManager.supported_features()

        assert features[JobFeature.job_name] is True
        assert features[JobFeature.output_formats] is False
        assert features[JobFeature.stop_job] is True
        assert features[JobFeature.delete_job] is True
