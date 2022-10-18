# jupyter_scheduler

[![Github Actions Status](https://github.com/jupyter-server/jupyter-scheduler/workflows/Build/badge.svg)](https://github.com/jupyter-server/jupyter-scheduler/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyter-server/jupyter-scheduler/main?urlpath=lab)
A JupyterLab extension for running notebook jobs

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

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
git clone https://github.com/jupyter-server/jupyter-scheduler.git

# Change dir to the cloned project
cd jupyter-scheduler

# Install the project in editable mode
pip install -e .

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Server extension must be manually installed in develop mode
jupyter server extension enable jupyter_scheduler

# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyter_scheduler
pip uninstall jupyter_scheduler
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyter-scheduler` within that folder.

### Testing the extension

#### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
```

To execute them, run:

```sh
pytest -vv -r ap --cov jupyter_scheduler
```

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses Playwright for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)

### Configuring the extension

You can configure the server extension to replace the Scheduler server API, replace the execution engine, re-create the database tables, and select a database path.

#### drop_tables

Setting this value to `True` will re-create the database tables on each JupyterLab start. This will destroy all existing data. It may be necessary if your database's schema is out of date.

```
jupyter lab --SchedulerApp.drop_tables=True
```

#### db_url

The fully qualified URL of the database. For example, a SQLite database path will look like `sqlite:///<database-file-path>`.

```
jupyter lab --SchedulerApp.db_url=sqlite:///<database-file-path>
```

#### scheduler_class

The fully classified classname to use for the scheduler API. This class should extend `jupyter_scheduler.scheduler.BaseScheduler` and implement all abstract methods. The default class is `jupyter_scheduler.scheduler.Scheduler`.

```
jupyter lab --SchedulerApp.scheduler_class=jupyter_scheduler.scheduler.Scheduler
```

#### environment_manager_class

The fully classified classname to use for the environment manager. This class should extend `jupyter_scheduler.environments.EnvironmentManager` and implement all abstract methods. The default class is `jupyter_scheduler.environments.CondaEnvironmentManager`.

```
jupyter lab --SchedulerApp.environment_manager_class=jupyter_scheduler.environments.CondaEnvironmentManager
```

#### execution_manager_class

The fully classified classname to use for the execution manager, the module that is responsible for reading the input file, executing and writing the output. This option lets you specify a custom execution engine without replacing the whole scheduler API. This class should extend `jupyter_scheduler.executors.ExecutionManager` and implement the execute method. The default class is `jupyter_scheduler.executors.DefaultExecutionManager`.

```
# This can be configured on the BaseScheduler class
jupyter lab --BaseScheduler.execution_manager_class=jupyter_scheduler.executors.DefaultExecutionManager

# Or, on the Scheduler class directly
jupyter lab --Scheduler.execution_manager_class=jupyter_scheduler.executors.DefaultExecutionManager
```
