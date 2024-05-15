"""Tests for scheduler"""

import shutil
from pathlib import Path
from unittest import mock
from unittest.mock import patch

import pytest

from jupyter_scheduler.models import (
    CreateJob,
    CreateJobDefinition,
    ListJobDefinitionsQuery,
    SortDirection,
    SortField,
    UpdateJobDefinition,
)
from jupyter_scheduler.orm import Job, JobDefinition


@pytest.fixture
def root_dir_with_input_folder(static_test_files_dir, jp_scheduler_root_dir):
    notebook_file_path = static_test_files_dir / "import-helloworld.ipynb"
    dependency_file_path = static_test_files_dir / "helloworld.txt"
    job_root_dir = jp_scheduler_root_dir / "job-5"
    dependency_root_dir = job_root_dir / "a" / "b"

    dependency_root_dir.mkdir(parents=True)
    shutil.copy2(notebook_file_path, job_root_dir)
    shutil.copy2(dependency_file_path, dependency_root_dir)

    return Path(job_root_dir.name) / notebook_file_path.name


def test_create_job_definition(jp_scheduler):
    with patch("jupyter_scheduler.scheduler.fsspec") as mock_fsspec:
        with patch("jupyter_scheduler.scheduler.Scheduler.file_exists") as mock_file_exists:
            mock_file_exists.return_value = True
            job_definition_id = jp_scheduler.create_job_definition(
                CreateJobDefinition(
                    input_uri="helloworld.ipynb",
                    runtime_environment_name="default",
                    name="hello world",
                    output_formats=["ipynb"],
                )
            )

    with jp_scheduler.db_session() as session:
        definitions = session.query(JobDefinition).all()
        assert 1 == len(definitions)
        definition = definitions[0]
        assert job_definition_id
        assert job_definition_id == definition.job_definition_id
        assert "helloworld.ipynb" == definition.input_filename
        assert "default" == definition.runtime_environment_name
        assert "hello world" == definition.name


def test_create_job_definition_with_input_folder(jp_scheduler, root_dir_with_input_folder):
    job_definition_id = jp_scheduler.create_job_definition(
        CreateJobDefinition(
            input_uri=str(root_dir_with_input_folder),
            runtime_environment_name="default",
            name="import hello world",
            output_formats=["ipynb"],
            package_input_folder=True,
        )
    )

    with jp_scheduler.db_session() as session:
        definitions = session.query(JobDefinition).all()
        assert 1 == len(definitions)
        definition = definitions[0]
        assert job_definition_id
        assert job_definition_id == definition.job_definition_id
        assert "import hello world" == definition.name
        assert "a/b/helloworld.txt" in definition.packaged_files


def test_create_job_with_input_folder(jp_scheduler, root_dir_with_input_folder):
    job_id = jp_scheduler.create_job(
        CreateJob(
            input_uri=str(root_dir_with_input_folder),
            runtime_environment_name="default",
            name="import hello world",
            output_formats=["ipynb"],
            package_input_folder=True,
        )
    )

    with jp_scheduler.db_session() as session:
        jobs = session.query(Job).all()
        assert 1 == len(jobs)
        job = jobs[0]
        assert job_id
        assert job_id == job.job_id
        assert "import hello world" == job.name
        assert "default" == job.runtime_environment_name
        assert "a/b/helloworld.txt" in job.packaged_files


job_definition_1 = {
    "job_definition_id": "f4f8c8a9-f539-429a-b69e-b567f578646e",
    "name": "hello world 1",
    "input_filename": "helloworld_1.ipynb",
    "runtime_environment_name": "environment-a",
    "schedule": "* * * * *",
    "timezone": "America/Los_Angeles",
    "update_time": 1,
    "create_time": 1,
    "active": True,
    "packaged_files": [],
}

job_definition_2 = {
    "job_definition_id": "dfc63587-e635-44c8-a86b-7f9f196059dc",
    "name": "hello world 2",
    "input_filename": "helloworld_2.ipynb",
    "runtime_environment_name": "environment-a",
    "schedule": "* * * * *",
    "timezone": "America/Los_Angeles",
    "update_time": 2,
    "create_time": 2,
    "active": True,
    "tags": ["tag_2"],
    "packaged_files": [],
}

