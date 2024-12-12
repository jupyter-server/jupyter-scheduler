import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { IWorkflowModel } from './workflowModel';

export class WorkflowWidget extends Widget {
  constructor(context: DocumentRegistry.IContext<IWorkflowModel>) {
    super();
    this.addClass('jp-WorkflowWidget');
    this._context = context;

    this._input = document.createElement('input');
    this._input.type = 'text';
    this._input.value = this._context.model.sharedModel.getName() ?? '';

    this._input.addEventListener('input', () => {
      // Update the shared model when the user types
      this._context.model.sharedModel.transact(() => {
        this._context.model.sharedModel.setName(this._input.value);
      });
    });

    this.node.appendChild(this._input);

    // Listen for remote changes
    this._context.model.sharedModel.nameChanged.connect(
      this._onNameChanged,
      this
    );

    // Listen to contentChanged
    this._context.model.contentChanged.connect(() => {
      console.log('Content changed, doc may have changed externally.');
    });
  }

  dispose(): void {
    super.dispose();
    this._context.model.sharedModel.nameChanged.disconnect(
      this._onNameChanged,
      this
    );
  }

  private _onNameChanged(): void {
    // Update the input value to reflect remote changes
    this._input.value = this._context.model.sharedModel.getName() ?? '';
  }

  private _context: DocumentRegistry.IContext<IWorkflowModel>;
  private _input: HTMLInputElement;
}

export class WorkflowWidgetFactory extends ABCWidgetFactory<
  Widget,
  IWorkflowModel
> {
  protected createNewWidget(
    context: DocumentRegistry.IContext<IWorkflowModel>
  ): Widget {
    return new WorkflowWidget(context);
  }
}
