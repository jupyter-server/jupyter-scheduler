import json
from contextlib import nullcontext
from unittest.mock import patch

import pytest
from tornado.httpclient import HTTPClientError

from jupyter_scheduler.handlers import compute_sort_model
from jupyter_scheduler.models import (
    CountJobsQuery,
    DescribeJob,
    ListJobsQuery,
    ListJobsResponse,
    SortDirection,
    SortField,
    Status,
)
from jupyter_scheduler.tests.utils import expected_http_error


@pytest.mark.parametrize(
    "job_id,payload",
    [
        (
            "542e0fac-1274-4a78-8340-a850bdb559c8",
            {
                "input_uri": "notebook_a.ipynb",
                "output_prefix": "outputs",
                "idempotency_token": "",
                "runtime_environment_name": "",
            },
        ),
        (
            "4c6cd4e0-49ce-4b58-843d-2fa02f7468b1",
            {
                "input_uri": "notebook_b.ipynb",
                "output_prefix": "scheduled_outputs",
                "idempotency_token": "",
                "runtime_environment_name": "",
                "name": "Scheduled Notebook B",
                "job_definition_id": "7790f93c-4c2c-41b2-9085-daa93915d81c",
                "parameters": {"a": 1, "b": 2, "foo": "bar", "test": True},
            },
        ),
    ],
)
async def test_post_scheduled_jobs(jp_fetch, job_id, payload):
    with patch("jupyter_scheduler.orm.uuid4") as mock_uuid:
        mock_uuid.return_value = job_id
        response = await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert response.code == 200
        body = json.loads(response.body)
        assert body["job_id"] == job_id


