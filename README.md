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

- JupyterLab >= 3.0

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
