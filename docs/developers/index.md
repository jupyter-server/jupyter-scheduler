# Developers

These pages are targeted at people who want to extend or override the server or
lab extensions in Jupyter Scheduler. This is necessary for more complex features
that cannot simply be defined as a set of configuration options.

For installation and usage instructions, please refer to our {doc}`user's guide </users/index>`.

For configuration options, please refer to our {doc}`operator's guide </operators/index>`.

## Extension points

You can customize Jupyter Scheduler using
[plugins](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#plugins).
If you override the
[token](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#tokens)
in the `@jupyterlab/scheduler:IAdvancedOptions` plugin, you can customize the advanced options
shown in the "Create Job" form and the "Job Details" view (and the same form/view for job
definitions). You can find the token exported as `IAdvancedOptions` in
[src/tokens.ts](https://github.com/jupyter-server/jupyter-scheduler/blob/main/src/tokens.ts).
