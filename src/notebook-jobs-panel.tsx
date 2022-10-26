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
import { ICreateJobModel, JobsModel, JobsView } from './model';
import { getJupyterLabTheme } from './theme-provider';
import { Scheduler } from './tokens';
import { DetailView } from './mainviews/detail-view';

export class NotebookJobsPanel extends VDomRenderer<JobsModel> {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _translator: ITranslator;
  readonly _advancedOptions: React.FunctionComponent<Scheduler.IAdvancedOptionsProps>;

  constructor(options: NotebookJobsPanel.IOptions) {
    super(
      options.model ||
        new JobsModel({
          onModelUpdate: () => {
            // allow us to invoke private parent method
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.renderDOM();
          }
        })
    );
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

  showListView(view: JobsView.ListJobs | JobsView.ListJobDefinitions): void {
    this.model.jobsView = view;
  }

  showDetailView(jobId: string): void {
    this.model.jobsView = JobsView.JobDetail;
    this.model.jobDetailModel.id = jobId;
  }

  showJobDefinitionDetail(jobDefId: string): void {
    this.model.jobsView = JobsView.JobDefinitionDetail;
    this.model.jobDetailModel.id = jobDefId;
  }

  render(): JSX.Element {
    const showCreateJob = (newModel: ICreateJobModel) => {
      this.model.createJobModel = newModel;
      this.model.jobsView = JobsView.CreateForm;
    };

    return (
      <ThemeProvider theme={getJupyterLabTheme()}>
        <TranslatorContext.Provider value={this._translator}>
          {this.model.jobsView === JobsView.CreateForm && (
            <CreateJob
              key={this.model.createJobModel.key}
              model={this.model.createJobModel}
              handleModelChange={newModel =>
                (this.model.createJobModel = newModel)
              }
              showListView={this.showListView.bind(this)}
              advancedOptions={this._advancedOptions}
            />
          )}
          {(this.model.jobsView === JobsView.ListJobs ||
            this.model.jobsView === JobsView.ListJobDefinitions) && (
            <NotebookJobsList
              app={this._app}
              listView={this.model.jobsView}
              showListView={this.showListView.bind(this)}
              showCreateJob={showCreateJob}
              showJobDetail={this.showDetailView.bind(this)}
              showJobDefinitionDetail={this.showJobDefinitionDetail.bind(this)}
            />
          )}
          {(this.model.jobsView === JobsView.JobDetail ||
            this.model.jobsView === JobsView.JobDefinitionDetail) && (
            <DetailView
              app={this._app}
              model={this.model.jobDetailModel}
              setCreateJobModel={newModel =>
                (this.model.createJobModel = newModel)
              }
              jobsView={this.model.jobsView}
              setJobsView={view => (this.model.jobsView = view)}
              showCreateJob={showCreateJob}
              showJobDetail={this.showDetailView.bind(this)}
              advancedOptions={this._advancedOptions}
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
