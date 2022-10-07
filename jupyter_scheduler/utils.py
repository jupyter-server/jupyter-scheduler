import json
import os
import pathlib
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

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


def create_output_filename(input_uri: str) -> str:
    """Creates output filename from input_uri"""

    filename = os.path.basename(input_uri)
    file_extension = pathlib.Path(input_uri).suffix
    output_filename = f"{os.path.splitext(filename)[0]}-{datetime.now().strftime('%Y%m%d_%I%M%S_%p')}{file_extension}"

    return output_filename


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
