import React from 'react';

import { ThemeProvider } from '@mui/material/styles';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { LabIcon } from '@jupyterlab/ui-components';

import { calendarMonthIcon } from './components/icons';
import TranslatorContext from './context';
import { CreateJob } from './mainviews/create-job';
import { NotebookJobsList } from './mainviews/list-jobs';
import { JobDetail } from './mainviews/job-detail';
import { ICreateJobModel, JobsModel } from './model';
import { getJupyterLabTheme } from './theme-provider';
import Scheduler from './tokens';

export class NotebookJobsPanel extends VDomRenderer<JobsModel> {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _translator: ITranslator;
  readonly _advancedOptions: React.ElementType;

  constructor(options: NotebookJobsPanel.IOptions) {
    super(options.model || new JobsModel({}));
    this.addClass('jp-notebook-jobs-panel');
    const trans = options.translator.load('jupyterlab');

    this.title.icon = options.titleIcon ?? calendarMonthIcon;
    this.title.caption = options.title ?? trans.__('Notebook Jobs');
    this._description = options.description ?? trans.__('Job Runs');
    this._app = options.app;
    this._translator = options.translator;
    this._advancedOptions = options.advancedOptions;

    this.node.setAttribute('role', 'region');
    this.node.setAttribute('aria-label', trans.__('Notebook Jobs'));
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
    const showCreateJob = (newModel: ICreateJobModel) => {
      this.model.createJobModel = newModel;

      this.model.jobsView = 'CreateJob';
    };

    return (
      <ThemeProvider theme={getJupyterLabTheme()}>
        <TranslatorContext.Provider value={this._translator}>
          {this.model.jobsView === 'CreateJob' && (
            <CreateJob
              model={this.model.createJobModel}
              modelChanged={newModel => (this.model.createJobModel = newModel)}
              toggleView={this.toggleView.bind(this)}
              advancedOptions={this._advancedOptions}
            />
          )}
          {this.model.jobsView === 'ListJobs' && (
            <NotebookJobsList
              app={this._app}
              model={this.model.listJobsModel}
              modelChanged={newModel => (this.model.listJobsModel = newModel)}
              showCreateJob={showCreateJob}
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
    titleIcon?: LabIcon;
    description?: string;
    app: JupyterFrontEnd;
    translator: ITranslator;
    advancedOptions: Scheduler.IAdvancedOptions;
    model?: JobsModel;
  }
}
