import json
from unittest.mock import patch

import pytest
from tornado.httpclient import HTTPClientError

from jupyter_scheduler.exceptions import (
    IdempotencyTokenError,
    InputUriError,
    SchedulerError,
)
from jupyter_scheduler.handlers import compute_sort_model
from jupyter_scheduler.job_id import make_job_id
from jupyter_scheduler.models import (
    CountJobsQuery,
    DescribeJob,
    ListJobsQuery,
    ListJobsResponse,
    SortDirection,
    SortField,
    Status,
    UpdateJob,
)


@pytest.mark.parametrize(
    "raw_job_id,payload,expected_backend",
    [
        (
            "542e0fac-1274-4a78-8340-a850bdb559c8",
            {
                "input_uri": "notebook_a.ipynb",
                "output_prefix": "outputs",
                "idempotency_token": "",
                "runtime_environment_name": "",
                "name": "job_a",
            },
            "jupyter_server_nb",  # default backend for .ipynb files
        ),
        (
            "4c6cd4e0-49ce-4b58-843d-2fa02f7468b1",
            {
                "input_uri": "notebook_b.ipynb",
                "output_prefix": "scheduled_outputs",
                "idempotency_token": "",
                "runtime_environment_name": "",
                "job_definition_id": "7790f93c-4c2c-41b2-9085-daa93915d81c",
                "parameters": {"a": 1, "b": 2, "foo": "bar", "test": True},
                "name": "job_a",
            },
            "jupyter_server_nb",  # default backend for .ipynb files
        ),
    ],
)
async def test_post_jobs(jp_fetch, raw_job_id, payload, expected_backend):
    with patch("jupyter_scheduler.scheduler.Scheduler.create_job") as mock_create_job:
        # Scheduler now returns full job_id with backend prefix
        expected_job_id = make_job_id(expected_backend, raw_job_id)
        mock_create_job.return_value = expected_job_id
        response = await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert response.code == 200
        body = json.loads(response.body)
        # Job ID should be in backend:uuid format
        assert body["job_id"] == expected_job_id
        assert body["backend_id"] == expected_backend


async def test_post_jobs_for_invalid_input_uri(jp_fetch):
    payload = {
        "name": "job_a",
        "input_uri": "notebook_a.ipynb",
        "output_prefix": "outputs",
        "runtime_environment_name": "env_a",
        "idempotency_token": "a",
    }
    input_path = payload["input_uri"]
    with patch("jupyter_scheduler.scheduler.Scheduler.create_job") as mock_create_job:
        mock_create_job.side_effect = InputUriError(input_path)
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Input path" in body["message"]
        assert input_path in body["message"]
        assert "does not exist" in body["message"]


async def test_post_jobs_for_idempotency_token_error(jp_fetch):
    payload = {
        "name": "job_a",
        "input_uri": "notebook_a.ipynb",
        "output_prefix": "outputs",
        "runtime_environment_name": "env_a",
        "idempotency_token": "a",
    }
    idempotency_token = payload["idempotency_token"]
    with patch("jupyter_scheduler.scheduler.Scheduler.create_job") as mock_create_job:
        mock_create_job.side_effect = IdempotencyTokenError(idempotency_token)
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert e.value.code == 409
        body = json.loads(e.value.response.body.decode())
        assert (
            f"Job with Idempotency Token '{idempotency_token}' already exists." == body["message"]
        )


