import shutil
from pathlib import Path
from typing import Tuple

import pytest

from jupyter_scheduler.executors import DefaultExecutionManager
from jupyter_scheduler.orm import Job


@pytest.fixture
def staging_dir_with_side_effects(
    static_test_files_dir, jp_scheduler_staging_dir
) -> Tuple[Path, Path]:
    notebook_file_path = static_test_files_dir / "side_effects.ipynb"
    side_effect_file_path = static_test_files_dir / "output_side_effect.txt"
    job_staging_dir = jp_scheduler_staging_dir / "job-4"

    job_staging_dir.mkdir()
    shutil.copy2(notebook_file_path, job_staging_dir)
    shutil.copy2(side_effect_file_path, job_staging_dir)

    return (notebook_file_path, side_effect_file_path)


@pytest.fixture
def side_effects_job_record(staging_dir_with_side_effects, jp_scheduler_db) -> str:
    notebook_name = staging_dir_with_side_effects[0].name
    job = Job(
        runtime_environment_name="abc",
        input_filename=notebook_name,
    )
    jp_scheduler_db.add(job)
    jp_scheduler_db.commit()

    return job.job_id


def test_add_side_effects_files(
    side_effects_job_record,
    staging_dir_with_side_effects,
    jp_scheduler_root_dir,
    jp_scheduler_db_url,
    jp_scheduler_db,
):
    job_id = side_effects_job_record
    staged_notebook_file_path = staging_dir_with_side_effects[0]
    staged_notebook_dir = staged_notebook_file_path.parent
    side_effect_file_name = staging_dir_with_side_effects[1].name

    manager = DefaultExecutionManager(
        job_id=job_id,
        root_dir=jp_scheduler_root_dir,
        db_url=jp_scheduler_db_url,
        staging_paths={"input": staged_notebook_file_path},
    )
    manager.add_side_effects_files(staged_notebook_dir)

    job = jp_scheduler_db.query(Job).filter(Job.job_id == job_id).one()
    assert side_effect_file_name in job.packaged_files
