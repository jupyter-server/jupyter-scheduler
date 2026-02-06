"""Tests for async scheduler behavior.

These tests verify that the scheduler's async operations work correctly
and can execute concurrently without blocking each other.
"""

import asyncio

import pytest

from jupyter_scheduler.models import CountJobsQuery, ListJobsQuery


async def test_async_session_isolation(jp_scheduler):
    """Verify each async session is independent."""
    # Create two concurrent sessions
    async with jp_scheduler.async_session() as session1:
        async with jp_scheduler.async_session() as session2:
            # Sessions should be independent instances
            assert session1 is not session2


async def test_concurrent_list_jobs(jp_scheduler):
    """Verify list_jobs works correctly with concurrent calls."""
    # Run multiple list operations concurrently
    results = await asyncio.gather(
        jp_scheduler.list_jobs(ListJobsQuery()),
        jp_scheduler.list_jobs(ListJobsQuery()),
        jp_scheduler.list_jobs(ListJobsQuery()),
    )

    # All should complete successfully
    assert len(results) == 3
    # All responses should be ListJobsResponse type
    for result in results:
        assert hasattr(result, "jobs")
        assert hasattr(result, "total_count")


async def test_concurrent_count_jobs(jp_scheduler):
    """Verify count_jobs works correctly with concurrent calls."""
    # Run multiple count operations concurrently
    results = await asyncio.gather(
        jp_scheduler.count_jobs(CountJobsQuery()),
        jp_scheduler.count_jobs(CountJobsQuery()),
        jp_scheduler.count_jobs(CountJobsQuery()),
    )

    # All counts should match (same database state)
    assert results[0] == results[1] == results[2]


async def test_list_and_count_concurrent(jp_scheduler):
    """Verify list_jobs and count_jobs can run concurrently."""
    results = await asyncio.gather(
        jp_scheduler.list_jobs(ListJobsQuery()),
        jp_scheduler.count_jobs(CountJobsQuery()),
    )

    list_response, count = results
    # Count should match the number of jobs in list (for empty/same query)
    assert list_response.total_count == count
