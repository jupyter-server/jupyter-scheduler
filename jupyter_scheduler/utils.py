import asyncio
import json
import os
import shutil
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

import aiofiles
import aiofiles.os
import fsspec
import pytz
from croniter import croniter
from nbformat import NotebookNode


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


async def copy_directory_async(
    source_dir: str,
    destination_dir: str,
    exclude_files: Optional[List[str]] = None,
) -> List[str]:
    """Async version of copy_directory using aiofiles.

    Copies content of source_dir to destination_dir excluding exclude_files.
    Returns a list of relative paths to copied files from destination_dir.

    Uses os.walk() for directory traversal (sync but fast metadata operation),
    then copies file contents asynchronously using aiofiles.
    """
    if exclude_files is None:
        exclude_files = []

    copied_files = []

    for dirpath, dirnames, filenames in os.walk(source_dir):
        # Filter out excluded directories in-place to prevent os.walk from descending into them
        dirnames[:] = [d for d in dirnames if d not in exclude_files]

        # Compute relative path from source_dir
        rel_dir = os.path.relpath(dirpath, source_dir)
        dest_dir = os.path.join(destination_dir, rel_dir) if rel_dir != "." else destination_dir

        # Create destination directory
        await aiofiles.os.makedirs(dest_dir, exist_ok=True)

        # Copy files asynchronously
        for filename in filenames:
            if filename in exclude_files:
                continue

            src_path = os.path.join(dirpath, filename)
            dst_path = os.path.join(dest_dir, filename)

            async with aiofiles.open(src_path, "rb") as src:
                content = await src.read()
            async with aiofiles.open(dst_path, "wb") as dst:
                await dst.write(content)

            rel_path = os.path.join(rel_dir, filename) if rel_dir != "." else filename
            copied_files.append(rel_path)

    return copied_files


async def remove_directory_async(path: str) -> None:
    """Async wrapper for shutil.rmtree using asyncio.to_thread.

    shutil.rmtree has no native async equivalent, so we offload it to a thread
    to avoid blocking the event loop during large directory deletions.
    """
    await asyncio.to_thread(shutil.rmtree, path)
