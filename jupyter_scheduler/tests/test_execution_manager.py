import shutil
from pathlib import Path
from typing import Tuple
from unittest.mock import MagicMock, patch

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


def test_default_execution_manager_cell_tracking_hook_not_set_by_default():
    """Test that DefaultExecutionManager does NOT set up on_cell_executed hook when track_cell_execution is disabled by default"""
    job_id = "test-job-id"

    with patch.object(DefaultExecutionManager, "model") as mock_model:
        with patch("jupyter_scheduler.executors.open", mock=MagicMock()):
            with patch("jupyter_scheduler.executors.nbformat.read") as mock_nb_read:
                with patch.object(DefaultExecutionManager, "add_side_effects_files"):
                    with patch.object(DefaultExecutionManager, "create_output_files"):
                        # Mock notebook
                        mock_nb = MagicMock()
                        mock_nb.metadata.kernelspec = {"name": "python3"}
                        mock_nb_read.return_value = mock_nb

                        # Mock model
                        mock_model.parameters = None
                        mock_model.output_formats = []

                        # Create manager
                        manager = DefaultExecutionManager(
                            job_id=job_id,
                            root_dir="/test",
                            db_url="sqlite:///:memory:",
                            staging_paths={"input": "/test/input.ipynb"},
                        )

                        # Patch ExecutePreprocessor
                        with patch(
                            "jupyter_scheduler.executors.ExecutePreprocessor"
                        ) as mock_ep_class:
                            mock_ep = MagicMock()
                            mock_ep_class.return_value = mock_ep

                            # Execute
                            manager.execute()

                            # Verify ExecutePreprocessor was created
                            mock_ep_class.assert_called_once()

                            # Verify patching method was never called
                            mock_model.__update_completed_cells_hook.assert_not_called()


def test_update_completed_cells_hook():
    """Test the __update_completed_cells_hook method"""
    job_id = "test-job-id"

    # Create manager
    manager = DefaultExecutionManager(
        job_id=job_id,
        root_dir="/test",
        db_url="sqlite:///:memory:",
        staging_paths={"input": "/test/input.ipynb"},
    )

    # Mock db_session
    mock_db_session = MagicMock()
    mock_session_context = MagicMock()
    mock_db_session.return_value.__enter__.return_value = mock_session_context
    manager._db_session = mock_db_session

    # Mock ExecutePreprocessor
    mock_ep = MagicMock()
    mock_ep.code_cells_executed = 5

    # Get the hook function
    hook_func = manager._DefaultExecutionManager__update_completed_cells_hook(mock_ep)

    # Call the hook
    mock_cell = MagicMock()
    mock_execute_reply = MagicMock()
    hook_func(mock_cell, 2, mock_execute_reply)

    # Verify database update was called
    mock_session_context.query.assert_called_once_with(Job)
    mock_session_context.query.return_value.filter.return_value.update.assert_called_once_with(
        {"completed_cells": 5}
    )
    mock_session_context.commit.assert_called_once()


def test_update_completed_cells_hook_database_error():
    """Test that database errors in the hook are handled"""
    job_id = "test-job-id"

    # Create manager
    manager = DefaultExecutionManager(
        job_id=job_id,
        root_dir="/test",
        db_url="sqlite:///:memory:",
        staging_paths={"input": "/test/input.ipynb"},
    )

    # Mock db_session with error
    mock_db_session = MagicMock()
    mock_session_context = MagicMock()
    mock_session_context.query.return_value.filter.return_value.update.side_effect = Exception(
        "DB Error"
    )
    mock_db_session.return_value.__enter__.return_value = mock_session_context
    manager._db_session = mock_db_session

    # Mock ExecutePreprocessor
    mock_ep = MagicMock()
    mock_ep.code_cells_executed = 3

    # Get the hook function
    hook_func = manager._DefaultExecutionManager__update_completed_cells_hook(mock_ep)

    # Call the hook - should raise exception
    mock_cell = MagicMock()
    mock_execute_reply = MagicMock()

    with pytest.raises(Exception, match="DB Error"):
        hook_func(mock_cell, 1, mock_execute_reply)


def test_supported_features_includes_track_cell_execution():
    """Test that DefaultExecutionManager supports track_cell_execution feature"""
    manager = DefaultExecutionManager(
        job_id="test-job-id",
        root_dir="/test",
        db_url="sqlite:///:memory:",
        staging_paths={"input": "/test/input.ipynb"},
    )
    features = manager.supported_features()

    from jupyter_scheduler.models import JobFeature

    assert JobFeature.track_cell_execution in features
    assert features[JobFeature.track_cell_execution] is False


