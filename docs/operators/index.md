# Operators

These docs are intended for users who want to configure and deploy Jupyter Scheduler.

For installation and usage instructions, please refer to our {doc}`user's guide </users/index>`.

## Server configuration

You can configure the server extension to replace the Scheduler server API,
replace the execution engine, re-create the database tables, and select a
database path.

### drop_tables

Setting this value to `True` will re-create the database tables on each
JupyterLab start. This will destroy all existing data. It may be necessary if
your database's schema is out of date.

```
jupyter lab --SchedulerApp.drop_tables=True
```

### db_url

The fully qualified URL of the database. For example, a SQLite database path
will look like `sqlite:///<database-file-path>`.

```
jupyter lab --SchedulerApp.db_url=sqlite:///<database-file-path>
```

### scheduler_class

The fully qualified classname to use for the scheduler API. This class should
extend `jupyter_scheduler.scheduler.BaseScheduler` and implement all abstract
methods. The default class is `jupyter_scheduler.scheduler.Scheduler`.

```
jupyter lab --SchedulerApp.scheduler_class=jupyter_scheduler.scheduler.Scheduler
```

For more information on how to write a custom implementation, please to our {doc}`developer's guide </developers/index>`.

### environment_manager_class

The fully qualified classname to use for the environment manager. This class
should extend `jupyter_scheduler.environments.EnvironmentManager` and implement
all abstract methods. The default class is
`jupyter_scheduler.environments.CondaEnvironmentManager`.

```
jupyter lab --SchedulerApp.environment_manager_class=jupyter_scheduler.environments.CondaEnvironmentManager
```

For more information on writing a custom implementation, please see the {doc}`developer's guide </developers/index>`.

### execution_manager_class

The fully qualified classname to use for the execution manager, the module that
is responsible for reading the input file, executing and writing the output.
This option lets you specify a custom execution engine without replacing the
whole scheduler API. This class should extend
`jupyter_scheduler.executors.ExecutionManager` and implement the `execute` method.
The default class is `jupyter_scheduler.executors.DefaultExecutionManager`.

```
# This can be configured on the BaseScheduler class
jupyter lab --BaseScheduler.execution_manager_class=jupyter_scheduler.executors.DefaultExecutionManager

# Or, on the Scheduler class directly
jupyter lab --Scheduler.execution_manager_class=jupyter_scheduler.executors.DefaultExecutionManager
```

For more information on writing a custom implementation, please see the {doc}`developer's guide </developers/index>`.

### job_files_manager_class

The fully qualified classname to use for the job files manager. This class
should extend `jupyter_scheduler.job_files_manager.JobFilesManager` and implement
all abstract methods. The default class is
`jupyter_scheduler.job_files_manager.JobFilesManager`.

```
jupyter lab --SchedulerApp.job_files_manager_class=jupyter_scheduler.job_files_manager.JobFilesManager
```

For more information on writing a custom implementation, please see the {doc}`developer's guide </developers/index>`.

### Example: Capturing side effect files

The default scheduler and execution manager classes do not capture
**side effect files** (files that are created as a side effect of executing
cells in a notebook) unless “Run job with input folder” is checked. The `ArchivingScheduler` and `ArchivingExecutionManager`
classes do capture side effect files by default. If you intend to run notebooks that produce
side effect files, you can use these classes by running:

```
jupyter lab \
  --SchedulerApp.scheduler_class=jupyter_scheduler.scheduler.ArchivingScheduler \
  --Scheduler.execution_manager_class=jupyter_scheduler.executors.ArchivingExecutionManager
```

## UI configuration

You can configure the Jupyter Scheduler UI by installing a lab extension that both:

1. Exports a
   [plugin](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#plugins)
   providing the `Scheduler.IAdvancedOptions`
   [token](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#tokens).

2. Disables the `@jupyterlab/scheduler:IAdvancedOptions` plugin.

This allows you to customize the
"advanced options" shown in the "Create Job" form and the "Job Details" view
(and the same form/view for job definitions).

For more information about writing a custom plugin, please see the
{doc}`developer's guide </developers/index>`.
