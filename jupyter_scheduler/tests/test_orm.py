from typing import Type

import pytest
from sqlalchemy import Column, Integer, String, inspect
from sqlalchemy.orm import DeclarativeMeta, sessionmaker

from jupyter_scheduler.orm import (
    create_session,
    create_tables,
    declarative_base,
    generate_uuid,
)


@pytest.fixture
def initial_db(jp_scheduler_db_url) -> tuple[Type[DeclarativeMeta], sessionmaker, str]:
    TestBase = declarative_base()

    class MockInitialJob(TestBase):
        __tablename__ = "jobs"
        job_id = Column(String(36), primary_key=True, default=generate_uuid)
        runtime_environment_name = Column(String(256), nullable=False)
        input_filename = Column(String(256), nullable=False)

    initial_job = MockInitialJob(runtime_environment_name="abc", input_filename="input.ipynb")

    create_tables(db_url=jp_scheduler_db_url, Base=TestBase)

    Session = create_session(jp_scheduler_db_url)
    session = Session()

    session.add(initial_job)
    session.commit()
    job_id = initial_job.job_id
    session.close()

    return (TestBase, Session, job_id)


@pytest.fixture
def updated_job_model(initial_db) -> Type[DeclarativeMeta]:
    TestBase = initial_db[0]

    class MockUpdatedJob(TestBase):
        __tablename__ = "jobs"
        __table_args__ = {"extend_existing": True}
        job_id = Column(String(36), primary_key=True, default=generate_uuid)
        runtime_environment_name = Column(String(256), nullable=False)
        input_filename = Column(String(256), nullable=False)
        new_column = Column("new_column", Integer)

    return MockUpdatedJob


def test_create_tables_with_new_column(jp_scheduler_db_url, initial_db, updated_job_model):
    TestBase, Session, initial_job_id = initial_db

    session = Session()
    initial_columns = {col["name"] for col in inspect(session.bind).get_columns("jobs")}
    assert "new_column" not in initial_columns
    session.close()

    JobModel = updated_job_model
    create_tables(db_url=jp_scheduler_db_url, Base=TestBase)

    session = Session()
    updated_columns = {col["name"] for col in inspect(session.bind).get_columns("jobs")}
    assert "new_column" in updated_columns

    updated_job = session.query(JobModel).filter(JobModel.job_id == initial_job_id).one()
    assert hasattr(updated_job, "new_column")
    assert updated_job.runtime_environment_name == "abc"
    assert updated_job.input_filename == "input.ipynb"


def test_completed_cells_column_migration(jp_scheduler_db_url):
    """Test that the completed_cells column is properly added during migration"""
    from jupyter_scheduler.orm import Base, Job, create_tables
    from sqlalchemy import create_engine, inspect
    from sqlalchemy.orm import sessionmaker
    
    # Create initial database without completed_cells
    engine = create_engine(jp_scheduler_db_url)
    
    # Create tables with the current schema (which includes completed_cells)
    create_tables(db_url=jp_scheduler_db_url, Base=Base)
    
    # Verify the completed_cells column exists
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("jobs")}
    assert "completed_cells" in columns
    
    # Verify the column is of correct type (Integer)
    completed_cells_column = next(col for col in inspector.get_columns("jobs") if col["name"] == "completed_cells")
    assert str(completed_cells_column["type"]).upper() in ["INTEGER", "INT"]
    
    # Test that we can insert and retrieve completed_cells values
    Session = sessionmaker(bind=engine)
    session = Session()
    
    job = Job(
        runtime_environment_name="test_env",
        input_filename="test.ipynb",
        completed_cells=5
    )
    session.add(job)
    session.commit()
    
    # Retrieve and verify
    retrieved_job = session.query(Job).filter(Job.job_id == job.job_id).one()
    assert retrieved_job.completed_cells == 5
    
    # Test null values are handled properly
    job_null = Job(
        runtime_environment_name="test_env_null",
        input_filename="test_null.ipynb",
        completed_cells=None
    )
    session.add(job_null)
    session.commit()
    
    retrieved_job_null = session.query(Job).filter(Job.job_id == job_null.job_id).one()
    assert retrieved_job_null.completed_cells is None
    
    session.close()


def test_completed_cells_column_nullable(jp_scheduler_db_url):
    """Test that completed_cells column is nullable for backward compatibility"""
    from jupyter_scheduler.orm import Base, Job, create_tables
    from sqlalchemy import create_engine, inspect
    from sqlalchemy.orm import sessionmaker
    
    create_tables(db_url=jp_scheduler_db_url, Base=Base)
    
    engine = create_engine(jp_scheduler_db_url)
    inspector = inspect(engine)
    
    # Find the completed_cells column
    completed_cells_column = next(
        col for col in inspector.get_columns("jobs") 
        if col["name"] == "completed_cells"
    )
    
    # Verify it's nullable
    assert completed_cells_column["nullable"] is True
    
    # Test creating a job without completed_cells
    Session = sessionmaker(bind=engine)
    session = Session()
    
    job = Job(
        runtime_environment_name="test_env",
        input_filename="test.ipynb"
        # Note: not setting completed_cells
    )
    session.add(job)
    session.commit()
    
    # Verify it defaults to None
    retrieved_job = session.query(Job).filter(Job.job_id == job.job_id).one()
    assert retrieved_job.completed_cells is None
    
    session.close()
