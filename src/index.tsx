import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  Dialog,
  MainAreaWidget,
  showDialog,
  WidgetTracker
} from '@jupyterlab/apputils';
import { FileBrowser, IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Contents, ServerConnection } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';

import AdvancedOptions from './advanced-options';
import {
  calendarAddOnIcon,
  calendarMonthIcon,
  eventNoteIcon
} from './components/icons';
import { SchedulerService } from './handler';
import { IJobsModel, emptyCreateJobModel, JobsView } from './model';
import { NotebookJobsPanel } from './notebook-jobs-panel';
import { Scheduler } from './tokens';
import { SERVER_EXTENSION_404_JSX } from './util/errors';
import { MakeNameValid } from './util/job-name-validation';

export namespace CommandIDs {
  export const deleteJob = 'scheduling:delete-job';
  export const createJobFileBrowser = 'scheduling:create-from-filebrowser';
  export const createJobCurrentNotebook = 'scheduling:create-from-notebook';
  export const restoreLayout = 'scheduling:restore-layout';
  export const stopJob = 'scheduling:stop-job';
  export const downloadFiles = 'scheduling:download-files';
  export const listJobsFromLauncher = 'scheduling:list-jobs-from-launcher';
}

export const NotebookJobsPanelId = 'notebook-jobs-panel';
export { Scheduler } from './tokens';

type EventLog = {
  body: { name: string; detail?: string };
  timestamp: Date;
};

/**
 * Call API to verify that the server extension is actually installed.
 */
async function verifyServerExtension(props: {
  api: SchedulerService;
  trans: IRenderMime.TranslationBundle;
}) {
  try {
    await props.api.getJobs({ max_items: 0 });
  } catch (e: unknown) {
    // in case of 404, show missing server extension dialog and return
    if (
      e instanceof ServerConnection.ResponseError &&
      e.response.status === 404
    ) {
      showDialog({
        title: props.trans.__('Jupyter Scheduler server extension not found'),
        body: SERVER_EXTENSION_404_JSX,
        buttons: [Dialog.okButton()]
      }).catch(console.warn);
      return;
    }
  }
}

/**
 * Initialization data for the jupyterlab-scheduler extension.
 */
const schedulerPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/scheduler:plugin',
  requires: [
    IFileBrowserFactory,
    INotebookTracker,
    ITranslator,
    ILayoutRestorer,
    Scheduler.IAdvancedOptions,
    Scheduler.TelemetryHandler
  ],
  optional: [ILauncher],
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

const telemetry: JupyterFrontEndPlugin<Scheduler.TelemetryHandler> = {
  id: '@jupyterlab/scheduler:TelemetryHandler',
  autoStart: true,
  provides: Scheduler.TelemetryHandler,
  activate: (app: JupyterFrontEnd) => {
    return async (e: Scheduler.IEventLog) => {
      /*noop*/
    };
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

// Get only the file base name, with no parent directories and no extension,
// of the currently selected file.
function getSelectedFileBaseName(widget: FileBrowser | null): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }
  const parts = selectedItem.name.split('.');
  if (parts.length === 1) {
    // no extension
    return parts[0];
  }

  parts.splice(-1); // Remove the extension
  return parts.join('.');
}

// Get the file name, with all parent directories, of the currently selected file.
function getSelectedFilePath(widget: FileBrowser | null): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }
  return selectedItem.path;
}

// Get the containing directory of the file at a particular path.
function getDirectoryFromPath(path: string | null): string | null {
  if (path === null) {
    return null;
  }

  // Remove the final portion of the path, the filename.
  const directories = path.split('/');
  directories.pop();
  // Include a trailing slash only if there is at least one subdirectory.
  return directories.join('/') + (directories.length > 0 ? '/' : '');
}

