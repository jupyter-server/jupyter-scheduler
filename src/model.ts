import { Signal } from '@lumino/signaling';
import { PartialJSONObject } from '@lumino/coreutils';
import { Scheduler } from './handler';
import { VDomModel } from '@jupyterlab/apputils';

/**
 * Top-level models
 */

export enum JobsView {
  // assignment ensures any enum value is always truthy
  CreateForm = 1,
  CreateFromJobDescriptionForm,
  ListJobs,
  ListJobDefinitions,
  JobDetail,
  JobDefinitionDetail,
  EditJobDefinition
}

export type IJobParameter = {
  name: string;
  value: string | number | boolean | undefined;
};

export interface IOutputFormat {
  readonly name: string;
  readonly label: string;
}

/**
 * Extended by models which back UIs using the <ScheduleInputs /> component.
 */
export type ModelWithScheduleFields = {
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
};

export interface ICreateJobModel
  extends ModelWithScheduleFields,
    PartialJSONObject {
  /**
   * Key of the CreateJob component. When changed, this forces a re-mount.
   */
  key?: number;
  jobName: string;
  inputFile: string;
  environment: string;
  // If creating a job from a job definition, the job definition ID to use.
  jobDefinitionId?: string;
  // A "job" runs now; a "job definition" runs on a schedule
  createType: 'Job' | 'JobDefinition';
  // Errors from creation
  createError?: string;
  runtimeEnvironmentParameters?: { [key: string]: number | string | boolean };
  parameters?: IJobParameter[];
  // List of values for output formats; labels are specified by the environment
  outputFormats?: string[];
  computeType?: string;
  idempotencyToken?: string;
  tags?: string[];
  // Is the create button disabled due to a submission in progress?
  createInProgress?: boolean;
}

