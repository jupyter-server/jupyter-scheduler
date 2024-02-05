"""Scheduling API for JupyterLab"""

from ._version import __version__
from .extension import SchedulerApp


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "@jupyterlab/scheduler"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyter_scheduler", "app": SchedulerApp}]
