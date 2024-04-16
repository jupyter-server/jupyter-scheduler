"""Scheduling API for JupyterLab"""

import json
from pathlib import Path

from ._version import __version__
from .extension import SchedulerApp

HERE = Path(__file__).parent.resolve()


with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": data["name"]}]


def _jupyter_server_extension_points():
    return [{"module": "jupyter_scheduler", "app": SchedulerApp}]
