"""Tests for TaskRunner async methods.

These tests verify that the task runner correctly handles async operations
for job creation and queue processing.
"""

from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from jupyter_scheduler.models import DescribeJobDefinition
from jupyter_scheduler.task_runner import (
    Cache,
    DescribeJobDefinitionCache,
    JobDefinitionTask,
    PriorityQueue,
    TaskRunner,
    UpdateJobDefinitionCache,
)


class TestPriorityQueue:
    """Tests for the PriorityQueue class."""

    def test_push_and_pop(self):
        """Tasks are popped in priority order (lowest next_run_time first)."""
        queue = PriorityQueue()
        task1 = JobDefinitionTask(job_definition_id="job-1", next_run_time=1000)
        task2 = JobDefinitionTask(job_definition_id="job-2", next_run_time=500)
        task3 = JobDefinitionTask(job_definition_id="job-3", next_run_time=1500)

        queue.push(task1)
        queue.push(task2)
        queue.push(task3)

        assert queue.pop().job_definition_id == "job-2"  # Lowest time
        assert queue.pop().job_definition_id == "job-1"
        assert queue.pop().job_definition_id == "job-3"

    def test_peek_returns_without_removing(self):
        """Peek returns the highest priority task without removing it."""
        queue = PriorityQueue()
        task = JobDefinitionTask(job_definition_id="job-1", next_run_time=1000)
        queue.push(task)

        peeked = queue.peek()
        assert peeked.job_definition_id == "job-1"
        assert len(queue) == 1  # Still in queue

    def test_isempty(self):
        """isempty returns True for empty queue, False otherwise."""
        queue = PriorityQueue()
        assert queue.isempty() is True

        queue.push(JobDefinitionTask(job_definition_id="job-1", next_run_time=1000))
        assert queue.isempty() is False

        queue.pop()
        assert queue.isempty() is True

    def test_len(self):
        """__len__ returns correct queue size."""
        queue = PriorityQueue()
        assert len(queue) == 0

        queue.push(JobDefinitionTask(job_definition_id="job-1", next_run_time=1000))
        assert len(queue) == 1

        queue.push(JobDefinitionTask(job_definition_id="job-2", next_run_time=2000))
        assert len(queue) == 2


class TestCache:
    """Tests for the Cache class."""

    def test_put_and_get(self):
        """Cache stores and retrieves job definition data."""
        cache = Cache()
        model = DescribeJobDefinitionCache(
            job_definition_id="def-1",
            next_run_time=1000,
            active=True,
            timezone="UTC",
            schedule="* * * * *",
        )

        cache.put(model)
        retrieved = cache.get("def-1")

        assert retrieved.job_definition_id == "def-1"
        assert retrieved.next_run_time == 1000
        assert retrieved.active is True
        assert retrieved.schedule == "* * * * *"

    def test_get_nonexistent_returns_none(self):
        """Get returns None for non-existent entries."""
        cache = Cache()
        result = cache.get("nonexistent")
        assert result is None

    def test_update(self):
        """Update modifies existing cache entry."""
        cache = Cache()
        model = DescribeJobDefinitionCache(
            job_definition_id="def-1",
            next_run_time=1000,
            active=True,
            timezone="UTC",
            schedule="* * * * *",
        )
        cache.put(model)

        cache.update("def-1", UpdateJobDefinitionCache(next_run_time=2000, active=False))

        retrieved = cache.get("def-1")
        assert retrieved.next_run_time == 2000
        assert retrieved.active is False
        assert retrieved.schedule == "* * * * *"  # Unchanged

    def test_delete(self):
        """Delete removes entry from cache."""
        cache = Cache()
        model = DescribeJobDefinitionCache(
            job_definition_id="def-1",
            next_run_time=1000,
            active=True,
            timezone="UTC",
            schedule="* * * * *",
        )
        cache.put(model)

        cache.delete("def-1")

        assert cache.get("def-1") is None

    def test_load_multiple(self):
        """Load populates cache with multiple entries."""
        cache = Cache()
        models = [
            DescribeJobDefinitionCache(
                job_definition_id=f"def-{i}",
                next_run_time=1000 * i,
                active=True,
                schedule="* * * * *",
            )
            for i in range(3)
        ]

        cache.load(models)

        for i in range(3):
            retrieved = cache.get(f"def-{i}")
            assert retrieved is not None
            assert retrieved.next_run_time == 1000 * i