async def test_post_jobs_for_unexpected_error(jp_fetch):
    payload = {
        "name": "job_a",
        "input_uri": "notebook_a.ipynb",
        "output_prefix": "outputs",
        "runtime_environment_name": "env_a",
        "idempotency_token": "a",
    }
    with patch("jupyter_scheduler.scheduler.Scheduler.create_job") as mock_create_job:
        mock_create_job.side_effect = Exception("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "creation of job" in body["message"]


async def test_get_jobs_for_single_job(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.get_job") as mock_get_job:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        # Use encoded job_id with backend prefix for the request
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        mock_get_job.return_value = DescribeJob(
            name="job_a",
            input_filename="input_a",
            output_prefix="output_a",
            runtime_environment_name="environment_a",
            job_id=raw_job_id,
            job_files=[
                {
                    "display_name": "Notebook",
                    "file_format": "ipynb",
                    "file_path": "output_a/input_a_12345",
                }
            ],
            url="url_a",
            create_time=1664305872620,
            update_time=1664305872620,
        )
        response = await jp_fetch("scheduler", "jobs", encoded_job_id, method="GET")

        # Handler passes full job_id (with backend prefix) to scheduler
        mock_get_job.assert_called_once_with(encoded_job_id)
        assert response.code == 200
        body = json.loads(response.body)
        assert body["job_id"] == raw_job_id
        assert body["input_filename"]
        assert body["job_files"]


@pytest.mark.parametrize(
    "params,list_query,jobs_list",
    [
        (
            {},
            {"max_items": 1000, "tags": []},
            {
                "jobs": [
                    {
                        "name": "job_a",
                        "input_filename": "input_a",
                        "runtime_environment_name": "environment_a",
                        "job_id": "542e0fac-1274-4a78-8340-a850bdb559c8",
                        "job_files": [
                            {
                                "display_name": "Notebook",
                                "file_format": "ipynb",
                                "file_path": "output_a/input_a_12345",
                            }
                        ],
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
                        "name": "job_a",
                        "input_filename": "input_a",
                        "runtime_environment_name": "environment_a",
                        "job_id": "542e0fac-1274-4a78-8340-a850bdb559c8",
                        "job_files": [
                            {
                                "display_name": "Notebook",
                                "file_format": "ipynb",
                                "file_path": "output_a/input_a_12345",
                            }
                        ],
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
        assert actual_job["input_filename"] == expected_job["input_filename"]
        assert actual_job["runtime_environment_name"] == expected_job["runtime_environment_name"]
        assert actual_job["job_id"] == expected_job["job_id"]
        assert actual_job["job_files"] == expected_job["job_files"]
        assert actual_job["url"] == expected_job["url"]
        assert actual_job["name"] == expected_job["name"]


async def test_get_job_for_scheduler_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.get_job") as mock_get_job:
        mock_get_job.side_effect = SchedulerError("Scheduler error")
        # Use encoded job_id with backend prefix (must use registered backend)
        encoded_job_id = make_job_id("jupyter_server_nb", "542e0fac-1274-4a78-8340-a850bdb559c8")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", encoded_job_id, method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_get_job_for_unexpected_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.get_job") as mock_list_jobs:
        mock_list_jobs.side_effect = ValueError("Unexpected error")
        # Use encoded job_id with backend prefix (must use registered backend)
        encoded_job_id = make_job_id("jupyter_server_nb", "542e0fac-1274-4a78-8340-a850bdb559c8")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", encoded_job_id, method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "getting job" in body["message"]


async def test_get_jobs_for_validation_error(jp_fetch):
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch("scheduler", "jobs", method="GET", params={"max_items": "abc"})

    assert e.value.code == 400
    body = json.loads(e.value.response.body.decode())
    assert "validation error" in body["message"].lower()
    assert "max_items" in body["message"]


async def test_get_jobs_for_scheduler_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.list_jobs") as mock_list_jobs:
        mock_list_jobs.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_get_jobs_for_unexpected_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.list_jobs") as mock_list_jobs:
        mock_list_jobs.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "jobs", method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "getting jobs list" in body["message"]


async def test_patch_jobs_for_status(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.stop_job") as mock_stop_job:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        body = {"status": "STOPPED"}
        response = await jp_fetch(
            "scheduler", "jobs", encoded_job_id, method="PATCH", body=json.dumps(body)
        )
        assert response.code == 204
        # Handler passes full job_id (with backend prefix) to scheduler
        mock_stop_job.assert_called_once_with(encoded_job_id)


async def test_patch_jobs_for_invalid_status(jp_fetch):
    with pytest.raises(HTTPClientError) as e:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        body = {"status": "IN_PROGRESS"}
        await jp_fetch("scheduler", "jobs", encoded_job_id, method="PATCH", body=json.dumps(body))

    assert e.value.code == 500
    body = json.loads(e.value.response.body.decode())
    assert "Invalid value for field 'status'" in body["message"]
    assert "STOPPED" in body["message"]


async def test_patch_jobs(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.update_job") as mock_update_job:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        body = {"name": "hello world", "compute_type": "compute_type_a"}
        response = await jp_fetch(
            "scheduler", "jobs", encoded_job_id, method="PATCH", body=json.dumps(body)
        )
        assert response.code == 204
        # Handler passes full job_id (with backend prefix) to scheduler
        mock_update_job.assert_called_once_with(encoded_job_id, UpdateJob(**body))


async def test_patch_jobs_for_stop_job(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.stop_job") as mock_stop_job:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        response = await jp_fetch(
            "scheduler",
            "jobs",
            encoded_job_id,
            method="PATCH",
            body=json.dumps({"status": "STOPPED"}),
        )

        # Handler passes full job_id (with backend prefix) to scheduler
        mock_stop_job.assert_called_once_with(encoded_job_id)
        assert response.code == 204


async def test_patch_jobs_for_scheduler_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.update_job") as mock_update_job:
        mock_update_job.side_effect = SchedulerError("Scheduler error")
        # Use registered backend to avoid "backend not available" error
        encoded_job_id = make_job_id("jupyter_server_nb", "542e0fac-1274-4a78-8340-a850bdb559c8")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch(
                "scheduler",
                "jobs",
                encoded_job_id,
                method="PATCH",
                body=json.dumps({"name": "job_b"}),
            )

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_patch_jobs_for_unexpected_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.update_job") as mock_update_job:
        mock_update_job.side_effect = ValueError("Unexpected error")
        # Use registered backend to avoid "backend not available" error
        encoded_job_id = make_job_id("jupyter_server_nb", "542e0fac-1274-4a78-8340-a850bdb559c8")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch(
                "scheduler",
                "jobs",
                encoded_job_id,
                method="PATCH",
                body=json.dumps({"name": "job_b"}),
            )

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "updating the job" in body["message"]


async def test_delete_job(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.delete_job") as mock_delete_job:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        response = await jp_fetch("scheduler", "jobs", encoded_job_id, method="DELETE")

        # Handler passes full job_id (with backend prefix) to scheduler
        mock_delete_job.assert_called_once_with(encoded_job_id)
        assert response.code == 204


async def test_delete_job_for_scheduler_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.delete_job") as mock_delete_job:
        mock_delete_job.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
            encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
            await jp_fetch("scheduler", "jobs", encoded_job_id, method="DELETE")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_delete_job_for_unexpected_error(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.delete_job") as mock_delete_job:
        mock_delete_job.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
            encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
            await jp_fetch("scheduler", "jobs", encoded_job_id, method="DELETE")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "deleting the job" in body["message"]


async def test_batch_delete(jp_fetch):
    with patch("jupyter_scheduler.scheduler.Scheduler.delete_job") as mock_delete_job:
        raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
        encoded_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        response = await jp_fetch(
            "scheduler", "batch", "jobs", method="DELETE", params={"job_id": encoded_job_id}
        )

        # Handler passes full job_id (with backend prefix) to scheduler
        mock_delete_job.assert_called_once_with(encoded_job_id)
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


async def test_post_job_from_job_definition_for_validation_error(jp_fetch):
    with pytest.raises(HTTPClientError) as e:
        payload = {"parameters": 1}
        await jp_fetch(
            "scheduler", "job_definitions", "df-1", "jobs", method="POST", body=json.dumps(payload)
        )

    assert e.value.code == 400
    body = json.loads(e.value.response.body.decode())
    assert "validation error" in body["message"].lower()
    assert "parameters" in body["message"]


async def test_post_job_from_job_definition_for_scheduler_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.create_job_from_definition"
    ) as mock_create_job:
        mock_create_job.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch(
                "scheduler", "job_definitions", "df-1", "jobs", method="POST", body=json.dumps({})
            )

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_post_job_from_job_definition_for_unexpected_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.create_job_from_definition"
    ) as mock_create_job:
        mock_create_job.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch(
                "scheduler", "job_definitions", "df-1", "jobs", method="POST", body=json.dumps({})
            )

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "creation of job" in body["message"]


async def test_get_job_definition_for_scheduler_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.get_job_definition"
    ) as mock_get_job_definition:
        mock_get_job_definition.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "job_definitions", "def-1", method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_get_job_definition_for_unexpected_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.get_job_definition"
    ) as mock_get_job_definition:
        mock_get_job_definition.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "job_definitions", "def-1", method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "job definition" in body["message"]


async def test_get_job_definitions_for_validation_error(jp_fetch):
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch("scheduler", "job_definitions", method="GET", params={"max_items": "abc"})

    assert e.value.code == 400
    body = json.loads(e.value.response.body.decode())
    assert "validation error" in body["message"].lower()
    assert "max_items" in body["message"]


async def test_get_job_definitions_for_scheduler_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.list_job_definitions"
    ) as mock_list_job_definitions:
        mock_list_job_definitions.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "job_definitions", method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_get_job_definitions_for_unexpected_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.list_job_definitions"
    ) as mock_list_job_definitions:
        mock_list_job_definitions.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "job_definitions", method="GET")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "job definition" in body["message"]


async def test_post_job_definition_for_unsupported_extension(jp_fetch):
    """Empty payload (no input_uri) returns 400 for unsupported extension."""
    with pytest.raises(HTTPClientError) as e:
        payload = {}
        await jp_fetch("scheduler", "job_definitions", method="POST", body=json.dumps(payload))
    assert e.value.code == 400


async def test_post_job_definition_scheduler_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.create_job_definition"
    ) as mock_create_job_definition:
        mock_create_job_definition.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            payload = {
                "input_uri": "notebook.ipynb",
                "name": "a job",
                "runtime_environment_name": "environment_a",
            }
            await jp_fetch("scheduler", "job_definitions", method="POST", body=json.dumps(payload))

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_post_job_definition_unexpected_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.create_job_definition"
    ) as mock_create_job_definition:
        mock_create_job_definition.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            payload = {
                "input_uri": "notebook.ipynb",
                "name": "a job",
                "runtime_environment_name": "environment_a",
            }
            await jp_fetch("scheduler", "job_definitions", method="POST", body=json.dumps(payload))

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "job definition" in body["message"]


async def test_patch_job_definition_for_validation_error(jp_fetch):
    with pytest.raises(HTTPClientError) as e:
        payload = {"output_formats": 1}
        await jp_fetch(
            "scheduler", "job_definitions", "def-1", method="PATCH", body=json.dumps(payload)
        )

    assert e.value.code == 400
    body = json.loads(e.value.response.body.decode())
    assert "validation error" in body["message"].lower()
    assert "output_formats" in body["message"]


async def test_patch_job_definition_for_scheduler_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.update_job_definition"
    ) as mock_update_job_definition:
        mock_update_job_definition.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            payload = {}
            await jp_fetch(
                "scheduler", "job_definitions", "def-1", method="PATCH", body=json.dumps(payload)
            )

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_patch_job_definition_for_unexpected_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.update_job_definition"
    ) as mock_update_job_definition:
        mock_update_job_definition.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            payload = {}
            await jp_fetch(
                "scheduler", "job_definitions", "def-1", method="PATCH", body=json.dumps(payload)
            )

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "job definition" in body["message"]


