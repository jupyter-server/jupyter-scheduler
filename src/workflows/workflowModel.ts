import { DocumentRegistry } from '@jupyterlab/docregistry';
import { PartialJSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { IWorkflowDoc } from './interfaces';
import { WorkflowDoc } from './workflowDoc';
import { Contents } from '@jupyterlab/services';

export interface IWorkflowModel extends DocumentRegistry.IModel {
  sharedModel: IWorkflowDoc;
}

export class WorkflowModel implements IWorkflowModel {
  constructor(options: DocumentRegistry.IModelOptions<IWorkflowDoc>) {
    this._sharedModel = options.sharedModel ?? this.createSharedModel();
    this._isDisposed = false;
    this._dirty = false;
    this._readOnly = false;

    // Listen to changes on the shared model
    this._sharedModel.nameChanged.connect(this._onNameChanged, this);
  }

  /**
   * Create a default shared model if one is not provided.
   */
  protected createSharedModel(): IWorkflowDoc {
    return new WorkflowDoc();
  }

  get sharedModel(): IWorkflowDoc {
    return this._sharedModel;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  set dirty(value: boolean) {
    this._dirty = value;
  }

  get readOnly(): boolean {
    return this._readOnly;
  }

  set readOnly(value: boolean) {
    this._readOnly = value;
  }

  get contentChanged(): ISignal<this, void> {
    return this._contentChanged;
  }

  get stateChanged(): ISignal<this, any> {
    return this._stateChanged;
  }

  /**
   * Convert the model to string (JSON in this case).
   * We only have a `name` field, so just return a JSON string with that.
   */
  toString(): string {
    const data = { name: this.sharedModel.getName() };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Load from a string. Assume it’s JSON with a `name` field.
   */
  fromString(data: string): void {
    const jsonData = JSON.parse(data);
    if (jsonData.name && typeof jsonData.name === 'string') {
      this.sharedModel.transact(() => {
        this.sharedModel.setName(jsonData.name);
      });
      this.dirty = true;
      this._contentChanged.emit(void 0);
    }
  }

  toJSON(): PartialJSONObject {
    return JSON.parse(this.toString());
  }

  fromJSON(data: PartialJSONObject): void {
    if (data.name && typeof data.name === 'string') {
      this.sharedModel.transact(() => {
        this.sharedModel.setName(data.name as string);
      });
      this.dirty = true;
      this._contentChanged.emit(void 0);
    }
  }

  initialize(): void {
    // No initialization needed for this simple example
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;

    // Disconnect signals
    this._sharedModel.nameChanged.disconnect(this._onNameChanged, this);

    Signal.clearData(this);
  }

  private _onNameChanged(): void {
    this.dirty = true;
    this._contentChanged.emit(void 0);
  }

  private _sharedModel: IWorkflowDoc;
  private _dirty: boolean;
  private _readOnly: boolean;
  private _isDisposed: boolean;

  private _contentChanged = new Signal<this, void>(this);
  private _stateChanged = new Signal<this, any>(this);

  readonly defaultKernelName = '';
  readonly defaultKernelLanguage = '';
}

export class WorkflowModelFactory
  implements DocumentRegistry.IModelFactory<WorkflowModel>
{
  //TODO: set conditionally
  readonly collaborative = true;

  get name(): string {
    return 'workflow-model-factory';
  }

  get contentType(): Contents.ContentType {
    return 'file';
  }

  get fileFormat(): Contents.FileFormat {
    return 'text';
  }

  get isDisposed(): boolean {
    return this._disposed;
  }

  dispose(): void {
    this._disposed = true;
  }

  preferredLanguage(path: string): string {
    return '';
  }

  createNew(
    options: DocumentRegistry.IModelOptions<IWorkflowDoc>
  ): WorkflowModel {
    const model = new WorkflowModel(options);
    return model;
  }

  private _disposed = false;
}
