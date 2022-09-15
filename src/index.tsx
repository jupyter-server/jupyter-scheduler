import React from 'react';
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  MainAreaWidget,
  ReactWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { FileBrowser, IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { Contents } from '@jupyterlab/services';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ITranslator } from '@jupyterlab/translation';

import { Poll } from '@lumino/polling';
import { Signal } from '@lumino/signaling';
import { RunningJobsIndicator } from './components/running-jobs-indicator';

import { SchedulerService } from './handler';
import { NotebookJobsListingModel } from './model';
import { CreateJobFormState } from './create-job-form';
import { JobsPanelView, NotebookJobsPanel } from './notebook-jobs-panel';
import {
  calendarAddOnIcon,
  calendarMonthIcon,
  eventNoteIcon
} from './components/icons';

namespace CommandIDs {
  export const deleteJob = 'scheduling:delete-job';
  export const runNotebook = 'scheduling:run-notebook';
  export const showNotebookJobs = 'scheduling:show-notebook-jobs';
  export const stopJob = 'scheduling:stop-job';
}

export const NotebookJobsPanelId = 'notebook-jobs-panel';

/**
 * Initialization data for the jupyterlab-scheduler extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-scheduler:plugin',
  requires: [IFileBrowserFactory, ITranslator, ILayoutRestorer],
  optional: [IStatusBar, ILauncher],
  autoStart: true,
  activate: activatePlugin
};

type NotebookJobsPluginType = typeof plugin;

function getSelectedItem(widget: FileBrowser | null): Contents.IModel | null {
  if (widget === null) {
    return null;
  }

  // Get the first selected item.
  const firstItem = widget.selectedItems().next();
  if (firstItem === null || firstItem === undefined) {
    return null;
  }

  return firstItem;
}

function getSelectedFilePath(widget: FileBrowser | null): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }
  return selectedItem.path;
}

function getSelectedFileName(widget: FileBrowser | null): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }
  return selectedItem.name;
}

let scheduledJobsListingModel: NotebookJobsListingModel | null = null;

async function getNotebookJobsListingModel(): Promise<NotebookJobsListingModel> {
  if (scheduledJobsListingModel) {
    return scheduledJobsListingModel;
  }

  const api = new SchedulerService({});

  const jobsResponse = await api.getJobs({});
  scheduledJobsListingModel = new NotebookJobsListingModel(jobsResponse.jobs);
  return scheduledJobsListingModel;
}

async function activatePlugin(
  app: JupyterFrontEnd,
  browserFactory: IFileBrowserFactory,
  translator: ITranslator,
  restorer: ILayoutRestorer,
  statusBar: IStatusBar | null,
  launcher: ILauncher | null
): Promise<void> {
  const { commands } = app;
  const trans = translator.load('jupyterlab');
  const { tracker } = browserFactory;
  const api = new SchedulerService({});
  let mainAreaWidget: MainAreaWidget<NotebookJobsPanel>;
  const widgetTracker = new WidgetTracker<MainAreaWidget<NotebookJobsPanel>>({
    namespace: 'jupyterlab-scheduler'
  });
  restorer.restore(widgetTracker, {
    command: CommandIDs.showNotebookJobs,
    name: () => 'jupyterlab-scheduler'
  });

  const model = await getNotebookJobsListingModel();

  const jobsPanel = new NotebookJobsPanel({
    app,
    model,
    updateCreateJobFormSignal: _signal,
    translator
  });
  jobsPanel.title.icon = calendarMonthIcon;
  jobsPanel.title.caption = trans.__('Notebook Jobs');
  jobsPanel.node.setAttribute('role', 'region');
  jobsPanel.node.setAttribute('aria-label', trans.__('Notebook Jobs'));

  commands.addCommand(CommandIDs.deleteJob, {
    execute: async args => {
      const id = args['id'] as string;
      await api.deleteJob(id);
    },
    // TODO: Use args to name command dynamically
    label: trans.__('Delete Job')
  });

  const showJobsPane = async (view: JobsPanelView) => {
    if (!mainAreaWidget || mainAreaWidget.isDisposed) {
      // Create a new widget
      mainAreaWidget = new MainAreaWidget<NotebookJobsPanel>({
        content: jobsPanel
      });
      mainAreaWidget.content.view = view;
      mainAreaWidget.id = NotebookJobsPanelId;
      mainAreaWidget.title.icon = calendarMonthIcon;
      mainAreaWidget.title.label = trans.__('Notebook Jobs');
      mainAreaWidget.title.closable = true;
    }

    if (!widgetTracker.has(mainAreaWidget)) {
      // Track the state of the widget for later restoration
      widgetTracker.add(mainAreaWidget);
    }

    if (!mainAreaWidget.isAttached) {
      app.shell.add(mainAreaWidget, 'main');
    }

    mainAreaWidget.content.view = view;
    mainAreaWidget.content.update();
    app.shell.activateById(mainAreaWidget.id);
  };

  commands.addCommand(CommandIDs.showNotebookJobs, {
    execute: async () => showJobsPane('JobsList'),
    label: trans.__('Show Notebook Jobs'),
    icon: eventNoteIcon
  });

  commands.addCommand(CommandIDs.runNotebook, {
    execute: async () => {
      await showJobsPane('CreateJobForm');

      const widget = tracker.currentWidget;
      const filePath = getSelectedFilePath(widget) ?? '';
      const fileName = getSelectedFileName(widget) ?? '';

      // Update the job form inside the notebook jobs widget
      const newState: CreateJobFormState = {
        inputFile: filePath,
        jobName: fileName,
        outputPath: '',
        environment: ''
      };

      _signal.emit(newState);
    },
    label: trans.__('Create Notebook Job'),
    icon: calendarAddOnIcon
  });

  commands.addCommand(CommandIDs.stopJob, {
    execute: async args => {
      const id = args['id'] as string;
      await api.setJobStatus(id, 'STOPPED');
    },
    // TODO: Use args to name command dynamically
    label: trans.__('Stop Job')
  });

  if (!statusBar) {
    // Automatically disable if statusbar missing
    return;
  }

  statusBar.registerStatusItem('jupyterlab-scheduler:status', {
    align: 'middle',
    item: ReactWidget.create(
      <RunningJobsIndicator
        onClick={async () => showJobsPane('JobsList')}
        model={model}
      />
    )
  });

  const statusPoll = new Poll({
    factory: async () => {
      const jobCount = await api.getJobsCount('IN_PROGRESS');
      model.updateJobsCount(jobCount);
    },
    frequency: { interval: 1000, backoff: false }
  });
  statusPoll.start();

  // Add to launcher
  if (launcher) {
    launcher.add({
      command: CommandIDs.showNotebookJobs
    });
  }

  console.log('JupyterLab extension jupyterlab-scheduler is activated!');
}

const _signal: Signal<NotebookJobsPluginType, CreateJobFormState> = new Signal<
  NotebookJobsPluginType,
  CreateJobFormState
>(plugin);

export default plugin;
