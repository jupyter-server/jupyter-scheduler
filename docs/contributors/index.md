# Contributors

This page is for people who wish to contribute to Jupyter Scheduler directly,

Developers wishing to extend or override Jupyter Scheduler should instead refer
to our {doc}`developer's guide </developers/index>`.

## Development install

The commands below will install a development environment for
Jupyter Scheduler locally. Before running these commands, you should ensure that NodeJS is
installed locally. The `jlpm` command is JupyterLab's pinned version of
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

You can watch the source directory and run JupyterLab at the same time in
different terminals to watch for changes in the extension's source and
automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the `watch` command running, every file change will be built immediately
and made available in your running JupyterLab. Refresh JupyterLab to load the
change in your browser (you may need to wait several seconds for the extension
to be rebuilt).

## Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyter_scheduler
pip uninstall jupyter_scheduler
```

In development mode, you will also need to remove the symlink created by
`jupyter labextension develop` command. First, find where the lab extension
folder is located:

```bash
$ jupyter labextension list

...
/opt/anaconda3/envs/jupyter-scheduler/share/jupyter/labextensions
        @jupyterlab/scheduler v1.1.4 enabled OK
```

Then you can remove the symlink named `jupyter-scheduler` within that
folder.
```
# Remove the symlink
rm /opt/anaconda3/envs/jupyter-scheduler/share/jupyter/labextensions/jupyter_scheduler
```

## Testing

### Server tests

This extension uses [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
```

To execute them, run:

```sh
pytest -vv -r ap --cov jupyter_scheduler
```

### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

### Integration tests

This extension uses Playwright for the integration tests (aka user level tests).
More precisely, the JupyterLab helper
[Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to
test the extension in JupyterLab.

You can find more information in the
[ui-tests](https://github.com/jupyter-server/jupyter-scheduler/tree/main/ui-tests)
README.

## Documentation

First, ensure GNU Make is installed locally, and then install the `docs` dependencies:

```
pip install -e ".[docs]"
```

Documentation is built with the [Sphinx](https://www.sphinx-doc.org/en/master/)
documentation generator, using the following command executed from the project root:

```
make -C docs html
```

Documentation source files are written in
[MyST](https://myst-parser.readthedocs.io/en/latest/index.html), a rich and more
expressive flavor of Markdown. These files are located under `docs/`.

The generated documentation files placed under `docs/_build/html` can be
directly opened in the browser.  We recommend bookmarking these file links
if you will be editing and reviewing documentation frequently in the browser.

Sphinx by default only rebuilds files it detects were changed, though this
detection logic is sometimes faulty. To force a full rebuild of the
documentation:

```
make -C docs clean && make -C docs html
```

## Releasing

Releases should be done via [Jupyter Releaser](https://github.com/jupyter-server/jupyter_releaser).
If you have admin permissions on the repository, you can go to the "Actions"
panel on GitHub and follow the following instructions to release a new version of
Jupyter Scheduler.

1. Select the "Step 1: Prep Release" workflow on the left-hand panel, and then
select "Run workflow". This will open the workflow form. Replace the "Next Version
Specifier" with the next version of Jupyter Scheduler (e.g. 1.2.3). "Branch to Target"
should be replaced with the branch that should be released. Usually this will be `main`.
Then select "Run workflow" button to run the workflow.

2. Verify the draft release changelog in the
[Releases](https://github.com/jupyter-server/jupyter-scheduler/releases) page
for Jupyter Scheduler.

3. Return to the Actions panel and select the "Step 2: Publish Release" workflow.
Run this workflow with the target branch set to the same branch specified in
Step 1.

4. Wait for the workflow to complete, and then verify the publish on PyPi and
NPM.

### Manual release

In the unlikely scenario Jupyter Releaser fails in Step 2, the below steps
should be followed to perform a manual release. Make sure to publish the draft
release changelog afterwards.

#### Python package

This extension can be distributed as Python packages. The Python
packaging instructions in the `pyproject.toml` file can wrap your extension in a
Python package. Before generating a package, we first need to install `build`.

```bash
pip install build twine tbump
```

Check out your local `main` branch and keep it up to date with the remote version.

```bash
git checkout main
git remote update
git pull upstream main
```

Bump the version using `tbump`. By default this will create a tag.

```bash
tbump --no-push <new-version>
```

Push the bump version commit and tag to main upstream branch.

```bash
git push upstream main
git push upstream <new-version-tag>
```

Checkout the new tagged commit.

```bash
git checkout <new-version-tag>
```

Build the extension

```bash
jlpm run build:prod
```

To create a Python source package (`.tar.gz`) and the binary package (`.whl`) in the `dist/` directory, do:

```bash
python -m build
```

> `python setup.py sdist bdist_wheel` is deprecated and will not work for this package.

Then to upload the package to PyPI, do:

```bash
twine upload dist/*
```

#### NPM package

To publish the frontend part of the extension as a NPM package, do:

```bash
npm login
npm publish --access public
```
