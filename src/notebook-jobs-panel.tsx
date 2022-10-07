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
import { ICreateJobModel, JobsModel, ListJobsView } from './model';
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

  showListView(list: ListJobsView): void {
    this.model.listJobsModel.listJobsView = list;
    this.model.jobsView = 'ListJobs';
  }

  showDetailView(jobId: string): void {
    this.model.jobsView = 'JobDetail';
    this.model.jobDetailModel.detailType = 'Job';
    this.model.jobDetailModel.id = jobId;
  }

  showJobDefinitionDetail(jobDefId: string): void {
    this.model.jobsView = 'JobDetail';
    this.model.jobDetailModel.detailType = 'JobDefinition';
    this.model.jobDetailModel.id = jobDefId;
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
              handleModelChange={newModel =>
                (this.model.createJobModel = newModel)
              }
              showListView={this.showListView.bind(this)}
              advancedOptions={this._advancedOptions}
            />
          )}
          {this.model.jobsView === 'ListJobs' && (
            <NotebookJobsList
              app={this._app}
              model={this.model.listJobsModel}
              handleModelChange={newModel =>
                (this.model.listJobsModel = newModel)
              }
              showCreateJob={showCreateJob}
              showJobDetail={this.showDetailView.bind(this)}
              showJobDefinitionDetail={this.showJobDefinitionDetail.bind(this)}
            />
          )}
          {this.model.jobsView === 'JobDetail' && (
            <DetailView
              app={this._app}
              model={this.model.jobDetailModel}
              setCreateJobModel={newModel =>
                (this.model.createJobModel = newModel)
              }
              setJobsView={view => (this.model.jobsView = view)}
              setListJobsView={view => {
                this.model.listJobsModel.listJobsView = view;
              }}
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
