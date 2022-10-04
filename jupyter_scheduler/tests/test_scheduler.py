"""Tests for scheduler"""

import pytest

from jupyter_scheduler.models import CreateJobDefinition, ListJobDefinitionsQuery
from jupyter_scheduler.orm import JobDefinition


def test_create_job_definition(jp_scheduler):
    job_definition_id = jp_scheduler.create_job_definition(
        CreateJobDefinition(
            input_uri="helloworld.ipynb",
            output_prefix="helloworld",
            runtime_environment_name="default",
            idempotency_token="abc",
            name="hello world",
        )
    )

    with jp_scheduler.db_session() as session:
        definitions = session.query(JobDefinition).all()
        assert 1 == len(definitions)
        definition = definitions[0]
        assert job_definition_id
        assert job_definition_id == definition.job_definition_id
        assert "helloworld.ipynb" == definition.input_uri
        assert "helloworld" == definition.output_prefix
        assert "default" == definition.runtime_environment_name
        assert "abc" == definition.idempotency_token
        assert "hello world" == definition.name


job_definition_1 = {
    "job_definition_id": "f4f8c8a9-f539-429a-b69e-b567f578646e",
    "name": "hello world",
    "input_uri": "helloworld.ipynb",
    "output_prefix": "helloworld",
    "runtime_environment_name": "environment-a",
    "schedule": "* * * * *",
    "timezone": "America/Los_Angeles",
    "retry_on_timeout": False,
    "timeout_seconds": 0,
    "max_retries": 0,
    "min_retry_interval_millis": 0,
    "update_time": 1,
    "create_time": 1,
    "next_run_time": 2,
    "active": True,
}


@pytest.fixture
def load_job_definitions(jp_scheduler_db):
    with jp_scheduler_db() as session:
        session.add(JobDefinition(**job_definition_1))
        session.commit()


@pytest.mark.parametrize(
    "list_query,expected_response",
    [
        (
            {"job_definition_id": "f4f8c8a9-f539-429a-b69e-b567f578646e"},
            {"job_definitions": [job_definition_1], "total_count": 1, "next_token": None},
        )
    ],
)
def test_list_job_definitions(jp_scheduler, load_job_definitions, list_query, expected_response):
    list_response = jp_scheduler.list_job_definitions(ListJobDefinitionsQuery(**list_query))
    response = list_response.dict(exclude_none=True)
    assert expected_response == response