async def test_get_jobs_for_single_job(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.get_job") as mock_get_job:
        job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        mock_get_job.return_value = DescribeJob(
            input_uri="input_a",
            output_prefix="output_a",
            runtime_environment_name="environment_a",
            job_id=job_id,
            output_uri="output_a/input_a_12345",
            url="url_a",
            create_time=1664305872620,
            update_time=1664305872620,
        )
        response = await jp_fetch("scheduler", "jobs", job_id, method="GET")

        mock_get_job.assert_called_once_with(job_id)
        assert response.code == 200
        body = json.loads(response.body)
        assert body["job_id"] == job_id
        assert body["input_uri"]
        assert body["output_uri"]


@pytest.mark.parametrize(
    "params,list_query,jobs_list",
    [
        (
            {},
            {"max_items": 1000, "tags": []},
            {
                "jobs": [
                    {
                        "input_uri": "input_a",
                        "output_prefix": "output_a",
                        "runtime_environment_name": "environment_a",
                        "job_id": "542e0fac-1274-4a78-8340-a850bdb559c8",
                        "output_uri": "output_a/input_a_12345",
                        "url": "url_a",
                        "create_time": 1664305872620,
                        "update_time": 1664305872620,
                    }
                ],
                "total_count": 1,
            },
        ),
        (
            {
                "job_definition_id": "4c6cd4e0-49ce-4b58-843d-2fa02f7468b1",
                "status": "IN_PROGRESS",
                "name": "helloworld job",
                "tags": "a",
                "start_time": "0",
                "sort_by": "name",
                "max_items": "10",
                "next_token": "1",
                "create_time": 1664305872620,
                "update_time": 1664305872620,
            },
            {
                "job_definition_id": "4c6cd4e0-49ce-4b58-843d-2fa02f7468b1",
                "status": "IN_PROGRESS",
                "name": "helloworld job",
                "tags": ["a"],
                "start_time": "0",
                "sort_by": [{"name": "name", "direction": "asc"}],
                "max_items": "10",
                "next_token": "1",
                "create_time": 1664305872620,
                "update_time": 1664305872620,
            },
            {
                "jobs": [
                    {
                        "input_uri": "input_a",
                        "output_prefix": "output_a",
                        "runtime_environment_name": "environment_a",
                        "job_id": "542e0fac-1274-4a78-8340-a850bdb559c8",
                        "output_uri": "output_a/input_a_12345",
                        "url": "url_a",
                        "create_time": 1664305872620,
                        "update_time": 1664305872620,
                    }
                ],
                "total_count": 1,
            },
        ),
    ],
)
async def test_get_jobs(jp_fetch, params, list_query, jobs_list):
    expected_query = ListJobsQuery(**list_query)
    expected_jobs = ListJobsResponse(**jobs_list)
    with patch("jupyter_scheduler.scheduler.Scheduler.list_jobs") as mock_list_jobs:
        mock_list_jobs.return_value = expected_jobs
        response = await jp_fetch("scheduler", "jobs", method="GET", params=params)

        mock_list_jobs.assert_called_once_with(expected_query)
        assert response.code == 200
        actual_job = json.loads(response.body)
        actual_job = actual_job["jobs"][0]
        expected_job = jobs_list["jobs"][0]
        assert actual_job["input_uri"] == expected_job["input_uri"]
        assert actual_job["output_prefix"] == expected_job["output_prefix"]
        assert actual_job["runtime_environment_name"] == expected_job["runtime_environment_name"]
        assert actual_job["job_id"] == expected_job["job_id"]
        assert actual_job["output_uri"] == expected_job["output_uri"]
        assert actual_job["url"] == expected_job["url"]


async def test_patch_jobs_for_missing_status(jp_fetch):
    with pytest.raises(HTTPClientError) as e:
        job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        response = await jp_fetch("scheduler", "jobs", job_id, method="PATCH", body="{}")
    assert expected_http_error(e, 500, "Field 'status' missing in request body")


async def test_patch_jobs_for_stop_job(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.stop_job") as mock_stop_job:
        job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        response = await jp_fetch(
            "scheduler", "jobs", job_id, method="PATCH", body=json.dumps({"status": "STOPPED"})
        )

        mock_stop_job.assert_called_once_with(job_id)
        assert response.code == 204


# TODO: Enable after fixing patch api
@pytest.mark.skip
async def test_patch_jobs_for_name_update(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.stop_job") as mock_stop_job:
        job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        response = await jp_fetch(
            "scheduler", "jobs", job_id, method="PATCH", body=json.dumps({"name": "New job name"})
        )

        mock_stop_job.assert_called_once_with(job_id)
        assert response.code == 204


async def test_delete_job(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.delete_job") as mock_delete_job:
        job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        response = await jp_fetch("scheduler", "jobs", job_id, method="DELETE")

        mock_delete_job.assert_called_once_with(job_id)
        assert response.code == 204


async def test_batch_delete(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.delete_job") as mock_delete_job:
        job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        response = await jp_fetch(
            "scheduler", "batch", "jobs", method="DELETE", params={"job_id": job_id}
        )

        mock_delete_job.assert_called_once_with(job_id)
        assert response.code == 204


async def test_jobs_count(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.count_jobs") as mock_count_jobs:
        mock_count_jobs.return_value = 10
        response = await jp_fetch(
            "scheduler", "jobs", "count", method="GET", params={"status": "COMPLETED"}
        )

        mock_count_jobs.assert_called_once_with(CountJobsQuery(status=Status.COMPLETED))
        assert response.code == 200
        body = json.loads(response.body)
        assert {"count": 10} == body


async def test_list_runtime_environments(jp_fetch):
    response = await jp_fetch("scheduler", "runtime_environments", method="GET")

    assert response.code == 200
    environments = json.loads(response.body)
    assert len(environments) == 2
    assert environments[0]["name"] == "env_a"
    assert environments[1]["name"] == "env_b"


async def test_get_config(jp_fetch):
    response = await jp_fetch("scheduler", "config", method="GET")

    assert response.code == 200
    config = json.loads(response.body)
    assert "supported_features" in config
    assert "manage_environments_command" in config
    assert "command_a" == config["manage_environments_command"]


@pytest.mark.parametrize(
    "query_argument,expected_model",
    [
        (["asc(name)"], [SortField(name="name", direction=SortDirection.asc)]),
        (["name"], [SortField(name="name", direction=SortDirection.asc)]),
        (["desc(name)"], [SortField(name="name", direction=SortDirection.desc)]),
        (
            ["asc(name)", "desc(start_time)"],
            [
                SortField(name="name", direction=SortDirection.asc),
                SortField(name="start_time", direction=SortDirection.desc),
            ],
        ),
        (
            ["name", "status"],
            [
                SortField(name="name", direction=SortDirection.asc),
                SortField(name="status", direction=SortDirection.asc),
            ],
        ),
        (["DESC(name)"], [SortField(name="name", direction=SortDirection.desc)]),
    ],
)
def test_compute_sort_model(query_argument, expected_model):
    model = compute_sort_model(query_argument)
    assert model == expected_model
