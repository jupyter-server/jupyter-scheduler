import shutil
from pathlib import Path
from typing import Tuple
from unittest.mock import MagicMock, patch

import pytest
import nbformat

from jupyter_scheduler.executors import DefaultExecutionManager, TrackingExecutePreprocessor
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


@pytest.fixture
def mock_cell():
    """Create a mock notebook cell for testing"""
    cell = nbformat.v4.new_code_cell(source="print('test')")
    return cell


@pytest.fixture
def mock_resources():
    """Create mock resources for testing"""
    return {"metadata": {"path": "/test/path"}}


def test_tracking_execute_preprocessor_initialization():
    """Test TrackingExecutePreprocessor initialization"""
    mock_db_session = MagicMock()
    job_id = "test-job-id"
    
    preprocessor = TrackingExecutePreprocessor(
        db_session=mock_db_session,
        job_id=job_id,
        kernel_name="python3"
    )
    
    assert preprocessor.db_session == mock_db_session
    assert preprocessor.job_id == job_id
    assert preprocessor.kernel_name == "python3"


def test_tracking_execute_preprocessor_updates_database(mock_cell, mock_resources):
    """Test that TrackingExecutePreprocessor updates the database after cell execution"""
    mock_db_session = MagicMock()
    mock_session_context = MagicMock()
    mock_db_session.return_value.__enter__.return_value = mock_session_context
    
    job_id = "test-job-id"
    
    with patch.object(TrackingExecutePreprocessor, 'execute_cell') as mock_execute:
        with patch.object(TrackingExecutePreprocessor, '_check_assign_resources'):
            preprocessor = TrackingExecutePreprocessor(
                db_session=mock_db_session,
                job_id=job_id,
                kernel_name="python3"
            )
            
            # Mock the code_cells_executed attribute
            preprocessor.code_cells_executed = 3
            preprocessor.resources = mock_resources
            
            # Mock the execute_cell method to return the cell
            mock_execute.return_value = mock_cell
            
            # Call preprocess_cell
            result_cell, result_resources = preprocessor.preprocess_cell(mock_cell, mock_resources, 0)
            
            # Verify the superclass method was called
            mock_execute.assert_called_once_with(mock_cell, 0, store_history=True)
            
            # Verify database update was called
            mock_session_context.query.assert_called_once_with(Job)
            mock_session_context.query.return_value.filter.return_value.update.assert_called_once_with(
                {"completed_cells": 3}
            )
            mock_session_context.commit.assert_called_once()
            
            # Verify return values
            assert result_cell == mock_cell
            assert result_resources == mock_resources


def test_tracking_execute_preprocessor_handles_database_errors(mock_cell, mock_resources):
    """Test that TrackingExecutePreprocessor handles database errors gracefully"""
    mock_db_session = MagicMock()
    mock_session_context = MagicMock()
    mock_db_session.return_value.__enter__.return_value = mock_session_context
    
    # Make the database update raise an exception
    mock_session_context.query.return_value.filter.return_value.update.side_effect = Exception("DB Error")
    
    job_id = "test-job-id"
    
    with patch.object(TrackingExecutePreprocessor, 'execute_cell') as mock_execute:
        with patch.object(TrackingExecutePreprocessor, '_check_assign_resources'):
            preprocessor = TrackingExecutePreprocessor(
                db_session=mock_db_session,
                job_id=job_id,
                kernel_name="python3"
            )
            
            preprocessor.code_cells_executed = 1
            preprocessor.resources = mock_resources
            mock_execute.return_value = mock_cell
            
            # The database error should propagate
            with pytest.raises(Exception, match="DB Error"):
                preprocessor.preprocess_cell(mock_cell, mock_resources, 0)


def test_tracking_execute_preprocessor_uses_correct_job_id(mock_cell, mock_resources):
    """Test that TrackingExecutePreprocessor uses the correct job_id in database queries"""
    mock_db_session = MagicMock()
    mock_session_context = MagicMock()
    mock_db_session.return_value.__enter__.return_value = mock_session_context
    
    job_id = "specific-job-id-123"
    
    with patch.object(TrackingExecutePreprocessor, 'execute_cell') as mock_execute:
        with patch.object(TrackingExecutePreprocessor, '_check_assign_resources'):
            preprocessor = TrackingExecutePreprocessor(
                db_session=mock_db_session,
                job_id=job_id,
                kernel_name="python3"
            )
            
            preprocessor.code_cells_executed = 2
            preprocessor.resources = mock_resources
            mock_execute.return_value = mock_cell
            
            preprocessor.preprocess_cell(mock_cell, mock_resources, 0)
            
            # Verify the correct job_id is used in the filter
            filter_call = mock_session_context.query.return_value.filter.call_args[0][0]
            assert str(filter_call).find(job_id) != -1 or filter_call.right.value == job_id