function activatePlugin(
  app: JupyterFrontEnd,
  browserFactory: IFileBrowserFactory,
  notebookTracker: INotebookTracker,
  translator: ITranslator,
  restorer: ILayoutRestorer,
  advancedOptions: Scheduler.IAdvancedOptions,
  telemetryHandler: Scheduler.TelemetryHandler,
  launcher: ILauncher | null
): void {
  const trans = translator.load('jupyterlab');
  const api = new SchedulerService({});
  verifyServerExtension({ api, trans });

  const { commands } = app;
  const fileBrowserTracker = browserFactory.tracker;
  const widgetTracker = new WidgetTracker<MainAreaWidget<NotebookJobsPanel>>({
    namespace: 'jupyterlab-scheduler'
  });
  restorer.restore(widgetTracker, {
    command: CommandIDs.restoreLayout,
    args: widget => widget.content.model.toJson(),
    name: () => 'jupyterlab-scheduler'
  });

  let mainAreaWidget: MainAreaWidget<NotebookJobsPanel> | undefined;
  let jobsPanel: NotebookJobsPanel | undefined;

  const eventLogger: Scheduler.EventLogger = (eventName, eventDetail) => {
    if (!eventName) {
      return;
    }
    const eventLog: EventLog = {
      body: {
        name: `org.jupyter.jupyter-scheduler.${eventName}`
      },
      timestamp: new Date()
    };

    if (eventDetail) {
      eventLog.body.detail = eventDetail;
    }

    telemetryHandler(eventLog).then();
  };

  const showJobsPanel = async (data: IJobsModel) => {
    if (!mainAreaWidget || mainAreaWidget.isDisposed) {
      // Create new jobs panel widget
      jobsPanel = new NotebookJobsPanel({
        app,
        translator,
        eventLogger,
        advancedOptions: advancedOptions
      });
      // Create new main area widget
      mainAreaWidget = new MainAreaWidget<NotebookJobsPanel>({
        content: jobsPanel
      });
      mainAreaWidget.id = NotebookJobsPanelId;
      mainAreaWidget.title.icon = calendarMonthIcon;
      mainAreaWidget.title.label = trans.__('Notebook Jobs');
      mainAreaWidget.title.closable = true;
    }

    if (!widgetTracker.has(mainAreaWidget)) {
      // Track the state of the widget for later restoration
      widgetTracker.add(mainAreaWidget);
      mainAreaWidget.content.model.stateChanged.connect(() => {
        void widgetTracker.save(
          mainAreaWidget as MainAreaWidget<NotebookJobsPanel>
        );
      });
    }

    if (!mainAreaWidget.isAttached) {
      app.shell.add(mainAreaWidget, 'main');
    }

    mainAreaWidget.content.model.fromJson(data);
    mainAreaWidget.content.update();
    app.shell.activateById(mainAreaWidget.id);
  };

  // Commands

  commands.addCommand(CommandIDs.restoreLayout, {
    execute: async args => {
      showJobsPanel(args as IJobsModel);
    }
  });

  commands.addCommand(CommandIDs.createJobFileBrowser, {
    execute: async () => {
      eventLogger('file-browser.create-job');
      const widget = fileBrowserTracker.currentWidget;
      const filePath = getSelectedFilePath(widget) ?? '';

      // Update the job form inside the notebook jobs widget
      const newCreateModel = emptyCreateJobModel();
      newCreateModel.inputFile = filePath;
      newCreateModel.jobName = MakeNameValid(
        getSelectedFileBaseName(widget) ?? ''
      );
      newCreateModel.outputPath = getDirectoryFromPath(filePath) ?? '';

      await showJobsPanel({
        jobsView: JobsView.CreateForm,
        createJobModel: newCreateModel
      });
    },
    label: trans.__('Create Notebook Job'),
    icon: calendarAddOnIcon
  });

  commands.addCommand(CommandIDs.createJobCurrentNotebook, {
    execute: async () => {
      eventLogger('notebook-header.create-job');
      // Get the current notebook's name and path
      const contentsModel =
        notebookTracker.currentWidget?.context?.contentsModel;
      const filePath = contentsModel?.path ?? '';
      const fileName = contentsModel?.name ?? '';

      // Update the job form inside the notebook jobs widget
      const newCreateModel = emptyCreateJobModel();
      newCreateModel.inputFile = filePath;
      newCreateModel.jobName = MakeNameValid(fileName);
      newCreateModel.outputPath = getDirectoryFromPath(filePath) ?? '';

      await showJobsPanel({
        jobsView: JobsView.CreateForm,
        createJobModel: newCreateModel
      });
    },
    label: trans.__('Create a notebook job'),
    icon: calendarAddOnIcon
  });

  commands.addCommand(CommandIDs.deleteJob, {
    execute: async args => {
      const id = args['id'] as string;
      await api.deleteJob(id);
    },
    // TODO: Use args to name command dynamically
    label: trans.__('Delete Job')
  });

  commands.addCommand(CommandIDs.stopJob, {
    execute: async args => {
      const id = args['id'] as string;
      await api.setJobStatus(id, 'STOPPED');
    },
    // TODO: Use args to name command dynamically
    label: trans.__('Stop Job')
  });

  commands.addCommand(CommandIDs.downloadFiles, {
    execute: async args => {
      const id = args['id'] as string;
      const redownload = args['redownload'] as boolean;
      await api.downloadFiles(id, redownload);
    }
  });

  // Add to launcher
  if (launcher) {
    commands.addCommand(CommandIDs.listJobsFromLauncher, {
      execute: async () => {
        eventLogger('launcher.show-jobs');
        showJobsPanel({
          jobsView: JobsView.ListJobs
        });
      },
      label: trans.__('Notebook Jobs'),
      icon: eventNoteIcon
    });

    launcher.add({
      command: CommandIDs.listJobsFromLauncher,
      args: {
        launcher: true
      }
    });
  }
}

const plugins: JupyterFrontEndPlugin<any>[] = [
  schedulerPlugin,
  advancedOptions,
  telemetry
];

export { JobsView };
export default plugins;
