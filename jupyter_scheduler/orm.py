import json
import os
from sqlite3 import OperationalError
from uuid import uuid4

import sqlalchemy.types as types
from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, declarative_mixin, registry, sessionmaker

from jupyter_scheduler.models import EmailNotifications, Status
from jupyter_scheduler.utils import get_utc_timestamp

Base = declarative_base()


def generate_uuid():
    return str(uuid4())


def generate_jobs_url(context) -> str:
    job_id = context.get_current_parameters()["job_id"]
    return f"/jobs/{job_id}"


def generate_job_definitions_url(context) -> str:
    job_definition_id = context.get_current_parameters()["job_definition_id"]
    return f"/job_definitions/{job_definition_id}"


class JsonType(types.TypeDecorator):
    impl = String

    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None

        return json.loads(value)


class EmailNotificationType(types.TypeDecorator):
    impl = String

    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None

        if isinstance(value, EmailNotifications):
            return json.dumps(value.dict(exclude_none=True))
        else:
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return EmailNotifications.construct(json.loads(value))


mapper_registry = registry()


@declarative_mixin
class CommonColumns:
    runtime_environment_name = Column(String(256), nullable=False)
    runtime_environment_parameters = Column(JsonType(1024))
    compute_type = Column(String(256), nullable=True)
    input_filename = Column(String(256), nullable=False)
    output_formats = Column(JsonType(512))
    name = Column(String(256))
    tags = Column(JsonType(1024))
    parameters = Column(JsonType(1024))
    email_notifications = Column(EmailNotificationType(1024))
    timeout_seconds = Column(Integer, default=600)
    retry_on_timeout = Column(Boolean, default=False)
    max_retries = Column(Integer, default=0)
    min_retry_interval_millis = Column(Integer, default=0)
    output_filename_template = Column(String(256))
    update_time = Column(Integer, default=get_utc_timestamp, onupdate=get_utc_timestamp)
    create_time = Column(Integer, default=get_utc_timestamp)


class Job(CommonColumns, Base):
    __tablename__ = "jobs"
    job_id = Column(String(36), primary_key=True, default=generate_uuid)
    job_definition_id = Column(String(36))
    status = Column(String(64), default=Status.STOPPED)
    status_message = Column(String(1024))
    start_time = Column(Integer)
    end_time = Column(Integer)
    url = Column(String(256), default=generate_jobs_url)
    pid = Column(Integer)
    idempotency_token = Column(String(256))


class JobDefinition(CommonColumns, Base):
    __tablename__ = "job_definitions"
    job_definition_id = Column(String(36), primary_key=True, default=generate_uuid)
    schedule = Column(String(256))
    timezone = Column(String(36))
    url = Column(String(256), default=generate_job_definitions_url)
    create_time = Column(Integer, default=get_utc_timestamp)
    active = Column(Boolean, default=True)


def create_tables(db_url, drop_tables=False):
    engine = create_engine(db_url)
    try:
        if drop_tables:
            Base.metadata.drop_all(engine)
    except OperationalError:
        pass
    finally:
        Base.metadata.create_all(engine)


def create_session(db_url):
    engine = create_engine(db_url, echo=False)
    Session = sessionmaker(bind=engine)

    return Session
