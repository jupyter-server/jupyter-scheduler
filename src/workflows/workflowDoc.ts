import { YDocument } from '@jupyter/ydoc';
import * as Y from 'yjs';
import { Workflow, Task } from './_interface/workflow.schema';

export class WorkflowDoc extends YDocument<WorkflowChange> implements Workflow {
  private _tasks: Y.Array<Y.Map<any>>;
  private _name: Y.Text;
  private _parameters: Y.Map<string>;
  private _schedule: Y.Text;
  private _timezone: Y.Text;

  constructor() {
    super();

    this._tasks = this.ydoc.getArray<Y.Map<any>>('tasks');
    this._name = this.ydoc.getText('name');
    this._parameters = this.ydoc.getMap<string>('parameters');
    this._schedule = this.ydoc.getText('schedule');
    this._timezone = this.ydoc.getText('timezone');

    this._tasks.observeDeep(this._tasksObserver);
    //TODO: add other observers
  }

  // Getter and setter methods
  get tasks(): Task[] {
    return this._tasks.map(task => task.toJSON() as Task);
  }

  set tasks(value: Task[]) {
    this.transact(() => {
      this._tasks.delete(0, this._tasks.length);
      value.forEach(task => {
        this._tasks.push([Y.Map.from(Object.entries(task))]);
      });
    });
  }

  //TODO: add other getters/setters

  private _tasksObserver = (events: Y.YEvent<any>[]) => {
    // TODO: Handle task changes
  };
}
