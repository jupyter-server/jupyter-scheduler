"""Tests for scheduler"""

import os
from unittest.mock import patch

import pytest

from jupyter_scheduler.models import (
    CreateJobDefinition,
    ListJobDefinitionsQuery,
    SortDirection,
    SortField,
    UpdateJobDefinition,
)
from jupyter_scheduler.orm import JobDefinition


def test_create_job_definition(jp_scheduler, jp_root_dir, fs_helpers):
    with patch("jupyter_scheduler.scheduler.Scheduler.file_exists") as mock_file_exists:
        mock_file_exists.return_value = True
        input_uri = "helloworld.ipynb"
        fs_helpers.touch(os.path.join(jp_root_dir, input_uri))
        input_file_id = jp_scheduler.file_id_manager.index(input_uri)

        job_definition_id = jp_scheduler.create_job_definition(
            CreateJobDefinition(
                input_uri=input_uri,
                output_prefix="helloworld",
                runtime_environment_name="default",
                name="hello world",
            )
        )

    with jp_scheduler.db_session() as session:
        definitions = session.query(JobDefinition).all()
        assert 1 == len(definitions)
        definition = definitions[0]
        assert job_definition_id
        assert job_definition_id == definition.job_definition_id
        assert input_file_id == definition.input_file_id
        assert "helloworld" == definition.output_prefix
        assert "default" == definition.runtime_environment_name
        assert "hello world" == definition.name


@pytest.fixture
def job_definition_1(jp_scheduler, fs_helpers):
    input_uri = "helloworld_1.ipynb"
    fs_helpers.touch(os.path.join(jp_scheduler.root_dir, input_uri))

    return {
        "job_definition_id": "f4f8c8a9-f539-429a-b69e-b567f578646e",
        "name": "hello world 1",
        "input_uri": input_uri,
        "output_prefix": "helloworld_1",
        "runtime_environment_name": "environment-a",
        "schedule": "* * * * *",
        "timezone": "America/Los_Angeles",
        "update_time": 1,
        "create_time": 1,
        "active": True,
    }


@pytest.fixture
def job_definition_2(jp_scheduler, fs_helpers):
    input_uri = "helloworld_2.ipynb"
    fs_helpers.touch(os.path.join(jp_scheduler.root_dir, input_uri))

    return {
        "job_definition_id": "dfc63587-e635-44c8-a86b-7f9f196059dc",
        "name": "hello world 2",
        "input_uri": input_uri,
        "output_prefix": "helloworld_2",
        "runtime_environment_name": "environment-a",
        "schedule": "* * * * *",
        "timezone": "America/Los_Angeles",
        "update_time": 2,
        "create_time": 2,
        "active": True,
        "tags": ["tag_2"],
    }


@pytest.fixture
def job_definition_3(jp_scheduler, fs_helpers):
    input_uri = "helloworld_3.ipynb"
    fs_helpers.touch(os.path.join(jp_scheduler.root_dir, input_uri))

    return {
        "job_definition_id": "a4050609-c2ec-4737-959c-4b046ca6a889",
        "name": "hello world 3",
        "input_uri": input_uri,
        "output_prefix": "helloworld_3",
        "runtime_environment_name": "environment-a",
        "schedule": "* * * * *",
        "timezone": "America/Los_Angeles",
        "update_time": 3,
        "create_time": 3,
        "active": False,
        "tags": ["tag_3"],
    }


@pytest.fixture
def load_job_definitions(
    jp_scheduler, jp_scheduler_db, job_definition_1, job_definition_2, job_definition_3
):
    with jp_scheduler_db() as session:
        for describe_model in [job_definition_1, job_definition_2, job_definition_3]:
            kwargs = {k: describe_model[k] for k in describe_model if k != "input_uri"}
            kwargs["input_file_id"] = jp_scheduler.file_id_manager.index(
                describe_model["input_uri"]
            )
            session.add(JobDefinition(**kwargs))
        session.commit()


