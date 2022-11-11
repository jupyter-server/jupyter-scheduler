import React from 'react';

import { ThemeProvider } from '@mui/material/styles';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import { LabIcon } from '@jupyterlab/ui-components';

import { ErrorBoundary } from './components/error-boundary';
import { calendarMonthIcon } from './components/icons';

import { CreateJob } from './mainviews/create-job';
import { DetailView } from './mainviews/detail-view';
import { CreateJobFromDefinition } from './mainviews/create-job-from-definition';
import { EditJobDefinition } from './mainviews/edit-job-definition';
import { NotebookJobsList } from './mainviews/list-jobs';

import TranslatorContext from './context';
import {
  defaultScheduleFields,
  ICreateJobModel,
  IJobDefinitionModel,
  JobsModel,
  JobsView
} from './model';
import { getJupyterLabTheme } from './theme-provider';
import { Scheduler } from './tokens';

export class NotebookJobsPanel extends VDomRenderer<JobsModel> {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _translator: ITranslator;
  readonly _trans: TranslationBundle;
  readonly _advancedOptions: React.FunctionComponent<Scheduler.IAdvancedOptionsProps>;
  private _newlyCreatedId: string | undefined;
  private _newlyCreatedName: string | undefined;

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
    this._trans = this._translator.load('jupyterlab');
    this._advancedOptions = options.advancedOptions;

    this.node.setAttribute('role', 'region');
    this.node.setAttribute('aria-label', trans.__('Notebook Jobs'));
  }

  showListView(
    view: JobsView.ListJobs | JobsView.ListJobDefinitions,
    newlyCreatedId?: string,
    newlyCreatedName?: string
  ): void {
    this._newlyCreatedId = newlyCreatedId;
    this._newlyCreatedName = newlyCreatedName;
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

  editJobDefinition(jobDef: IJobDefinitionModel): void {
    this.model.jobsView = JobsView.EditJobDefinition;
    this.model.updateJobDefinitionModel = {
      definitionId: jobDef.definitionId,
      name: jobDef.name,
      environment: jobDef.environment,
      ...defaultScheduleFields,
      // TODO: should these properties really be optional?
      schedule: jobDef.schedule || '* * * * *',
      timezone: jobDef.timezone || 'UTC',
      scheduleInterval: 'custom'
    };
  }

  render(): JSX.Element {
    const showCreateJob = (newModel: ICreateJobModel) => {
      this.model.createJobModel = newModel;
      this.model.jobsView = JobsView.CreateForm;
    };

    return (
      <ThemeProvider theme={getJupyterLabTheme()}>
        <TranslatorContext.Provider value={this._translator}>
          <ErrorBoundary
            alertTitle={this._trans.__('Internal error')}
            alertMessage={this._trans.__(
              'We encountered an internal error. Please try your command again.'
            )}
            detailTitle={this._trans.__('Error details')}
          >
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
            {this.model.jobsView === JobsView.CreateFromJobDescriptionForm && (
              <CreateJobFromDefinition
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
                showJobDefinitionDetail={this.showJobDefinitionDetail.bind(
                  this
                )}
                newlyCreatedId={this._newlyCreatedId}
                newlyCreatedName={this._newlyCreatedName}
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
                editJobDefinition={this.editJobDefinition.bind(this)}
                advancedOptions={this._advancedOptions}
              />
            )}
            {this.model.jobsView === JobsView.EditJobDefinition && (
              <EditJobDefinition
                model={this.model.updateJobDefinitionModel}
                handleModelChange={newModel =>
                  (this.model.updateJobDefinitionModel = newModel)
                }
                showListView={this.showListView.bind(this)}
                showJobDefinitionDetail={this.showJobDefinitionDetail.bind(
                  this
                )}
              />
            )}
          </ErrorBoundary>
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
