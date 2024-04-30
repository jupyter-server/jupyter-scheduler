from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest

from jupyter_scheduler.executors import DefaultExecutionManager
from jupyter_scheduler.orm import Job
from pathlib import Path

from conftest import DB_URL

JOB_ID = "69856f4e-ce94-45fd-8f60-3a587457fce7"
NOTEBOOK_NAME = "side_effects.ipynb"
SIDE_EFECT_FILE_NAME = "output_side_effect.txt"

NOTEBOOK_DIR = Path(__file__).resolve().parent / "test_staging_dir" / "job-4"
NOTEBOOK_PATH = NOTEBOOK_DIR / NOTEBOOK_NAME
SIDE_EFFECT_FILE = NOTEBOOK_DIR / SIDE_EFECT_FILE_NAME


@pytest.fixture
def load_job(jp_scheduler_db):
    with jp_scheduler_db() as session:
        job = Job(
            runtime_environment_name="abc",
            input_filename=NOTEBOOK_NAME,
            job_id=JOB_ID,
        )
        session.add(job)
        session.commit()


@pytest.fixture
def load_job(jp_scheduler_db):
    with jp_scheduler_db() as session:
        job = Job(
            runtime_environment_name="abc",
            input_filename=NOTEBOOK_NAME,
            job_id=JOB_ID,
        )
        session.add(job)
        session.commit()


def test_add_side_effects_files(jp_scheduler_db, load_job):
    manager = DefaultExecutionManager(
        job_id=JOB_ID,
        root_dir=str(NOTEBOOK_DIR),
        db_url=DB_URL,
        staging_paths={"input": str(NOTEBOOK_PATH)},
    )
    manager.add_side_effects_files(str(NOTEBOOK_DIR))

    with jp_scheduler_db() as session:
        job = session.query(Job).filter(Job.job_id == JOB_ID).one()
        assert (
            SIDE_EFECT_FILE_NAME in job.packaged_files
        ), "Side effect file was not added to packaged_files"