async def test_delete_job_definition_for_scheduler_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.delete_job_definition"
    ) as mock_delete_job_definition:
        mock_delete_job_definition.side_effect = SchedulerError("Scheduler error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "job_definitions", "def-1", method="DELETE")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Scheduler error" in body["message"]


async def test_delete_job_definition_for_unexpected_error(jp_fetch):
    with patch(
        "jupyter_scheduler.scheduler.Scheduler.delete_job_definition"
    ) as mock_delete_job_definition:
        mock_delete_job_definition.side_effect = ValueError("Unexpected error")
        with pytest.raises(HTTPClientError) as e:
            await jp_fetch("scheduler", "job_definitions", "def-1", method="DELETE")

        assert e.value.code == 500
        body = json.loads(e.value.response.body.decode())
        assert "Unexpected error" in body["message"]
        assert "job definition" in body["message"]


# Tests for BackendsHandler


async def test_get_backends(jp_fetch):
    response = await jp_fetch("scheduler", "backends", method="GET")

    assert response.code == 200
    backends = json.loads(response.body)
    assert len(backends) >= 1

    # Backends are sorted alphabetically by name - first should be jupyter_server_nb
    first_backend = backends[0]
    assert first_backend["id"] == "jupyter_server_nb"
    assert first_backend["name"] == "Jupyter Server Notebook"


async def test_get_backends_returns_expected_fields(jp_fetch):
    response = await jp_fetch("scheduler", "backends", method="GET")

    assert response.code == 200
    backends = json.loads(response.body)
    assert len(backends) >= 1

    backend = backends[0]
    assert "id" in backend
    assert "name" in backend
    assert "description" in backend
    assert "file_extensions" in backend
    assert "output_formats" in backend
    # Note: is_default was removed - server sorts alphabetically instead


# Tests for JobHandler backend routing


async def test_post_job_with_backend(jp_fetch):
    raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
    payload = {
        "name": "test job",
        "input_uri": "notebook.ipynb",
        "runtime_environment_name": "env_a",
        "backend_id": "jupyter_server_nb",
    }
    with patch("jupyter_scheduler.scheduler.Scheduler.create_job") as mock_create_job:
        # Scheduler now returns full job_id with backend prefix
        expected_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        mock_create_job.return_value = expected_job_id
        response = await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert response.code == 200
        body = json.loads(response.body)
        assert body["job_id"] == expected_job_id
        assert body["backend_id"] == "jupyter_server_nb"


async def test_post_job_without_backend_uses_default(jp_fetch):
    raw_job_id = "542e0fac-1274-4a78-8340-a850bdb559c8"
    payload = {
        "name": "test job",
        "input_uri": "notebook.ipynb",
        "runtime_environment_name": "env_a",
    }
    with patch("jupyter_scheduler.scheduler.Scheduler.create_job") as mock_create_job:
        # Scheduler now returns full job_id with backend prefix
        expected_job_id = make_job_id("jupyter_server_nb", raw_job_id)
        mock_create_job.return_value = expected_job_id
        response = await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

        assert response.code == 200
        body = json.loads(response.body)
        # Auto-selected backend's ID should be encoded in job ID
        # jupyter_server_nb is the default backend for ipynb
        assert body["job_id"] == expected_job_id
        # Should auto-select default backend for .ipynb
        assert body["backend_id"] == "jupyter_server_nb"


async def test_post_job_with_invalid_backend(jp_fetch):
    """POST job with unknown backend returns 404 error."""
    payload = {
        "name": "test job",
        "input_uri": "notebook.ipynb",
        "runtime_environment_name": "env_a",
        "backend_id": "nonexistent_backend",
    }
    with pytest.raises(HTTPClientError) as e:
        await jp_fetch("scheduler", "jobs", method="POST", body=json.dumps(payload))

    assert e.value.code == 404
