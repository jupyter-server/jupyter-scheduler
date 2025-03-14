import json
import multiprocessing as mp
import os
import shutil
from datetime import datetime, timezone
from typing import Any, Callable, List, Optional
from uuid import UUID

import fsspec
import pytz
from croniter import croniter
from nbformat import NotebookNode

from jupyter_scheduler.models import CreateJob


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            # if the obj is uuid, we simply return the value of uuid
            return obj.hex
        return json.JSONEncoder.default(self, obj)


def timestamp_to_int(timestamp: str) -> int:
    """Converts string date in format yyyy-mm-dd h:m:s to int"""

    dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
    return int(dt.timestamp())


def create_output_directory(input_filename: str, job_id: str) -> str:
    """Creates output directory from input_filename and job_id"""
    basefilename = os.path.splitext(input_filename)[0]
    return f"{basefilename}-{job_id}"


def create_output_filename(input_filename: str, create_time: int, output_format: str = None) -> str:
    """Creates output filename from input_filename, create_time and output_format"""
    basefilename = os.path.splitext(input_filename)[0]
    timestamp = datetime.fromtimestamp(create_time / 1e3).strftime("%Y-%m-%d-%I-%M-%S-%p")
    if output_format:
        return f"{basefilename}-{timestamp}.{output_format}"
    else:
        return f"{basefilename}-{timestamp}"


def find_cell_index_with_tag(nb: NotebookNode, tag: str) -> int:
    """Finds index of first cell tagged with ``tag``"""

    parameters_indices = []
    for idx, cell in enumerate(nb.cells):
        if "tags" in cell.metadata and tag in cell.metadata["tags"]:
            parameters_indices.append(idx)
    if not parameters_indices:
        return -1
    return parameters_indices[0]


def resolve_path(path, root_dir=None) -> str:
    if not root_dir:
        return path

    if "~" in root_dir:
        root_dir = root_dir.replace("~", os.environ["HOME"])

    return os.path.join(root_dir, path)


def get_utc_timestamp() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def compute_next_run_time(schedule: str, timezone: Optional[str] = None) -> int:
    if timezone:
        tz = pytz.timezone(timezone)
        local_date = datetime.now(tz=tz)
        cron = croniter(schedule, local_date)
    else:
        cron = croniter(schedule, datetime.now(pytz.utc))

    return int(cron.get_next(float) * 1000)


def get_localized_timestamp(timezone) -> int:
    tz = pytz.timezone(timezone)
    local_date = datetime.now(tz=tz)
    return int(local_date.timestamp() * 1000)


def copy_directory(
    source_dir: str,
    destination_dir: str,
    exclude_files: Optional[List[str]] = [],
) -> List[str]:
    """Copies content of source_dir to destination_dir excluding exclude_files.
    Returns a list of relative paths to copied files from destination_dir.
    """
    copied_files = []
    for item in os.listdir(source_dir):
        source = os.path.join(source_dir, item)
        destination = os.path.join(destination_dir, item)
        if os.path.isdir(source):
            shutil.copytree(source, destination, ignore=shutil.ignore_patterns(*exclude_files))
            for dirpath, _, filenames in os.walk(destination):
                for filename in filenames:
                    rel_path = os.path.relpath(os.path.join(dirpath, filename), destination_dir)
                    copied_files.append(rel_path)
        elif os.path.isfile(source) and item not in exclude_files:
            with fsspec.open(source, "rb") as source_file:
                with fsspec.open(destination, "wb") as output_file:
                    output_file.write(source_file.read())
            rel_path = os.path.relpath(destination, destination_dir)
            copied_files.append(rel_path)

    return copied_files


def copy_file(input_filepath: str, copy_to_path: str):
    """Copies the file at input_filepath to copy_to_path"""
    with fsspec.open(input_filepath) as input_file:
        with fsspec.open(copy_to_path, "wb") as output_file:
            output_file.write(input_file.read())


# After support for Python 3.9 will be dropped, ParamSpec available as a part
# of standard library in Python 3.10+ should be used to type args and kwargs
def spawn_process(target: Callable[..., Any], *args: Any, **kwargs: Any) -> mp.Process:
    """
    Spawns a new process using the 'spawn' context with the given target and
    arguments, returns the spawned process.

    The MP context forces new processes to not be forked on Linux.
    This is necessary because `asyncio.get_event_loop()` is bugged in
    forked processes in Python versions below 3.12. This method is
    called by `jupyter_core` by `nbconvert` in the default executor.
    See: https://github.com/python/cpython/issues/66285
    See also: https://github.com/jupyter/jupyter_core/pull/362
    """
    context = mp.get_context("spawn")
    process = context.Process(target=target, args=args, kwargs=kwargs)
    process.start()
    return process
