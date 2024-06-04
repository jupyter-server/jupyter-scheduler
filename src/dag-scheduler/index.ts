import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  Dialog,
  InputDialog,
  IThemeManager,
  MainAreaWidget,
  showDialog,
  WidgetTracker
} from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { FileBrowser, IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Contents, ServerConnection } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { workflowsIcon } from './components/icons';
import { WorkflowsService } from './handler';
import { IJobsModel, JobsView, emptyCreateTaskModel } from './model';
import { WorkflowsPanel } from './widget';
import { SERVER_EXTENSION_404_JSX } from './util/errors';
import { MakeNameValid } from './util/job-name-validation';
import {
  PartialJSONObject,
  ReadonlyPartialJSONObject
} from '@lumino/coreutils';
import { generateFileName } from './util';
import { map } from '@lumino/algorithm';

export { Workflows } from './tokens';

export namespace CommandIDs {
  export const createJobFileBrowser = 'workflows:create-from-filebrowser';
  export const createJobCurrentNotebook = 'workflows:create-from-notebook';
  export const showNotebookWorkflows = 'workflows:show-notebook-workflows';
}

const PLUGIN_ID = '@jupyterlab/scheduler-workflows:plugin';

export const WorkflowsPanelId = 'workflows-panel';

/**
 * Initialization data for the jupyterlab-scheduler extension.
 */
export const WorkflowsPlugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  requires: [
    IFileBrowserFactory,
    INotebookTracker,
    IDocumentManager,
    ITranslator,
    ILayoutRestorer,
    IEditorServices,
    IThemeManager
  ],
  optional: [ILauncher],
  autoStart: true,
  activate: activatePlugin
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

  return firstItem.value;
}

// Get the file name, with all parent directories, of the currently selected file.
function getSelectedFilePath(widget: FileBrowser | null): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }
  return selectedItem.path;
}

function removeFileExtension(name: string) {
  const parts = name.split('.');

  if (parts.length === 1) {
    // no extension
    return parts[0];
  }

  parts.splice(-1); // Remove the extension

  return parts.join('.');
}

// Get only the file base name, with no parent directories and no extension,
// of the currently selected file.
function getSelectedFileBaseName(widget: FileBrowser | null): string | null {
  const selectedItem = getSelectedItem(widget);
  if (selectedItem === null) {
    return null;
  }

  return removeFileExtension(selectedItem.name);
}