class TestTaskRunnerAsync:
    """Tests for TaskRunner async methods."""

    @pytest.fixture
    def mock_scheduler(self):
        """Create a mock scheduler with async methods."""
        scheduler = Mock()
        scheduler.get_job_definition = AsyncMock()
        scheduler.get_staging_paths = AsyncMock()
        scheduler.create_job = AsyncMock()
        scheduler.db_session = MagicMock()
        return scheduler

    @pytest.fixture
    def task_runner(self, mock_scheduler):
        """Create a TaskRunner with mocked scheduler."""
        return TaskRunner(scheduler=mock_scheduler)

    async def test_create_job_calls_scheduler_methods(self, task_runner, mock_scheduler):
        """create_job calls scheduler methods in correct order."""
        job_definition = DescribeJobDefinition(
            job_definition_id="def-1",
            name="Test Definition",
            input_filename="test.ipynb",
            runtime_environment_name="default",
            active=True,
            schedule="* * * * *",
            create_time=1000,
            update_time=1000,
        )
        staging_paths = {"input": "/staging/test.ipynb"}

        mock_scheduler.get_job_definition.return_value = job_definition
        mock_scheduler.get_staging_paths.return_value = staging_paths
        mock_scheduler.create_job.return_value = "job-123"

        await task_runner.create_job("def-1")

        mock_scheduler.get_job_definition.assert_called_once_with("def-1")
        mock_scheduler.get_staging_paths.assert_called_once_with(job_definition)
        mock_scheduler.create_job.assert_called_once()

    async def test_create_job_skips_inactive_definition(self, task_runner, mock_scheduler):
        """create_job doesn't create job for inactive definitions."""
        job_definition = DescribeJobDefinition(
            job_definition_id="def-1",
            name="Test Definition",
            input_filename="test.ipynb",
            runtime_environment_name="default",
            active=False,  # Inactive
            schedule="* * * * *",
            create_time=1000,
            update_time=1000,
        )

        mock_scheduler.get_job_definition.return_value = job_definition

        await task_runner.create_job("def-1")

        mock_scheduler.get_job_definition.assert_called_once_with("def-1")
        mock_scheduler.get_staging_paths.assert_not_called()
        mock_scheduler.create_job.assert_not_called()

    async def test_create_job_handles_none_definition(self, task_runner, mock_scheduler):
        """create_job handles case where definition doesn't exist."""
        mock_scheduler.get_job_definition.return_value = None

        await task_runner.create_job("nonexistent-def")

        mock_scheduler.get_job_definition.assert_called_once_with("nonexistent-def")
        mock_scheduler.get_staging_paths.assert_not_called()
        mock_scheduler.create_job.assert_not_called()

    async def test_process_queue_empty_is_noop(self, task_runner, mock_scheduler):
        """process_queue with empty queue does nothing."""
        await task_runner.process_queue()

        mock_scheduler.get_job_definition.assert_not_called()
        mock_scheduler.create_job.assert_not_called()

    async def test_process_queue_removes_orphaned_tasks(self, task_runner, mock_scheduler):
        """process_queue removes tasks without corresponding cache entry."""
        # Add task without cache entry
        task_runner.queue.push(
            JobDefinitionTask(job_definition_id="orphaned-def", next_run_time=1000)
        )

        await task_runner.process_queue()

        mock_scheduler.create_job.assert_not_called()
        assert task_runner.queue.isempty()

    async def test_process_queue_skips_future_jobs(self, task_runner, mock_scheduler):
        """process_queue doesn't create jobs scheduled for the future."""
        task_runner.cache.put(
            DescribeJobDefinitionCache(
                job_definition_id="def-1",
                next_run_time=99999999999,  # Far future
                active=True,
                timezone="UTC",
                schedule="* * * * *",
            )
        )
        task_runner.queue.push(
            JobDefinitionTask(job_definition_id="def-1", next_run_time=99999999999)
        )

        # Mock compute_time_diff to return negative (job is in future)
        with patch.object(task_runner, "compute_time_diff", return_value=-1000):
            await task_runner.process_queue()

        mock_scheduler.create_job.assert_not_called()
        # Task should still be in queue
        assert not task_runner.queue.isempty()

    async def test_process_queue_skips_inactive_cached_jobs(self, task_runner, mock_scheduler):
        """process_queue skips jobs whose cache entry is inactive."""
        task_runner.cache.put(
            DescribeJobDefinitionCache(
                job_definition_id="def-1",
                next_run_time=1000,
                active=False,  # Inactive in cache
                timezone="UTC",
                schedule="* * * * *",
            )
        )
        task_runner.queue.push(
            JobDefinitionTask(job_definition_id="def-1", next_run_time=1000)
        )

        await task_runner.process_queue()

        mock_scheduler.create_job.assert_not_called()
        # Task should be removed from queue
        assert task_runner.queue.isempty()
