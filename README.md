# jupyter_scheduler

[![Github Actions Status](https://github.com/jupyter-server/jupyter-scheduler/workflows/Build/badge.svg)](https://github.com/jupyter-server/jupyter-scheduler/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyter-server/jupyter-scheduler/main?urlpath=lab)

A JupyterLab extension for running notebook jobs. Documentation is available on
[ReadTheDocs](https://jupyter-scheduler.readthedocs.io).

This extension is composed of a Python package named `jupyter_scheduler`
for the server extension and a NPM package named `@jupyterlab/scheduler`
for the frontend extension. Installation of this extension provides a
REST API to run, query, stop and delete
notebook jobs; the UI provides an interface to create, list and view job
details.

## Requirements

- JupyterLab 4.x (for newer Jupyter Scheduler versions)
- JupyterLab 3.x (for Jupyter Scheduler 1.x)

> [!IMPORTANT]
> JupyterLab 3 will reach its end of maintenance date on May 15, 2024, anywhere on Earth. As a result, we will not backport new features to the v1 branch supporting JupyterLab 3 after this date. Fixes for critical issues will still be backported until December 31, 2024. If you are still using JupyterLab 3, we strongly encourage you to **upgrade to JupyterLab 4 as soon as possible**. For more information, see [JupyterLab 3 end of maintenance](https://blog.jupyter.org/jupyterlab-3-end-of-maintenance-879778927db2) on the Jupyter Blog.

## Install

To install the extension, execute:

```bash
pip install jupyter_scheduler
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyter_scheduler
```

## User's guide

Please refer to our [user's guide](https://jupyter-scheduler.readthedocs.io/en/latest/users/index.html)
for more information on installation and usage.

## Contributing

Please refer to our [contributor's guide](https://jupyter-scheduler.readthedocs.io/en/latest/contributors/index.html)
for more information on installation and usage.