job_definition_3 = {
    "job_definition_id": "a4050609-c2ec-4737-959c-4b046ca6a889",
    "name": "hello world 3",
    "input_filename": "helloworld_3.ipynb",
    "runtime_environment_name": "environment-a",
    "schedule": "* * * * *",
    "timezone": "America/Los_Angeles",
    "update_time": 3,
    "create_time": 3,
    "active": False,
    "tags": ["tag_3"],
    "packaged_files": [],
}


@pytest.fixture
def load_job_definitions(jp_scheduler_db):
    jp_scheduler_db.add(JobDefinition(**job_definition_1))
    jp_scheduler_db.add(JobDefinition(**job_definition_2))
    jp_scheduler_db.add(JobDefinition(**job_definition_3))
    jp_scheduler_db.commit()


@pytest.mark.parametrize(
    "list_query,expected_response",
    [
        (
            {
                "create_time": 2,
            },
            {"job_definitions": [job_definition_3, job_definition_2], "total_count": 2},
        ),
        ({"name": "hello world 2"}, {"job_definitions": [job_definition_2], "total_count": 1}),
        ({"tags": ["tag_3"]}, {"job_definitions": [job_definition_3], "total_count": 1}),
        (
            {"sort_by": [SortField(name="create_time", direction=SortDirection.asc)]},
            {
                "job_definitions": [job_definition_1, job_definition_2, job_definition_3],
                "total_count": 3,
            },
        ),
        (
            {"max_items": 2},
            {
                "job_definitions": [job_definition_3, job_definition_2],
                "total_count": 3,
                "next_token": "2",
            },
        ),
        (
            {"max_items": 2, "next_token": 2},
            {"job_definitions": [job_definition_1], "total_count": 3},
        ),
    ],
)
def test_list_job_definitions(jp_scheduler, load_job_definitions, list_query, expected_response):
    list_response = jp_scheduler.list_job_definitions(ListJobDefinitionsQuery(**list_query))
    response = list_response.dict(exclude_none=True)
    assert expected_response == response


def test_get_job_definition(jp_scheduler, load_job_definitions):
    definition = jp_scheduler.get_job_definition(job_definition_1["job_definition_id"])
    assert job_definition_1 == definition.dict(exclude_none=True)


def test_pause_jobs(jp_scheduler, load_job_definitions, jp_scheduler_db):
    job_definition_id = job_definition_2["job_definition_id"]
    with patch("jupyter_scheduler.scheduler.Scheduler.task_runner") as mock_task_runner:
        jp_scheduler.update_job_definition(job_definition_id, UpdateJobDefinition(active=False))

    active = (
        jp_scheduler_db.query(JobDefinition.active)
        .filter(JobDefinition.job_definition_id == job_definition_id)
        .one()
        .active
    )
    assert not active


def test_resume_jobs(jp_scheduler, load_job_definitions, jp_scheduler_db):
    job_definition_id = job_definition_3["job_definition_id"]
    with patch("jupyter_scheduler.scheduler.Scheduler.task_runner") as mock_task_runner:
        jp_scheduler.update_job_definition(job_definition_id, UpdateJobDefinition(active=True))

    active = (
        jp_scheduler_db.query(JobDefinition.active)
        .filter(JobDefinition.job_definition_id == job_definition_id)
        .one()
        .active
    )
    assert active


def test_update_job_definition(jp_scheduler, load_job_definitions, jp_scheduler_db):
    job_definition_id = job_definition_1["job_definition_id"]
    schedule = "*/5 * * * *"
    timezone = "America/New_York"
    with patch("jupyter_scheduler.scheduler.Scheduler.task_runner") as mock_task_runner:
        update = UpdateJobDefinition(
            job_definition_id=job_definition_id, schedule=schedule, timezone=timezone
        )
        jp_scheduler.update_job_definition(job_definition_id, update)

    definition = jp_scheduler_db.get(JobDefinition, job_definition_id)
    assert schedule == definition.schedule
    assert timezone == definition.timezone


def test_delete_job_definition(jp_scheduler, load_job_definitions, jp_scheduler_db):
    job_definition_id = job_definition_1["job_definition_id"]
    jp_scheduler.delete_job_definition(job_definition_id)
    definition = jp_scheduler_db.get(JobDefinition, job_definition_id)
    assert not definition
