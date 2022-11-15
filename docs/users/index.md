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
