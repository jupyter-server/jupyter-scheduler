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
  translator: ITranslator;
}) {
  const trans = props.translator.load('jupyterlab');
  try {
    await props.api.getJobs({ max_items: 0 });
  } catch (e: unknown) {
    // in case of 404, show missing server extension dialog and return
    if (
      e instanceof ServerConnection.ResponseError &&
      e.response.status === 404
    ) {
      showDialog({
        title: trans.__('Jupyter Scheduler server extension not found'),
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
    Scheduler.TelemetryHandler
  ],
  optional: [
    ILauncher,
    Scheduler.IAdvancedOptionsOverride,
    Scheduler.IAdvancedOptions
  ],
  autoStart: true,
  activate: activatePlugin
};
const advancedOptions: JupyterFrontEndPlugin<Scheduler.IAdvancedOptions> = {
  id: '@jupyterlab/scheduler:IAdvancedOptions', 
  autoStart: true,
  provides: Scheduler.IAdvancedOptions,
  activate: (app: JupyterFrontEnd) => {
    console.log('🔄 DEFAULT jupyter-scheduler advanced options plugin is activating');
    console.log('   Plugin ID: @jupyterlab/scheduler:IAdvancedOptions');
    console.log('   Note: This should be disabled by K8s extension via disabledExtensions');
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
  const firstItem = widget.selectedItems().next()?.value;
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

/**
 * Get the file name of the currently selected file with all parent directories, check
 * for and remove "RTC" drive prefix potentially added by jupyter-collaboration.
 */
function getSelectedFilePath(
  widget: FileBrowser | null,
  contents: Contents.IManager
): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }
  return getLocalPath(selectedItem.path, contents);
}

/**
 * Checks if path contains "RTC" drive prefix potentially added by jupyter-collaboration
 * and returns a local path removing "RTC" prefix if needed
 */
export function getLocalPath(
  path: string,
  contents: Contents.IManager
): string {
  if (contents.driveName(path) === 'RTC') {
    return contents.localPath(path);
  }
  return path;
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
  telemetryHandler: Scheduler.TelemetryHandler,
  launcher: ILauncher | null,
  advancedOptionsOverride: Scheduler.IAdvancedOptions | null,
  advancedOptionsDefault: Scheduler.IAdvancedOptions | null
): void {
  console.log('🔍 SCHEDULER PLUGIN ADVANCED OPTIONS RESOLUTION:');
  console.log('   Override token expected:', Scheduler.IAdvancedOptionsOverride);
  console.log('   Override received:', advancedOptionsOverride);
  console.log('   Default received:', advancedOptionsDefault);
  
  // Use override if available, otherwise use default
  const advancedOptions = advancedOptionsOverride || advancedOptionsDefault;
  console.log('   Using:', advancedOptions);
  
  const trans = translator.load('jupyterlab');
  const api = new SchedulerService({});
  verifyServerExtension({ api, translator });

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
        advancedOptions: advancedOptions || AdvancedOptions
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
      const filePath =
        getSelectedFilePath(widget, app.serviceManager.contents) ?? '';

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
      // Get the current notebook's path and name
      const widget = fileBrowserTracker.currentWidget;
      const filePath =
        getSelectedFilePath(widget, app.serviceManager.contents) ?? '';
      const fileName = getSelectedFileBaseName(widget) ?? '';

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

console.log('📦 DEFAULT jupyter-scheduler extension is being loaded...');
console.log('   Plugins: schedulerPlugin, advancedOptions, telemetry');

const plugins: JupyterFrontEndPlugin<any>[] = [
  schedulerPlugin,
  advancedOptions,
  telemetry
];

export { JobsView };
export default plugins;
