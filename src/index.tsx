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
import { RunningJobsIndicator } from './components/running-jobs-indicator';

import { SchedulerService } from './handler';
import { JobsView, ICreateJobModel, NotebookJobsListingModel } from './model';
import { NotebookJobsPanel } from './notebook-jobs-panel';
import {
  calendarAddOnIcon,
  calendarMonthIcon,
  eventNoteIcon
} from './components/icons';
import { Scheduler } from './tokens';
import AdvancedOptions from './advanced-options';

export namespace CommandIDs {
  export const deleteJob = 'scheduling:delete-job';
  export const runNotebook = 'scheduling:run-notebook';
  export const showNotebookJobs = 'scheduling:show-notebook-jobs';
  export const stopJob = 'scheduling:stop-job';
}

export const NotebookJobsPanelId = 'notebook-jobs-panel';
export { Scheduler } from './tokens';

/**
 * Initialization data for the jupyterlab-scheduler extension.
 */
const schedulerPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/scheduler:plugin',
  requires: [
    IFileBrowserFactory,
    ITranslator,
    ILayoutRestorer,
    Scheduler.IAdvancedOptions
  ],
  optional: [IStatusBar, ILauncher],
  autoStart: true,
  activate: activatePlugin
};

// Disable this plugin and replace with custom plugin to change the advanced options UI
const advancedOptions: JupyterFrontEndPlugin<Scheduler.IAdvancedOptions> = {
  id: '@jupyterlab/scheduler:IAdvancedOptions',
  autoStart: true,
  provides: Scheduler.IAdvancedOptions,
  activate: (app: JupyterFrontEnd) => {
    return AdvancedOptions;
  }
};

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
  advancedOptions: Scheduler.IAdvancedOptions,
  statusBar: IStatusBar | null,
  launcher: ILauncher | null
): Promise<void> {
  // first, validate presence of dependencies
  if (!statusBar) {
    return;
  }

  const { commands } = app;
  const trans = translator.load('jupyterlab');
  const { tracker } = browserFactory;
  const api = new SchedulerService({});
  const widgetTracker = new WidgetTracker<MainAreaWidget<NotebookJobsPanel>>({
    namespace: 'jupyterlab-scheduler'
  });
  restorer.restore(widgetTracker, {
    command: CommandIDs.showNotebookJobs,
    name: () => 'jupyterlab-scheduler'
  });

  commands.addCommand(CommandIDs.deleteJob, {
    execute: async args => {
      const id = args['id'] as string;
      await api.deleteJob(id);
    },
    // TODO: Use args to name command dynamically
    label: trans.__('Delete Job')
  });

  let mainAreaWidget: MainAreaWidget<NotebookJobsPanel> | undefined;
  let jobsPanel: NotebookJobsPanel | undefined;

  const showJobsPane = async (view: JobsView) => {
    if (!mainAreaWidget || mainAreaWidget.isDisposed) {
      // Create new jobs panel widget
      jobsPanel = new NotebookJobsPanel({
        app,
        translator,
        advancedOptions: advancedOptions
      });
      // Create new main area widget
      mainAreaWidget = new MainAreaWidget<NotebookJobsPanel>({
        content: jobsPanel
      });
      mainAreaWidget.content.model.jobsView = view;
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

    mainAreaWidget.content.model.jobsView = view;
    mainAreaWidget.content.update();
    app.shell.activateById(mainAreaWidget.id);
  };

  commands.addCommand(CommandIDs.showNotebookJobs, {
    execute: async () => showJobsPane('ListJobs'),
    label: trans.__('Notebook Jobs'),
    icon: eventNoteIcon
  });

  commands.addCommand(CommandIDs.runNotebook, {
    execute: async () => {
      await showJobsPane('CreateJob');

      const model = jobsPanel?.model;
      if (!model) {
        return;
      }

      const widget = tracker.currentWidget;
      const filePath = getSelectedFilePath(widget) ?? '';
      const fileName = getSelectedFileName(widget) ?? '';

      // Update the job form inside the notebook jobs widget
      const newModel: ICreateJobModel = {
        inputFile: filePath,
        jobName: fileName,
        outputPath: '',
        environment: '',
        createType: 'Job',
        scheduleInterval: 'weekday',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      model.createJobModel = newModel;
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

  // validate presence of status bar
  if (!statusBar) {
    return;
  }

  const scheduledJobsListingModel = await getNotebookJobsListingModel();
  statusBar.registerStatusItem('jupyterlab-scheduler:status', {
    align: 'middle',
    item: ReactWidget.create(
      <RunningJobsIndicator
        onClick={async () => showJobsPane('ListJobs')}
        model={scheduledJobsListingModel}
      />
    )
  });

  const statusPoll = new Poll({
    factory: async () => {
      const model = jobsPanel?.model;
      if (!model) {
        return;
      }

      const jobCount = await api.getjobCount('IN_PROGRESS');
      model.jobCount = jobCount;
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
}

const plugins: JupyterFrontEndPlugin<any>[] = [
  schedulerPlugin,
  advancedOptions
];

export default plugins;
