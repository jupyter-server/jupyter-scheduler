import { Signal } from '@lumino/signaling';
import { Scheduler } from './handler';
import { VDomModel } from '@jupyterlab/apputils';

export class NotebookJobsListingModel implements INotebookJobsListingModel {
  private _scheduled_jobs: Scheduler.IDescribeJob[];
  readonly scheduledJobsChanged: Signal<any, any>;
  readonly inProgressJobCountChanged: Signal<any, number>;
  public inProgressJobCount: number;

  constructor(scheduled_jobs: Scheduler.IDescribeJob[], next_token?: string) {
    const inProgressJobs = scheduled_jobs
      ? scheduled_jobs.filter(job => job.status === 'IN_PROGRESS')
      : [];
    this.inProgressJobCount = inProgressJobs.length;

    this._scheduled_jobs = scheduled_jobs;
    this.scheduledJobsChanged = new Signal(this);
    this.inProgressJobCountChanged = new Signal(this);
  }

  updateJobs(jobs: Scheduler.IDescribeJob[]): void {
    let jobsChanged = false;

    if (jobs.length !== this._scheduled_jobs.length) {
      jobsChanged = true;
    }
    if (!jobsChanged) {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const modelJob = this._scheduled_jobs[i];
        if (job.status !== modelJob.status) {
          jobsChanged = true;
          break;
        }
      }
    }
    if (jobsChanged) {
      this._scheduled_jobs = jobs;
      this.scheduledJobsChanged.emit(jobs);
    }
  }

  updatejobCount(jobCount: number): void {
    if (jobCount !== this.inProgressJobCount) {
      this.inProgressJobCount = jobCount;
      this.inProgressJobCountChanged.emit(jobCount);
    }
  }
}

export interface INotebookJobsWithToken {
  jobs: Scheduler.IDescribeJob[];
  next_token?: string;
  total_count: number;
}

export interface INotebookJobsListingModel {
  inProgressJobCount: number;
  inProgressJobCountChanged: Signal<any, number>;
  scheduledJobsChanged: Signal<any, INotebookJobsWithToken>;
}

// Revised models

// TODO: make these values enums
export type JobsView = 'CreateJob' | 'ListJobs' | 'JobDetail';
export type ListJobsView = 'Job' | 'JobDefinition';

export type IJobParameter = {
  name: string;
  value: string | number | boolean | undefined;
};

export interface IOutputFormat {
  readonly name: string;
  readonly label: string;
}

export interface ICreateJobModel {
  jobName: string;
  inputFile: string;
  outputPath: string;
  environment: string;
  // A "job" runs now; a "job definition" runs on a schedule
  createType: 'Job' | 'JobDefinition';
  runtimeEnvironmentParameters?: { [key: string]: number | string | boolean };
  parameters?: IJobParameter[];
  // List of values for output formats; labels are specified by the environment
  outputFormats?: string[];
  computeType?: string;
  idempotencyToken?: string;
  tags?: string[];
  // String for schedule in cron format
  schedule?: string;
  // String for timezone in tz database format
  timezone?: string;
  // "Easy scheduling" inputs
  // Intervals: 'minute' | 'hour' | 'day' | 'week' | 'weekday' | 'month' | 'custom'
  scheduleInterval: string;
  // Minute for an input that only accepts minutes (of the hour)
  scheduleMinuteInput?: string;
  scheduleHourMinute?: number;
  // Hour and minute for time inputs
  scheduleTimeInput?: string;
  scheduleMinute?: number;
  scheduleHour?: number;
  scheduleMonthDayInput?: string;
  scheduleMonthDay?: number;
  scheduleWeekDay?: string;
}

export interface IListJobsModel {
  listJobsView: ListJobsView;
}

export interface IDetailViewModel {
  detailType: 'Job' | 'JobDefinition';
  id: string;
}
export interface IJobDetailModel extends ICreateJobModel {
  jobId: string;
  status?: Scheduler.Status;
  statusMessage?: string;
  createTime?: number;
  updateTime?: number;
  startTime?: number;
  endTime?: number;
  outputPrefix?: string;
}

export interface IJobDefinitionModel extends ICreateJobModel {
  definitionId: string;
  name?: string;
  active?: boolean;
  createTime?: number;
  updateTime?: number;
  startTime?: number;
  endTime?: number;
  outputPrefix?: string;
}

const convertParameters = (parameters: {
  [key: string]: any;
}): IJobParameter[] =>
  Object.entries(parameters).map(([pName, pValue]) => {
    return {
      name: pName,
      value: pValue
    };
  });

