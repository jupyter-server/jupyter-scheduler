import json
import os
import random
import subprocess
import zoneinfo
from uuid import uuid4

import click

from jupyter_scheduler.orm import Job, JobDefinition, create_session, create_tables
from jupyter_scheduler.utils import get_utc_timestamp


def get_db_path():
    paths = subprocess.check_output(["jupyter", "--paths", "--json"])
    data = json.loads(paths).get("data", [])
    if len(data) < 1:
        raise Exception("No Jupyter data folder found.")
    return os.path.join(data[0], "scheduler.sqlite")


def create_random_job_def(index: int):
    name = random.choice(
        [
            "definition alpha",
            "definition beta",
            "super schedule",
            "cool definition",
            "lame definition",
        ]
    )
    job_definition_id = str(uuid4())
    input_uri = "".join(name.split()) + ".ipynb"
    output_prefix = ""
    timezone = random.choice(list(zoneinfo.available_timezones()))
    # random schedules can be generated via https://crontab.guru/
    schedule = random.choice(
        ["0 0,12 1 */2 *", "0 4 8-14 * *", "0 0 1,15 * 3", "5 0 * 8 *", "15 14 1 * *"]
    )
    active = random.choice([True, False])

    return JobDefinition(
        name=f"{name} {index}",
        job_definition_id=job_definition_id,
        input_uri=input_uri,
        output_prefix=output_prefix,
        timezone=timezone,
        schedule=schedule,
        active=active,
        runtime_environment_name="",
    )


def create_random_job(index: int, job_def_id: str):
    status = random.choice(["CREATED", "QUEUED", "COMPLETED", "FAILED", "IN_PROGRESS", "STOPPED"])
    name = random.choice(
        [
            "hello world",
            "lorem ipsum",
            "job a",
            "job b",
            "long running job",
            "fast job",
            "random job",
        ]
    )
    input_uri = "".join(name.split()) + ".ipynb"
    output_prefix = ""
    start_time = None
    status_message = None
    end_time = None

    if status not in ["CREATED", "QUEUED"]:
        start_time = get_utc_timestamp()

    if status == "FAILED":
        status_message = "Failed job because of an exception..."

    if status == "COMPLETED":
        end_time = get_utc_timestamp()

    return Job(
        name=f"{name} {index}",
        job_definition_id=job_def_id,
        input_uri=input_uri,
        output_prefix=output_prefix,
        status=status,
        start_time=start_time,
        end_time=end_time,
        status_message=status_message,
        runtime_environment_name="",
    )


def load_data(jobs_count: int, job_defs_count: int, db_path: str):
    db_url = f"sqlite:///{db_path}"

    if os.path.exists(db_path):
        os.remove(db_path)

    create_tables(db_url, drop_tables=True)
    db_session = create_session(db_url)

    with db_session() as session:
        job_def_ids = []

        for index in range(1, job_defs_count + 1):
            job_def = create_random_job_def(index)
            session.add(job_def)
            job_def_ids.append(job_def.job_definition_id)

        for index in range(1, jobs_count + 1):
            session.add(create_random_job(index, random.choice(job_def_ids)))

        session.commit()

    click.echo(
        f"\nCreated {jobs_count} jobs and {job_defs_count} job definitions in the scheduler database"
    )
    click.echo(f"present at {db_path}. Copy the following command")
    click.echo(f"to start JupyterLab with this database.\n")
    click.echo(f"`jupyter lab --SchedulerApp.db_url={db_url}`\n")


@click.command(
    help="Inserts random jobs in the scheduler database. Note, that this command will drop the tables and re-create."
)

# set to unique numbers by default to help test pagination with partially empty pages.
@click.option("--jobs-count", "--j", default=57, help="No of jobs to create, default is 57.")
@click.option(
    "--job-defs-count", "--jd", default=27, help="No of job definitions to create, default is 27."
)
@click.option(
    "--db_path",
    "--db",
    type=click.Path(),
    default=get_db_path(),
    help="DB file path, default is scheduler db path",
)
def main(jobs_count, job_defs_count, db_path) -> None:
    load_data(jobs_count, job_defs_count, db_path)


if __name__ == "__main__":
    main()
