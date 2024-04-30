import os
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import PropertyMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.executors import DefaultExecutionManager
from jupyter_scheduler.orm import Base, Job

NOTEBOOK_DIR = Path(__file__).resolve().parent / "test_staging_dir" / "job-3"
NOTEBOOK_NAME = "side_effects.ipynb"
NOTEBOOK_PATH = NOTEBOOK_DIR / NOTEBOOK_NAME
SIDE_EFFECT_FILE = NOTEBOOK_DIR / "output_side_effect.txt"


def test_execution_manager_with_side_effects():
    db_url = "sqlite://"
    engine = create_engine(db_url, echo=False)
    Base.metadata.create_all(engine)
    db_session = sessionmaker(bind=engine)
    with db_session() as session:
        job = Job(
            runtime_environment_name="abc",
            input_filename=NOTEBOOK_NAME,
            job_id="123",
        )
        session.add(job)
        session.commit()

        manager = DefaultExecutionManager(
            job_id="123",
            root_dir=str(NOTEBOOK_DIR),
            db_url=db_url,
            staging_paths={"input": str(NOTEBOOK_PATH)},
        )

        with patch.object(
            DefaultExecutionManager,
            "db_session",
            new_callable=PropertyMock,
        ) as mock_db_session:
            mock_db_session.return_value = db_session
            manager.add_side_effects_files(str(NOTEBOOK_DIR))

            assert (
                "output_side_effect.txt" in job.packaged_files
            ), "Side effect file was not added to packaged_files"
