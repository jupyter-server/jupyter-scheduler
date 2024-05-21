import pytest
from sqlalchemy import Column, Integer, String, create_engine, inspect
from sqlalchemy.orm import sessionmaker

from jupyter_scheduler.orm import (
    create_session,
    create_tables,
    declarative_base,
    generate_uuid,
)


@pytest.fixture
def initial_db(jp_scheduler_db_url):
    TestBase = declarative_base()

    class InitialJob(TestBase):
        __tablename__ = "jobs"
        job_id = Column(String(36), primary_key=True, default=generate_uuid)
        runtime_environment_name = Column(String(256), nullable=False)
        input_filename = Column(String(256), nullable=False)

    initial_job = InitialJob(runtime_environment_name="abc", input_filename="abc")

    create_tables(db_url=jp_scheduler_db_url, Base=TestBase)

    Session = create_session(jp_scheduler_db_url)
    session = Session()

    session.add(initial_job)
    session.commit()
    job_id = initial_job.job_id
    session.close()

    yield TestBase, Session, job_id


def updated_job_model(Base):
    class UpdatedJob(Base):
        __tablename__ = "jobs"
        __table_args__ = {"extend_existing": True}
        job_id = Column(String(36), primary_key=True, default=generate_uuid)
        runtime_environment_name = Column(String(256), nullable=False)
        input_filename = Column(String(256), nullable=False)
        new_column = Column("new_column", Integer, default=0)

    return UpdatedJob


def test_create_tables_with_new_column(jp_scheduler_db_url, initial_db):
    Base, Session, initial_job_id = initial_db

    session = Session()
    initial_columns = {col["name"] for col in inspect(session.bind).get_columns("jobs")}
    assert "new_column" not in initial_columns
    session.close()

    JobModel = updated_job_model(Base)
    create_tables(db_url=jp_scheduler_db_url, Base=Base)

    session = Session()
    updated_columns = {col["name"] for col in inspect(session.bind).get_columns("jobs")}
    assert "new_column" in updated_columns

    job1 = session.query(JobModel).filter(JobModel.job_id == initial_job_id).one()
    assert job1 is not None
