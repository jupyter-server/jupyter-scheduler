import React from 'react';

import { ThemeProvider } from '@mui/material/styles';
import { getJupyterLabTheme } from './theme-provider';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';

import TranslatorContext from './context';
import { CreateJob } from './mainviews/create-job';
import { JobsModel } from './model';

import { NotebookJobsList } from './mainviews/list-jobs';
import { JobDetail } from './mainviews/job-detail';

export class NotebookJobsPanel extends VDomRenderer<JobsModel> {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _translator: ITranslator;

  constructor(options: NotebookJobsPanel.IOptions) {
    super(options.model || new JobsModel({}));
    this.addClass('jp-notebook-jobs-panel');
    const trans = options.translator.load('jupyterlab');

    this._title = options.title ?? trans.__('Notebook Jobs');
    this._description = options.description ?? trans.__('Job Runs');
    this._app = options.app;
    this._translator = options.translator;
  }

  toggleView(): void {
    if (
      this.model.jobsView !== 'CreateJob' &&
      this.model.jobsView !== 'ListJobs'
    ) {
      return;
    }

    this.model.jobsView =
      this.model.jobsView === 'ListJobs' ? 'CreateJob' : 'ListJobs';
  }

  render(): JSX.Element {
    return (
      <ThemeProvider theme={getJupyterLabTheme()}>
        <TranslatorContext.Provider value={this._translator}>
          {this.model.jobsView === 'CreateJob' && (
            <CreateJob
              model={this.model.createJobModel}
              modelChanged={newModel => (this.model.createJobModel = newModel)}
              toggleView={this.toggleView.bind(this)}
            />
          )}
          {this.model.jobsView === 'ListJobs' && (
            <NotebookJobsList
              app={this._app}
              model={this.model.listJobsModel}
              modelChanged={newModel => (this.model.listJobsModel = newModel)}
              showCreateJob={() => (this.model.jobsView = 'CreateJob')}
            />
          )}
          {this.model.jobsView === 'JobDetail' && (
            <JobDetail
              model={this.model.jobDetailModel}
              modelChanged={newModel => (this.model.jobDetailModel = newModel)}
              setView={view => (this.model.jobsView = view)}
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
    app: JupyterFrontEnd;
    translator: ITranslator;
    model?: JobsModel;
  }
}
