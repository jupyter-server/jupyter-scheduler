import { DocumentChange, StateChange, YDocument } from '@jupyter/ydoc';
import { ISignal } from '@lumino/signaling';

export interface IWorkflowDoc extends YDocument<IWorkflowDocChange> {
  name: string;

  getName(): string | undefined;
  setName(name: string): void;

  nameChanged: ISignal<IWorkflowDoc, StringChange>;
}

export interface IWorkflowDocChange extends DocumentChange {
  nameChange?: StringChange;
  stateChange?: StateChange<any>[];
}

export type StringChange = {
  oldValue?: string;
  newValue?: string;
};
