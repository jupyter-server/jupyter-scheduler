from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.executors import DefaultExecutionManager
from jupyter_scheduler.orm import Job

NOTEBOOK_NAME = "side_effects.ipynb"
SIDE_EFECT_FILE_NAME = "output_side_effect.txt"

NOTEBOOK_DIR = Path(__file__).resolve().parent / "test_staging_dir" / "job-4"
NOTEBOOK_PATH = NOTEBOOK_DIR / NOTEBOOK_NAME
SIDE_EFFECT_FILE = NOTEBOOK_DIR / SIDE_EFECT_FILE_NAME


@pytest.fixture
def staging_dir_with_side_effects(jp_scheduler_staging_dir):
    return ("side_effects.ipynb", "output_side_effect.txt")


@pytest.fixture
def side_effects_job_record(jp_scheduler_db, staging_dir_with_side_effects):
    notebook_name = staging_dir_with_side_effects[0]
    job = Job(
        runtime_environment_name="abc",
        input_filename=notebook_name,
    )
    jp_scheduler_db.add(job)
    jp_scheduler_db.commit()
    return job.job_id


def test_add_side_effects_files(
    jp_scheduler_db, side_effects_job_record, jp_scheduler_db_url, jp_scheduler_root_dir
):
    job_id = side_effects_job_record
    manager = DefaultExecutionManager(
        job_id=job_id,
        root_dir=jp_scheduler_root_dir,
        db_url=jp_scheduler_db_url,
        staging_paths={"input": str(NOTEBOOK_PATH)},
    )
    manager.add_side_effects_files(str(NOTEBOOK_DIR))

    job = jp_scheduler_db.query(Job).filter(Job.job_id == job_id).one()
    assert SIDE_EFECT_FILE_NAME in job.packaged_files
