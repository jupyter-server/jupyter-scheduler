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
