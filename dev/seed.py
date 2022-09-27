import json
import os
import random
import subprocess

import click

from jupyter_scheduler.orm import Job, create_session, create_tables
from jupyter_scheduler.utils import get_utc_timestamp


def get_db_path():
    paths = subprocess.check_output(["jupyter", "--paths", "--json"])
    data = json.loads(paths).get("data", [])
    if len(data) < 1:
        raise Exception("No Jupyter data folder found.")
    return os.path.join(data[0], "scheduler.sqlite")


def create_random_job(index: int):
    status = random.choice(["CREATED", "COMPLETED", "FAILED", "IN_PROGRESS", "STOPPED"])
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

    if status != "CREATED":
        start_time = get_utc_timestamp()

    if status == "FAILED":
        status_message = "Failed job because of an exception..."

    if status == "COMPLETED":
        end_time = get_utc_timestamp()

    return Job(
        name=f"{name} {index}",
        input_uri=input_uri,
        output_prefix=output_prefix,
        status=status,
        start_time=start_time,
        end_time=end_time,
        status_message=status_message,
        runtime_environment_name="",
    )


def load_data(count: int, db_path: str):
    db_url = f"sqlite:///{db_path}"

    if os.path.exists(db_path):
        os.remove(db_path)

    create_tables(db_url, drop_tables=True)
    db_session = create_session(db_url)

    with db_session() as session:
        for index in range(1, count + 1):
            session.add(create_random_job(index))

        session.commit()

    click.echo(f"\nCreated {count} jobs in the scheduler database")
    click.echo(f"present at {db_path}, copy the following command")
    click.echo(f"to start JupyterLab with this database.\n")
    click.echo(f"`jupyter lab --SchedulerApp.db_url={db_url}`\n")


@click.command(
    help="Inserts random jobs in the scheduler database. Note, that this command will drop the tables and re-create."
)
@click.option("--count", default=25, help="No of jobs to create, default is 25")
@click.option(
    "--db_path",
    type=click.Path(),
    default=get_db_path(),
    help="DB file path, default is scheduler db path",
)
def main(count, db_path) -> None:
    load_data(count, db_path)


if __name__ == "__main__":
    main()
