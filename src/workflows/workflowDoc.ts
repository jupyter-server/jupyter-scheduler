import { YDocument } from '@jupyter/ydoc';
import { Text as YText, Doc as YDoc } from 'yjs';
import { IWorkflowDoc, IWorkflowDocChange, StringChange } from './interfaces';
import { ISignal, Signal } from '@lumino/signaling';

export class WorkflowDoc
  extends YDocument<IWorkflowDocChange>
  implements IWorkflowDoc
{
  private _name: YText;
  private _nameChanged = new Signal<IWorkflowDoc, StringChange>(this);

  constructor() {
    super();

    this._name = this.ydoc.getText('name');
  }

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
    const newName = new YText();
    newName.insert(0, name);
    this._name = newName;
  }
}
