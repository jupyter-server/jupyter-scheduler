import { YDocument } from '@jupyter/ydoc';
import * as Y from 'yjs';
import { IWorkflowDoc, IWorkflowDocChange, StringChange } from './interfaces';
import { ISignal, Signal } from '@lumino/signaling';

export class WorkflowDoc
  extends YDocument<IWorkflowDocChange>
  implements IWorkflowDoc
{
  constructor() {
    super();

    this._name = this.ydoc.getText('name');
    this._previousName = this._name.toString();
    this._name.observe(this._nameObserver);
  }

  private _nameObserver = (event: Y.YTextEvent): void => {
    const oldValue = this._previousName;
    const newValue = this._name.toString();

    this._previousName = newValue;

    this._nameChanged.emit({ oldValue, newValue });
  };

  get nameChanged(): ISignal<IWorkflowDoc, StringChange> {
    return this._nameChanged;
  }

  get name(): string {
    return this._name.toString();
  }

  get version(): string {
    return '0.0.1';
  }

  getName(): string | undefined {
    return this.name;
  }

  setName(name: string): void {
    const currentLength = this._name.length;
    if (currentLength > 0) {
      this._name.delete(0, currentLength);
    }
    this._name.insert(0, name);
  }

  private _name: Y.Text;
  private _previousName: string;
  private _nameChanged = new Signal<IWorkflowDoc, StringChange>(this);
}