def test_hook_uses_correct_job_id():
    """Test that the hook uses the correct job_id in database queries"""
    job_id = "specific-job-id-456"

    # Create manager
    manager = DefaultExecutionManager(
        job_id=job_id,
        root_dir="/test",
        db_url="sqlite:///:memory:",
        staging_paths={"input": "/test/input.ipynb"},
    )

    # Mock db_session
    mock_db_session = MagicMock()
    mock_session_context = MagicMock()
    mock_db_session.return_value.__enter__.return_value = mock_session_context
    manager._db_session = mock_db_session

    # Mock ExecutePreprocessor
    mock_ep = MagicMock()
    mock_ep.code_cells_executed = 7

    # Get the hook function
    hook_func = manager._DefaultExecutionManager__update_completed_cells_hook(mock_ep)

    # Call the hook
    mock_cell = MagicMock()
    mock_execute_reply = MagicMock()
    hook_func(mock_cell, 3, mock_execute_reply)

    # Verify the correct job_id is used in the filter
    # The filter call should contain a condition that matches Job.job_id == job_id
    filter_call = mock_session_context.query.return_value.filter.call_args[0][0]
    # This is a SQLAlchemy comparison object, so we need to check its properties
    assert hasattr(filter_call, "right")
    assert filter_call.right.value == job_id


def test_cell_tracking_disabled_when_feature_false():
    """Test that cell tracking hook is not set when track_cell_execution feature is False"""
    job_id = "test-job-id"

    # Create a custom execution manager class with track_cell_execution = False
    class DisabledTrackingExecutionManager(DefaultExecutionManager):
        def supported_features(self):
            features = super().supported_features()
            from jupyter_scheduler.models import JobFeature

            features[JobFeature.track_cell_execution] = False
            return features

    # Create manager with disabled tracking
    manager = DisabledTrackingExecutionManager(
        job_id=job_id,
        root_dir="/test",
        db_url="sqlite:///:memory:",
        staging_paths={"input": "/test/input.ipynb"},
    )

    # Mock ExecutePreprocessor and track calls to __update_completed_cells_hook
    with patch.object(
        manager, "_DefaultExecutionManager__update_completed_cells_hook"
    ) as mock_hook_method:
        with patch.object(DisabledTrackingExecutionManager, "model") as mock_model:
            with patch("jupyter_scheduler.executors.open", mock=MagicMock()):
                with patch("jupyter_scheduler.executors.nbformat.read") as mock_nb_read:
                    with patch.object(DisabledTrackingExecutionManager, "add_side_effects_files"):
                        with patch.object(DisabledTrackingExecutionManager, "create_output_files"):
                            with patch(
                                "jupyter_scheduler.executors.ExecutePreprocessor"
                            ) as mock_ep_class:
                                # Mock notebook
                                mock_nb = MagicMock()
                                mock_nb.metadata.kernelspec = {"name": "python3"}
                                mock_nb_read.return_value = mock_nb

                                # Mock model
                                mock_model.parameters = None
                                mock_model.output_formats = []

                                mock_ep = MagicMock()
                                mock_ep_class.return_value = mock_ep

                                # Execute
                                manager.execute()

                                # Verify ExecutePreprocessor was created
                                mock_ep_class.assert_called_once()

                                # Verify the hook method was NOT called when feature is disabled
                                mock_hook_method.assert_not_called()


def test_disabled_tracking_feature_support():
    """Test that custom execution manager can disable track_cell_execution feature"""

    # Create a custom execution manager class with track_cell_execution = False
    class DisabledTrackingExecutionManager(DefaultExecutionManager):
        def supported_features(self):
            features = super().supported_features()
            from jupyter_scheduler.models import JobFeature

            features[JobFeature.track_cell_execution] = False
            return features

    manager = DisabledTrackingExecutionManager(
        job_id="test-job-id",
        root_dir="/test",
        db_url="sqlite:///:memory:",
        staging_paths={"input": "/test/input.ipynb"},
    )
    features = manager.supported_features()

    from jupyter_scheduler.models import JobFeature

    assert JobFeature.track_cell_execution in features
    assert features[JobFeature.track_cell_execution] is False
