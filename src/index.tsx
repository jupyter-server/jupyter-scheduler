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
  export const showNotebookJobs = 'scheduling:show-notebook-jobs';
  export const stopJob = 'scheduling:stop-job';
  export const downloadFiles = 'scheduling:download-files';
}

export const NotebookJobsPanelId = 'notebook-jobs-panel';
export { Scheduler } from './tokens';

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
    Scheduler.IAdvancedOptions
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
  launcher: ILauncher | null
): void {
  const { commands } = app;
  const trans = translator.load('jupyterlab');
  const fileBrowserTracker = browserFactory.tracker;
  const api = new SchedulerService({});
  verifyServerExtension({ api, translator });
  const widgetTracker = new WidgetTracker<MainAreaWidget<NotebookJobsPanel>>({
    namespace: 'jupyterlab-scheduler'
  });
  restorer.restore(widgetTracker, {
    command: CommandIDs.showNotebookJobs,
    args: widget => widget.content.model.toJson(),
    name: () => 'jupyterlab-scheduler'
  });

  let mainAreaWidget: MainAreaWidget<NotebookJobsPanel> | undefined;
  let jobsPanel: NotebookJobsPanel | undefined;

  const showJobsPanel = async (data: IJobsModel) => {
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

  commands.addCommand(CommandIDs.showNotebookJobs, {
    execute: async args => showJobsPanel(args as IJobsModel),
    label: trans.__('Notebook Jobs'),
    icon: eventNoteIcon
  });

  commands.addCommand(CommandIDs.createJobFileBrowser, {
    execute: async () => {
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
    launcher.add({
      command: CommandIDs.showNotebookJobs
    });
  }
}

const plugins: JupyterFrontEndPlugin<any>[] = [
  schedulerPlugin,
  advancedOptions
];

export { JobsView };
export default plugins;
