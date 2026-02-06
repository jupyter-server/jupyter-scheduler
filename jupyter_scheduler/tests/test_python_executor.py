import shutil
from pathlib import Path

import pytest

from jupyter_scheduler.orm import Job
from jupyter_scheduler.python_executor import PythonScriptExecutionManager


@pytest.fixture
def python_script_staging_dir(jp_scheduler_staging_dir) -> Path:
    """Create a staging directory for Python script tests."""
    job_staging_dir = jp_scheduler_staging_dir / "job-py-1"
    job_staging_dir.mkdir()
    return job_staging_dir


@pytest.fixture
def simple_script(static_test_files_dir, python_script_staging_dir) -> Path:
    """Copy test script to staging."""
    return Path(shutil.copy2(static_test_files_dir / "test_script.py", python_script_staging_dir))


@pytest.fixture
def script_with_params(static_test_files_dir, python_script_staging_dir) -> Path:
    """Copy param script to staging."""
    return Path(shutil.copy2(static_test_files_dir / "param_script.py", python_script_staging_dir))


@pytest.fixture
def failing_script(static_test_files_dir, python_script_staging_dir) -> Path:
    """Copy failing script to staging."""
    return Path(
        shutil.copy2(static_test_files_dir / "failing_script.py", python_script_staging_dir)
    )


@pytest.fixture
def script_with_side_effects(static_test_files_dir, python_script_staging_dir) -> Path:
    """Copy side effects script to staging."""
    return Path(
        shutil.copy2(static_test_files_dir / "side_effects_script.py", python_script_staging_dir)
    )


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


# PythonScriptExecutionManager tests


def test_execute_simple_script(
    python_job_record,
    simple_script,
    jp_scheduler_root_dir,
    jp_scheduler_db_url,
    jp_scheduler_db,
):
    """Execute a simple print script and verify stdout is captured."""
    staging_dir = simple_script.parent
    stdout_path = staging_dir / "stdout.log"
    stderr_path = staging_dir / "stderr.log"

    manager = PythonScriptExecutionManager(
        job_id=python_job_record,
        root_dir=str(jp_scheduler_root_dir),
        db_url=jp_scheduler_db_url,
        staging_paths={
            "input": str(simple_script),
            "stdout": str(stdout_path),
            "stderr": str(stderr_path),
        },
    )

    manager.execute()

    assert stdout_path.exists()
    assert "Hello from Python script!" in stdout_path.read_text()


def test_execute_with_parameters(
    python_job_with_params,
    script_with_params,
    jp_scheduler_root_dir,
    jp_scheduler_db_url,
    jp_scheduler_db,
):
    """Parameters are passed as JUPYTER_PARAM_* env vars."""
    staging_dir = script_with_params.parent
    stdout_path = staging_dir / "stdout.log"
    stderr_path = staging_dir / "stderr.log"

    manager = PythonScriptExecutionManager(
        job_id=python_job_with_params,
        root_dir=str(jp_scheduler_root_dir),
        db_url=jp_scheduler_db_url,
        staging_paths={
            "input": str(script_with_params),
            "stdout": str(stdout_path),
            "stderr": str(stderr_path),
        },
    )

    manager.execute()

    content = stdout_path.read_text()
    assert "lr=0.01" in content
    assert "batch=32" in content


def test_execute_script_failure(
    failing_script,
    jp_scheduler_root_dir,
    jp_scheduler_db_url,
    jp_scheduler_db,
):
    """Non-zero exit code raises RuntimeError."""
    staging_dir = failing_script.parent
    stdout_path = staging_dir / "stdout.log"
    stderr_path = staging_dir / "stderr.log"

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
        staging_paths={
            "input": str(failing_script),
            "stdout": str(stdout_path),
            "stderr": str(stderr_path),
        },
    )

    with pytest.raises(RuntimeError) as exc_info:
        manager.execute()

    assert "exited with code 1" in str(exc_info.value)
    assert "Errors" in str(exc_info.value)


def test_side_effects_captured(
    script_with_side_effects,
    jp_scheduler_root_dir,
    jp_scheduler_db_url,
    jp_scheduler_db,
):
    """Files created by the script are recorded in packaged_files."""
    staging_dir = script_with_side_effects.parent
    stdout_path = staging_dir / "stdout.log"
    stderr_path = staging_dir / "stderr.log"

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
        staging_paths={
            "input": str(script_with_side_effects),
            "stdout": str(stdout_path),
            "stderr": str(stderr_path),
        },
    )

    manager.execute()

    jp_scheduler_db.expire_all()
    job = jp_scheduler_db.query(Job).filter(Job.job_id == job.job_id).one()

    assert "output.txt" in job.packaged_files
