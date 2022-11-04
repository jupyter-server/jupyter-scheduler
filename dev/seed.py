import asyncio
import json
import os
import random
import shutil
import subprocess
from pathlib import Path

import click
import pytz

from jupyter_scheduler.environments import CondaEnvironmentManager
from jupyter_scheduler.models import CreateJob, CreateJobDefinition
from jupyter_scheduler.orm import create_tables
from jupyter_scheduler.scheduler import Scheduler
from jupyter_scheduler.utils import get_utc_timestamp

root_dir = str(Path(__file__).parent.absolute())
# must be specified relative to root_dir
TEMPLATE_PATHS = [
    os.path.join("templates", "1.ipynb"),
    os.path.join("templates", "2.ipynb"),
    os.path.join("templates", "3.ipynb"),
]


def pick_random_template():
    return str(random.choice(TEMPLATE_PATHS))


def get_db_path():
    paths = subprocess.check_output(["jupyter", "--paths", "--json"])
    data = json.loads(paths).get("data", [])
    if len(data) < 1:
        raise Exception("No Jupyter data folder found.")
    return os.path.join(data[0], "scheduler.sqlite")


def create_random_job_def(index: int, env: str) -> CreateJobDefinition:
    name = (
        random.choice(
            [
                "definition alpha",
                "definition beta",
                "super schedule",
                "cool definition",
                "lame definition",
            ]
        )
        + " "
        + str(index)
    )

    input_uri = pick_random_template()
    timezone = random.choice(pytz.all_timezones)
    # random schedules can be generated via https://crontab.guru/
    schedule = random.choice(
        ["0 0,12 1 */2 *", "0 4 8-14 * *", "0 0 1,15 * 3", "5 0 * 8 *", "15 14 1 * *"]
    )
    active = random.choice([True, False])

    return CreateJobDefinition(
        name=name,
        input_uri=input_uri,
        output_formats=["ipynb"],
        timezone=timezone,
        schedule=schedule,
        active=active,
        runtime_environment_name=env,
    )


def create_random_job(index: int, job_def_id: str) -> CreateJob:
    status = random.choice(["CREATED", "QUEUED", "COMPLETED", "FAILED", "IN_PROGRESS", "STOPPED"])
    name = (
        random.choice(
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
        + " "
        + str(index)
    )
    input_uri = pick_random_template()
    start_time = None
    status_message = None
    end_time = None

    if status not in ["CREATED", "QUEUED"]:
        start_time = get_utc_timestamp()

    if status == "FAILED":
        status_message = "Failed job because of an exception..."

    if status == "COMPLETED":
        end_time = get_utc_timestamp()

    return CreateJob(
        name=name,
        job_definition_id=job_def_id,
        input_uri=input_uri,
        output_formats=["ipynb"],
        status=status,
        start_time=start_time,
        end_time=end_time,
        status_message=status_message,
        runtime_environment_name="",
    )


async def load_data(jobs_count: int, job_defs_count: int, db_path: str):
    db_url = f"sqlite:///{db_path}"

    if os.path.exists(db_path):
        os.remove(db_path)

    create_tables(db_url, drop_tables=True)

    scheduler = Scheduler(
        db_url=db_url,
        root_dir=root_dir,
        environments_manager=CondaEnvironmentManager(),
        task_runner_class=None,
    )

    environments = scheduler.environments_manager.list_environments()

    job_def_ids = []

    # clear existing output files
    try:
        shutil.rmtree(os.path.join(root_dir, "outputs"))
    except:
        pass
    os.mkdir(os.path.join(root_dir, "outputs"))

    for index in range(1, job_defs_count + 1):
        env = random.choice(environments).name
        job_def_id = scheduler.create_job_definition(create_random_job_def(index, env))
        job_def_ids.append(job_def_id)

    for index in range(1, jobs_count + 1):
        scheduler.create_job(create_random_job(index, random.choice(job_def_ids)))
        # spawning too many kernels too quickly causes runtime error
        # https://github.com/jupyter/jupyter_client/issues/487
        await asyncio.sleep(0.1)

    click.echo(
        f"\nCreated {jobs_count} jobs and {job_defs_count} job definitions in the scheduler database"
    )
    click.echo(f"present at {db_path}. Copy the following command")
    click.echo(f"to start JupyterLab with this database.\n")
    click.echo(f"`jupyter lab --SchedulerApp.db_url={db_url}`\n")


@click.command(
    help="Drops the database and inserts random jobs and job definitions into the scheduler database. Intended to be run from `dev` directory."
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
    asyncio.run(load_data(jobs_count, job_defs_count, db_path))


if __name__ == "__main__":
    main()
