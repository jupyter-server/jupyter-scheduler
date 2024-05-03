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
def create_job(jp_scheduler_db):
    job = Job(
        runtime_environment_name="abc",
        input_filename=NOTEBOOK_NAME,
    )
    jp_scheduler_db.add(job)
    jp_scheduler_db.commit()
    return job.job_id


def test_add_side_effects_files(jp_scheduler_db, create_job, jp_scheduler_db_url):
    job_id = create_job
    manager = DefaultExecutionManager(
        job_id=job_id,
        root_dir=str(NOTEBOOK_DIR),
        db_url=jp_scheduler_db_url,
        staging_paths={"input": str(NOTEBOOK_PATH)},
    )
    manager.add_side_effects_files(str(NOTEBOOK_DIR))

    job = jp_scheduler_db.query(Job).filter(Job.job_id == job_id).one()
    assert SIDE_EFECT_FILE_NAME in job.packaged_files