export function emptyCreateJobModel(): ICreateJobModel {
  return {
    key: Math.random(),
    jobName: '',
    inputFile: '',
    outputPath: '',
    environment: '',
    createType: 'Job',
    scheduleInterval: 'weekday',
    schedule: '0 0 * * MON-FRI',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

export interface IUpdateJobDefinitionModel
  extends ModelWithScheduleFields,
    PartialJSONObject {
  definitionId: string;
  name?: string;
}

export function emptyUpdateJobDefinitionModel(): IUpdateJobDefinitionModel {
  return {
    definitionId: '',
    schedule: '',
    scheduleInterval: 'custom'
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IListJobsModel extends PartialJSONObject {
  /* reserved */
}

export function emptyListJobsModel(): IListJobsModel {
  return {};
}

export interface IDetailViewModel extends PartialJSONObject {
  id: string;
}

export function emptyDetailViewModel(): IDetailViewModel {
  return {
    id: ''
  };
}

export interface IJobsModel extends PartialJSONObject {
  jobsView: JobsView;
  createJobModel?: ICreateJobModel;
  listJobsModel?: IListJobsModel;
  jobDetailModel?: IDetailViewModel;
  updateJobDefinitionModel?: IUpdateJobDefinitionModel;
}

export class JobsModel extends VDomModel {
  private _jobsView: JobsView = JobsView.ListJobs;
  private _createJobModel: ICreateJobModel;
  private _listJobsModel: IListJobsModel;
  private _jobDetailModel: IDetailViewModel;
  private _updateJobDefinitionModel: IUpdateJobDefinitionModel;
  /**
   * Callback that gets invoked whenever a model is updated. This should be used
   * to call `ReactWidget.renderDOM()` to synchronously update the VDOM rather
   * than triggering an async VDOM update via Lumino. See #34.
   */
  private _onModelUpdate?: () => unknown;
  private _jobCount: number;

  constructor(options: IJobsModelOptions) {
    super();
    this._jobsView = JobsView.ListJobs;
    this._createJobModel = emptyCreateJobModel();
    this._listJobsModel = emptyListJobsModel();
    this._jobDetailModel = emptyDetailViewModel();
    this._updateJobDefinitionModel = emptyUpdateJobDefinitionModel();
    this._onModelUpdate = options.onModelUpdate;
    this._jobCount = 0;
  }

  get jobsView(): JobsView {
    return this._jobsView;
  }

  set jobsView(view: JobsView) {
    this._jobsView = view;
    this._onModelUpdate?.();
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

  get updateJobDefinitionModel(): IUpdateJobDefinitionModel {
    return this._updateJobDefinitionModel;
  }

  set updateJobDefinitionModel(model: IUpdateJobDefinitionModel) {
    this._updateJobDefinitionModel = model;
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }

  get jobCount(): number {
    return this._jobCount;
  }

  set jobCount(count: number) {
    this._jobCount = count;
  }

  toJson(): IJobsModel {
    const data = {
      jobsView: this.jobsView,
      createJobModel: this.createJobModel,
      listJobsModel: this.listJobsModel,
      jobDetailModel: this.jobDetailModel,
      updateJobDefinitionModel: this.updateJobDefinitionModel
    };
    return data;
  }

  fromJson(data: IJobsModel): void {
    this._jobsView = data.jobsView ?? JobsView.ListJobs;
    this._createJobModel = data.createJobModel ?? emptyCreateJobModel();
    this._listJobsModel = data.listJobsModel ?? emptyListJobsModel();
    this._jobDetailModel = data.jobDetailModel ?? emptyDetailViewModel();
    this._updateJobDefinitionModel =
      data.updateJobDefinitionModel ?? emptyUpdateJobDefinitionModel();

    // emit state changed signal
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }
}

export interface IJobsModelOptions {
  onModelUpdate?: () => unknown;
}

/**
 * Describe and Detail models
 */

export interface IJobDetailModel {
  jobName: string;
  inputFile: string;
  environment: string;
  // Errors from creation
  createError?: string;
  runtimeEnvironmentParameters?: { [key: string]: number | string | boolean };
  parameters?: IJobParameter[];
  // List of values for output formats; labels are specified by the environment
  outputFormats?: string[];
  computeType?: string;
  idempotencyToken?: string;
  tags?: string[];
  jobId: string;
  status?: Scheduler.Status;
  statusMessage?: string;
  createTime?: number;
  updateTime?: number;
  startTime?: number;
  endTime?: number;
  outputPrefix?: string;
  job_files: { [key: string]: string }[];
  downloaded: boolean;
}

export interface IJobDefinitionModel {
  inputFile: string;
  outputPath: string;
  environment: string;
  // Errors from creation
  createError?: string;
  runtimeEnvironmentParameters?: { [key: string]: number | string | boolean };
  parameters?: IJobParameter[];
  // List of values for output formats; labels are specified by the environment
  outputFormats?: string[];
  computeType?: string;
  tags?: string[];
  // String for schedule in cron format
  schedule?: string;
  // String for timezone in tz database format
  timezone?: string;
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

  const convertJobFilesToJson = (files: Scheduler.IJobFile[]) => {
    return files.map(file => {
      return {
        display_name: file.display_name,
        file_format: file.file_format,
        file_path: file.file_path || ''
      };
    });
  };

  return {
    ...emptyCreateJobModel(),
    jobId: describeJob.job_id,
    jobName: describeJob.name ?? '',
    inputFile: describeJob.input_filename,
    job_files: convertJobFilesToJson(describeJob.job_files),
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
    downloaded: describeJob.downloaded
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
    inputFile: describeDefinition.input_filename,
    definitionId: describeDefinition.job_definition_id,
    outputPath: describeDefinition.output_filename_template ?? '',
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
    timezone: describeDefinition.timezone
  };
}

/**
 * Notebook listing models
 */

export interface INotebookJobsListingModel {
  inProgressJobCount: number;
  inProgressJobCountChanged: Signal<any, number>;
  scheduledJobsChanged: Signal<any, INotebookJobsWithToken>;
}

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
