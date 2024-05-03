from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.executors import DefaultExecutionManager
from jupyter_scheduler.orm import Job

JOB_ID = "69856f4e-ce94-45fd-8f60-3a587457fce7"
NOTEBOOK_NAME = "side_effects.ipynb"
SIDE_EFECT_FILE_NAME = "output_side_effect.txt"

NOTEBOOK_DIR = Path(__file__).resolve().parent / "test_staging_dir" / "job-4"
NOTEBOOK_PATH = NOTEBOOK_DIR / NOTEBOOK_NAME
SIDE_EFFECT_FILE = NOTEBOOK_DIR / SIDE_EFECT_FILE_NAME


@pytest.fixture
def load_job(jp_scheduler_db):
    job = Job(
        runtime_environment_name="abc",
        input_filename=NOTEBOOK_NAME,
        job_id=JOB_ID,
    )
    jp_scheduler_db.add(job)
    jp_scheduler_db.commit()


def test_add_side_effects_files(jp_scheduler_db, load_job, jp_scheduler_db_url):
    manager = DefaultExecutionManager(
        job_id=JOB_ID,
        root_dir=str(NOTEBOOK_DIR),
        db_url=jp_scheduler_db_url,
        staging_paths={"input": str(NOTEBOOK_PATH)},
    )
    manager.add_side_effects_files(str(NOTEBOOK_DIR))

    job = jp_scheduler_db.query(Job).filter(Job.job_id == JOB_ID).one()
    assert SIDE_EFECT_FILE_NAME in job.packaged_files
