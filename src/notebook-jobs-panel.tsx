import React from 'react';

import { ThemeProvider } from '@mui/material/styles';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import { ITranslator } from '@jupyterlab/translation';

import TranslatorContext from './context';
import {
  BlankCreateJobFormState,
  CreateJobForm,
  CreateJobFormState
} from './create-job-form';
import { INotebookJobsListingModel } from './model';

import { NotebookJobsList } from './components/notebook-jobs-list';
import { getJupyterLabTheme } from './theme-provider';

export type JobsPanelView = 'CreateJob' | 'ListJobs';

export class NotebookJobsPanel extends ReactWidget {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _model: INotebookJobsListingModel;
  readonly _signal: Signal<any, CreateJobFormState>;
  readonly _translator: ITranslator;
  private _view: JobsPanelView;

  constructor(options: NotebookJobsPanel.IOptions) {
    super();
    this.addClass('jp-notebook-jobs-panel');
    const trans = options.translator.load('jupyterlab');

    this._title = options.title ?? trans.__('Notebook Jobs');
    this._description = options.description ?? trans.__('Job Runs');
    this._app = options.app;
    this._model = options.model;
    this._signal = options.updateCreateJobFormSignal;
    this._translator = options.translator;
    this._view = options.initialView || 'CreateJob';
  }

  get view(): JobsPanelView {
    return this._view;
  }

  set view(value: JobsPanelView) {
    this._view = value;
    this.update();
  }

  get createJobFormSignal(): Signal<any, CreateJobFormState> {
    return this._signal;
  }

  changeView(view: JobsPanelView): void {
    this.view = view;
  }

  render(): JSX.Element {
    return (
      <ThemeProvider theme={getJupyterLabTheme()}>
        <TranslatorContext.Provider value={this._translator}>
          {this.view === 'CreateJob' && (
            <UseSignal signal={this._signal}>
              {(_, newState) => (
                <CreateJobForm
                  initialState={newState ?? BlankCreateJobFormState}
                  cancelClick={() => this.changeView('ListJobs')}
                  postCreateJob={() => this.changeView('ListJobs')}
                />
              )}
            </UseSignal>
          )}
          {this.view === 'ListJobs' && (
            <NotebookJobsList
              app={this._app}
              createJobFormSignal={this._signal}
              showCreateJob={() => this.changeView('CreateJob')}
            />
          )}
        </TranslatorContext.Provider>
      </ThemeProvider>
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