// Convert an IDescribeJobModel to an IJobDetailModel
export function convertDescribeJobtoJobDetail(
  describeJob: Scheduler.IDescribeJob
): IJobDetailModel {
  // Convert parameters
  const jobParameters = convertParameters(describeJob.parameters ?? {});

  return {
    createType: 'Job',
    jobId: describeJob.job_id,
    jobName: describeJob.name ?? '',
    inputFile: describeJob.input_uri,
    outputPath: describeJob.output_uri,
    outputPrefix: describeJob.output_prefix,
    environment: describeJob.runtime_environment_name,
    runtimeEnvironmentParameters: describeJob.runtime_environment_parameters,
    parameters: jobParameters,
    outputFormats: describeJob.output_formats,
    computeType: describeJob.compute_type,
    idempotencyToken: describeJob.idempotency_token,
    tags: describeJob.tags,
    status: describeJob.status,
    statusMessage: describeJob.status_message,
    createTime: describeJob.create_time,
    updateTime: describeJob.update_time,
    startTime: describeJob.start_time,
    endTime: describeJob.end_time,
    scheduleInterval: 'weekday'
  };
}

export function convertDescribeDefinitiontoDefinition(
  describeDefinition: Scheduler.IDescribeJobDefinition
): IJobDefinitionModel {
  // Convert parameters
  const definitionParameters = convertParameters(
    describeDefinition.parameters ?? {}
  );

  return {
    name: describeDefinition.name ?? '',
    jobName: '',
    inputFile: describeDefinition.input_uri,
    createType: 'JobDefinition',
    definitionId: describeDefinition.job_definition_id,
    outputPath: describeDefinition.output_filename_template ?? '',
    outputPrefix: describeDefinition.output_prefix,
    environment: describeDefinition.runtime_environment_name,
    runtimeEnvironmentParameters:
      describeDefinition.runtime_environment_parameters,
    parameters: definitionParameters,
    outputFormats: describeDefinition.output_formats,
    computeType: describeDefinition.compute_type,
    tags: describeDefinition.tags,
    active: describeDefinition.active,
    createTime: describeDefinition.create_time,
    updateTime: describeDefinition.update_time,
    schedule: describeDefinition.schedule,
    timezone: describeDefinition.timezone,
    scheduleInterval: 'custom'
  };
}

export class JobsModel extends VDomModel {
  private _jobsView: JobsView = 'ListJobs';
  private _createJobModel: ICreateJobModel;
  private _listJobsModel: IListJobsModel;
  private _jobDetailModel: IDetailViewModel;
  /**
   * Callback that gets invoked whenever a model is updated. This should be used
   * to call `ReactWidget.renderDOM()` to synchronously update the VDOM rather
   * than triggering an async VDOM update via Lumino. See #34.
   */
  private _onModelUpdate?: () => unknown;
  private _jobCount: number;

  constructor(options: IJobsModelOptions) {
    super();
    this._jobsView = options.jobsView || 'ListJobs';
    this._createJobModel = options.createJobModel || Private.emptyCreateModel();
    this._listJobsModel = options.listJobsModel || { listJobsView: 'Job' };
    this._jobDetailModel = options.jobDetailModel || {
      detailType: 'Job',
      id: ''
    };
    this._onModelUpdate = options.onModelUpdate;
    this._jobCount = 0;
  }

  get jobsView(): JobsView {
    return this._jobsView;
  }

  set jobsView(view: JobsView) {
    this._jobsView = view;
    this.stateChanged.emit(void 0);
  }

  get createJobModel(): ICreateJobModel {
    return this._createJobModel;
  }

  set createJobModel(model: ICreateJobModel) {
    this._createJobModel = model;
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }

  get listJobsModel(): IListJobsModel {
    return this._listJobsModel;
  }

  set listJobsModel(model: IListJobsModel) {
    this._listJobsModel = model;
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }

  get jobDetailModel(): IDetailViewModel {
    return this._jobDetailModel;
  }

  set jobDetailModel(model: IDetailViewModel) {
    this._jobDetailModel = model;
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }

  get jobCount(): number {
    return this._jobCount;
  }

  set jobCount(count: number) {
    this._jobCount = count;
  }
}

export interface IJobsModelOptions {
  jobsView?: JobsView;
  createJobModel?: ICreateJobModel;
  listJobsModel?: IListJobsModel;
  jobDetailModel?: IDetailViewModel;
  onModelUpdate?: () => unknown;
}

namespace Private {
  export function emptyCreateModel(): ICreateJobModel {
    return {
      jobName: '',
      inputFile: '',
      outputPath: '',
      environment: '',
      createType: 'Job',
      scheduleInterval: 'weekday',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}