@pytest.mark.parametrize(
    "list_query,expected_response",
    [
        (
            {
                "create_time": 2,
            },
            {"job_definitions": ["job_definition_3", "job_definition_2"], "total_count": 2},
        ),
        ({"name": "hello world 2"}, {"job_definitions": ["job_definition_2"], "total_count": 1}),
        ({"tags": ["tag_3"]}, {"job_definitions": ["job_definition_3"], "total_count": 1}),
        (
            {"sort_by": [SortField(name="create_time", direction=SortDirection.asc)]},
            {
                "job_definitions": ["job_definition_1", "job_definition_2", "job_definition_3"],
                "total_count": 3,
            },
        ),
        (
            {"max_items": 2},
            {
                "job_definitions": ["job_definition_3", "job_definition_2"],
                "total_count": 3,
                "next_token": "2",
            },
        ),
        (
            {"max_items": 2, "next_token": 2},
            {"job_definitions": ["job_definition_1"], "total_count": 3},
        ),
    ],
)
def test_list_job_definitions(
    jp_scheduler, load_job_definitions, list_query, expected_response, request
):
    expected_job_defs = expected_response["job_definitions"]
    for i in range(len(expected_job_defs)):
        # map the strings to their corresponding fixture values
        expected_job_defs[i] = request.getfixturevalue(expected_job_defs[i])
        print(expected_job_defs[i])

    list_response = jp_scheduler.list_job_definitions(ListJobDefinitionsQuery(**list_query))
    response = list_response.dict(exclude_none=True)
    assert expected_response == response


def test_get_job_definition(jp_scheduler, load_job_definitions, job_definition_1):
    definition = jp_scheduler.get_job_definition(job_definition_1["job_definition_id"])
    assert job_definition_1 == definition.dict(exclude_none=True)


def test_pause_jobs(jp_scheduler, load_job_definitions, jp_scheduler_db, job_definition_2):
    job_definition_id = job_definition_2["job_definition_id"]
    with patch("jupyter_scheduler.scheduler.Scheduler.task_runner") as mock_task_runner:
        jp_scheduler.update_job_definition(job_definition_id, UpdateJobDefinition(active=False))

    with jp_scheduler_db() as session:
        active = (
            session.query(JobDefinition.active)
            .filter(JobDefinition.job_definition_id == job_definition_id)
            .one()
            .active
        )
        assert not active


def test_resume_jobs(jp_scheduler, load_job_definitions, jp_scheduler_db, job_definition_3):
    job_definition_id = job_definition_3["job_definition_id"]
    with patch("jupyter_scheduler.scheduler.Scheduler.task_runner") as mock_task_runner:
        jp_scheduler.update_job_definition(job_definition_id, UpdateJobDefinition(active=True))

    with jp_scheduler_db() as session:
        active = (
            session.query(JobDefinition.active)
            .filter(JobDefinition.job_definition_id == job_definition_id)
            .one()
            .active
        )
        assert active


def test_update_job_definition(
    jp_scheduler, load_job_definitions, jp_scheduler_db, job_definition_1, fs_helpers
):
    job_definition_id = job_definition_1["job_definition_id"]
    new_input_uri = "new.ipynb"
    fs_helpers.touch(new_input_uri)
    new_input_file_id = jp_scheduler.file_id_manager.index(new_input_uri)
    schedule = "*/5 * * * *"
    timezone = "America/New_York"

    with patch("jupyter_scheduler.scheduler.Scheduler.task_runner") as mock_task_runner:
        update = UpdateJobDefinition(
            job_definition_id=job_definition_id,
            schedule=schedule,
            timezone=timezone,
            input_uri=new_input_uri,
        )
        jp_scheduler.update_job_definition(job_definition_id, update)

    with jp_scheduler_db() as session:
        definition = session.get(JobDefinition, job_definition_id)
        assert schedule == definition.schedule
        assert timezone == definition.timezone
        assert new_input_file_id == definition.input_file_id


def test_delete_job_definition(
    jp_scheduler, load_job_definitions, jp_scheduler_db, job_definition_1
):
    job_definition_id = job_definition_1["job_definition_id"]
    jp_scheduler.delete_job_definition(job_definition_id)
    with jp_scheduler_db() as session:
        definition = session.get(JobDefinition, job_definition_id)
        assert not definition
