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

Jupyter Scheduler runs Jupyter notebooks in the background, either once or on a schedule. You can create *jobs* (single run of an individual notebook) and *job definitions* (scheduled recurring notebook jobs). When the scheduler runs your notebook, it makes a copy of the input file. The scheduler uses unique names for the input and output files so that rerunning the same notebook produces new files every time.

### Creating a job or job definition

#### Choose a notebook
   - To create a *job* or *job definition* from a file browser, right-click on a notebook in the file browser and choose “Create Notebook Job” from the context menu:
![“Create Notebook Job” button in the file browser context menu](./images/create_job_from_filebrowser.png)

   - To create a *job* or *job definition* from an open notebook, click on a “Create a notebook job” button in the top toolbar of the open notebook:
![“Create a notebook job” button in the top toolbar of the open Notebook](./images/create_job_from_notebook.png)

#### Submit the Create Job form

   You can give your notebook job or job definition a name, choose an environment to run it in, select different output formats, and provide parameters that are set as local variables when your notebook gets executed. This parameterized execution is similar to [Papermill](https://papermill.readthedocs.io/en/latest/); Jupyter Scheduler provides a UI for managing and accessing the outputs of your notebook jobs inside JupyterLab.

   - To create a *job*, press "Create" button when "Run Now" is chosen in "Schedule" section.
   !["Create Job Form"](./images/create_job_form.png)

   - To create a *job definition* that would run your job on a recurring schedule select “Run on a schedule” radio button in "Schedule" section. We provide a few useful shortcuts to, for example, run your notebook at a specified minute, hour, daily or weekly interval.
   !["Run on schedule"](./images/run_on_schedule.png)
   You can also specify a custom schedule in [crontab format](https://www.man7.org/linux/man-pages/man5/crontab.5.html) by selecting "Custom schedule" in "Interval" drop-down menu.
   !["Custom schedule option"](./images/custom_schedule.png)

### Using list view

Once you’ve created a job or job schedule, you can use the “Notebook Jobs” icon on the launcher to view lists of jobs and job definitions.

!["Launcher with Notebook Jobs icon in Other section"](./images/launcher.png)

Each items name links to a detail view.

!["Job name as a link in each column"](./images/item_name.png)

You can sort the list by clicking one of the headers (for example, click "Job name" header to sort the list alphabetically based on "Job Name").

!["Notebook Jobs list sorted alphabetically after Job Name header is clicked"](./images/headers.png)

You can also delete each job or pause its execution in the list by clicking appropriate buttons in "Actions" column.

!["Delete and Stop buttons in Actions column"](./images/actions_list.png)

When one of your jobs has completed, you can download its files by clicking "Download job files" button in "Ouput files" column.

!["Download button in Output Files column"](./images/download_button.png)

After download is finished, you can access the downloaded files through links that appear instead of "Download job files" button in "Output files" column.

!["Links to downloaded files in Output Files column after download is finished"](./images/downloaded_files.png)

### Using details view

You can click job or job definition name in the list view to see its details.

- Job Detail

Job Definition detail page displays information about particular job and provides access to action buttons with which you can reload the state of the job, stop the job (if it's in progress), download output files (if it's finished), and delete a job.

!["Action buttons in job detail view"](./images/actions_job_details.png)

- Jod Definition Detail

The job definition detail page displays information about one job definition. It includes action buttons to reload, pause, resume, edit, and delete the job definition. It also includes a list of jobs created by this job definition.

You can run a new job based on the input file snapshot by clicking the "Run Job" button on top of the detail view.

!["Action buttons in job definition detail view"](./images/actions_definition_details.png)
