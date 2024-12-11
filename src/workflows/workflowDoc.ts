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
    this._name.observe(this._nameObserver);
  }

  private _nameObserver = (event: Y.YTextEvent): void => {
    this._nameChanged.emit({ newValue: 'WOW NEW VALUE' });
  };

  private _name: Y.Text;
  private _nameChanged = new Signal<IWorkflowDoc, StringChange>(this);
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
    const newName = new Y.Text();
    newName.insert(0, name);
    this._name = newName;
  }
}
