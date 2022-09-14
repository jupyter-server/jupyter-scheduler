import React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import { ITranslator } from '@jupyterlab/translation';

import TranslatorContext from './context';
import { CreateJobForm, CreateJobFormState } from './create-job-form';
import { INotebookJobsListingModel } from './model';

import { NotebookJobsList } from './components/notebook-jobs-list';
import { NotebookJobsNavigation } from './components/notebook-jobs-navigation';

export type JobsPanelView = 'CreateJobForm' | 'JobsList';

export class NotebookJobsPanel extends ReactWidget {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _model: INotebookJobsListingModel;
  readonly _signal: Signal<any, CreateJobFormState>;
  readonly _translator: ITranslator;
  private _view: JobsPanelView;

  constructor(options: NotebookJobsPanel.IOptions) {
    super()
    this.addClass('jp-notebook-jobs-panel');
    const trans = options.translator.load('jupyterlab');

    this._title = options.title ?? trans.__('Notebook Jobs');
    this._description = options.description ?? trans.__('Job Runs');
    this._app = options.app;
    this._model = options.model;
    this._signal = options.updateCreateJobFormSignal;
    this._translator = options.translator;
    this._view = options.initialView || 'CreateJobForm';
  }

  set view(value: JobsPanelView) {
    this._view = value;
    this.update();
  }

  get createJobFormSignal(): Signal<any, CreateJobFormState> {
    return this._signal;
  }

  toggleView() {
    this.view = this._view === 'JobsList' ? 'CreateJobForm' : 'JobsList';
  }

  render(): JSX.Element {
    return (
      <TranslatorContext.Provider value={this._translator}>
          <NotebookJobsNavigation
            currentView={this._view}
            toggleSignal={this._signal}
            toggleFunction={() => this.toggleView()} />
        <div
          id='jp-create-job-form-container'
          style={{display: this._view === 'CreateJobForm' ? 'block' : 'none'}}>
          <UseSignal signal={this._signal}>
            {(_, newState) => <CreateJobForm
              initialState={newState!}
              cancelClick={() => this.toggleView()}
              postCreateJob={() => this.toggleView()} />}
          </UseSignal>
        </div>
        <div
          className="jp-notebook-jobs-list-container"
          style={{display: this._view === 'JobsList' ? 'block' : 'none'}}>
            <NotebookJobsList
              app={this._app}
              createJobFormSignal={this._signal}
              showCreateJob={() => this.toggleView()} />
        </div>
      </TranslatorContext.Provider>
    );
  }
}

namespace NotebookJobsPanel {
  export interface IOptions {
    title?: string;
    description?: string;
    model: INotebookJobsListingModel;
    app: JupyterFrontEnd;
    updateCreateJobFormSignal: Signal<any, CreateJobFormState>;
    translator: ITranslator;
    initialView?: JobsPanelView;
  }
}