async function activatePlugin(
  app: JupyterFrontEnd,
  browserFactory: IFileBrowserFactory,
  notebookTracker: INotebookTracker,
  docManager: IDocumentManager,
  translator: ITranslator,
  restorer: ILayoutRestorer,
  editorService: IEditorServices,
  themeManager: IThemeManager,
  launcher: ILauncher | null
): Promise<void> {
  const api = new WorkflowsService({});
  const trans = translator.load('jupyterlab');

  // Call API to verify that the server extension is actually installed
  try {
    await api.getJobs({ max_items: 0 });
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
      // return;
    }
  }

  const { commands } = app;
  const fileBrowserTracker = browserFactory.tracker;
  const widgetTracker = new WidgetTracker<MainAreaWidget<WorkflowsPanel>>({
    namespace: 'jupyterlab-workflows'
  });

  // Restore only the List view always
  restorer.restore(widgetTracker, {
    name: () => 'jupyterlab-workflows',
    command: CommandIDs.showNotebookWorkflows,
    args: () =>
      ({
        key: Date.now(),
        createTaskModel: emptyCreateTaskModel(),
        jobsView: JobsView.ListJobDefinitions
      } as unknown as PartialJSONObject)
  });

  let workflowsPanel: WorkflowsPanel | undefined;
  let mainAreaWidget: MainAreaWidget<WorkflowsPanel> | undefined;

  themeManager.themeChanged.connect(() => {
    workflowsPanel?.updateTheme();
    workflowsPanel?.update();
  });

  const showWorkflowsPanel = async (data: IJobsModel) => {
    const showMainWidget = () => {
      if (!mainAreaWidget || mainAreaWidget.isDisposed) {
        // Create new workflows panel widget
        workflowsPanel = new WorkflowsPanel({
          app,
          translator,
          key: data.key,
          jobsView: data.jobsView,
          contents: docManager.services.contents,
          editorFactory: editorService.factoryService.newInlineEditor
        });

        // Create new main area widget
        mainAreaWidget = new MainAreaWidget<WorkflowsPanel>({
          content: workflowsPanel
        });

        mainAreaWidget.id = WorkflowsPanelId;
        mainAreaWidget.title.closable = true;
        mainAreaWidget.title.icon = workflowsIcon;
        mainAreaWidget.title.label = trans.__('Notebook Workflows panel');
      }

      if (!widgetTracker.has(mainAreaWidget)) {
        // Track the state of the widget for later restoration
        widgetTracker.add(mainAreaWidget);

        mainAreaWidget.content.model.stateChanged.connect(() => {
          void widgetTracker.save(
            mainAreaWidget as MainAreaWidget<WorkflowsPanel>
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

    if (data.createTaskModel?.input_uri) {
      docManager.services.contents
        .get(data.createTaskModel.input_uri)
        .then(({ content }: Contents.IModel['content']) => {
          const cellParams =
            content.cells?.flatMap((cell: any) => cell.metadata?.tags || []) ||
            [];

          data.createTaskModel.kernelSpecId =
            content.metadata?.kernelspec?.name;

          data.cellParams = cellParams;

          showMainWidget();
        });

      return;
    }

    showMainWidget();
  };

  // Commands
  commands.addCommand(CommandIDs.showNotebookWorkflows, {
    execute: async args => showWorkflowsPanel(args as unknown as IJobsModel),
    label: trans.__('Notebook Workflows'),
    icon: workflowsIcon
  });

  commands.addCommand(CommandIDs.createJobFileBrowser, {
    execute: async () => {
      const widget = fileBrowserTracker.currentWidget;
      const filePath = getSelectedFilePath(widget) ?? '';

      // Update the job form inside the notebook jobs widget
      const newCreateModel = emptyCreateTaskModel();

      newCreateModel.input_uri = filePath;
      newCreateModel.name = MakeNameValid(
        getSelectedFileBaseName(widget) ?? ''
      );

      await showWorkflowsPanel({
        key: Date.now(),
        jobsView: JobsView.CreateForm,
        createTaskModel: newCreateModel
      });
    },
    label: trans.__('Create Notebook Workflow'),
    icon: workflowsIcon
  });

  commands.addCommand(CommandIDs.createJobCurrentNotebook, {
    execute: async () => {
      // Get the current notebook's name and path
      const contentsModel =
        notebookTracker.currentWidget?.context?.contentsModel;
      const filePath = contentsModel?.path ?? '';
      const fileName = contentsModel?.name ?? '';

      // Update the job form inside the notebook jobs widget
      const newCreateModel = emptyCreateTaskModel();

      newCreateModel.input_uri = filePath;
      newCreateModel.name = MakeNameValid(removeFileExtension(fileName));

      await showWorkflowsPanel({
        key: Date.now(),
        jobsView: JobsView.CreateForm,
        createTaskModel: newCreateModel
      });
    },
    label: trans.__('Create Notebook workflow'),
    icon: workflowsIcon
  });

  commands.addCommand('workflows:saveFile', {
    execute: async (args: ReadonlyPartialJSONObject) => {
      const { fileId, fileName } = args as any;
      const defaultBrowser = browserFactory.createFileBrowser(
        'workflows-file-browser'
      );

      const tempName = generateFileName(
        fileName,
        Array.from(map(defaultBrowser.model.items(), v => v.name))
      );

      const result = await InputDialog.getText({
        title: 'Save as',
        text: tempName
      });

      if (!result.value) {
        return null;
      }

      api.download({ id: fileId, path: result.value });
    }
  });

  // Add to launcher
  if (launcher) {
    launcher.add({
      command: CommandIDs.showNotebookWorkflows
    });
  }
}

export { JobsView };
