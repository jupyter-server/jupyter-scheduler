# Users

These pages are for people interested in installing and using Jupyter Scheduler.

For configuration options, please refer to our {doc}`operator's guide </operators/index>`.

## Installation

Jupyter Scheduler can be installed from the PyPI registry via `pip`:

```
pip install jupyter-scheduler
```

This automatically enables its extensions. You can verify this by running

```
jupyter server extension list
jupyter labextension list
```

and checking that both the `jupyter_scheduler` server extension and the
`@jupyterlab/scheduler` prebuilt lab extension are enabled.

## Use

Jupyter Scheduler can run your Jupyter notebooks in the background once or on a schedule. You can create *jobs* (single run of an individual notebook) and *job definitions* (scheduled recurring notebook jobs).

To create a *job* or *job definition* from a file browser, right-click on a notebook in the file browser and choose “Create Notebook Job” from the context menu:

![“Create Notebook Job” button in the file browser context menu](create_job_from_notebook.png)

To create a *job* or *job definition* from an open Notebook, click on a “Create a notebook job” button in the top toolbar of the open Notebook:

![“Create a notebook job” button in the top toolbar of the open Notebook](create_job_from_notebook.png)
