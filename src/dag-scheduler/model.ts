import { VDomModel } from '@jupyterlab/apputils';
import { outputFormatTypes } from './contants';
import { Scheduler } from './handler';

/**
 * Top-level models
 */

export enum JobsView {
  // assignment ensures any enum value is always truthy
  CreateForm = 1,
  ListJobDefinitions
}

export enum JobSchedule {
  RunOnce = 'RunOnce',
  RunOnSchedule = 'RunOnSchedule'
}

export type IJobParameter = {
  name: string;
  value: string | number | boolean | undefined;
};

export type Contact = {
  name: string;
  email: string;
  id: string;
};

export type ScheduleInterval =
  | 'hour'
  | 'day'
  | 'week'
  | 'weekday'
  | 'month'
  | 'custom';

/**
 * Extended by models which back UIs using the <ScheduleInputs /> component.
 */
export type ModelWithScheduleFields = {
  /**
   * User's scheduling input encoded as a cron expression.
   */
  schedule: string;
  /**
   * Timezone specified in tz database format.
   */
  timezone: string;
  /**
   * Easy scheduling interval. 'custom' allows users to manually input a cron
   * expression.
   */
  scheduleInterval: ScheduleInterval;
  /**
   * Value of input field for 24-hour time (hh:mm).
   */
  scheduleClock: string;
  /**
   * Value of input field for day of the week (SUN-SAT).
   */
  scheduleWeekDay: string;
  /**
   * Value of input field for day of the month (0-31).
   */
  scheduleMonthDay: string;
  /**
   * Value of input field for past the hour.
   */
  scheduleMinute: string;
};

export enum TaskStatus {
  CREATING = 'CREATING',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  FAILED_TO_CREATE = 'FAILED_TO_CREATE',
  FAILED_TO_UPDATE = 'FAILED_TO_UPDATE'
}

export enum RunStatus {
  COMPLETED = 'COMPLETED',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  FAILED = 'FAILED',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export interface ITaskModel {
  id: string;
  nodeId: string;
  name: string;
  inputFile: string;
  outputFileNameTemplate?: string;
  kernelSpecId: string;
  namespaceId: string;
  kernelSpecVersion?: string;
  kernelProfileId?: string;
  kernelProfileVersion?: string;
  notificationEvents: string[];
  notificationEmails: Contact[];
  inputFileId?: string;
  inputFilePath?: string;
  externalLinks: Array<{ label: string; description: string; url: string }>;
  runtimeProperties: string;
  parameters: IJobParameter[];
  triggerRule: string;
  dependsOn: string[];
  slackChannel: string;
  showOutputInEmail: boolean;
  taskTimeout: string;
  outputFormats: string[];
  createTime?: number;
  updateTime?: number;
  status?: TaskStatus;
  status_message?: string;
}

export const defaultScheduleFields: ModelWithScheduleFields = {
  schedule: '0 0 * * MON-FRI',
  scheduleInterval: 'weekday',
  scheduleClock: '00:00',
  scheduleMinute: '0',
  scheduleMonthDay: '1',
  scheduleWeekDay: '1',
  timezone: 'UTC'
};

export function emptyCreateTaskModel(): Scheduler.ITask {
  return {
    id: '',
    name: '',
    nodeId: '',
    input_uri: '',
    kernelSpecId: '',
    namespaceId: '',
    notificationEvents: [],
    notificationEmails: [],
    triggerRule: 'all_success',
    dependsOn: [],
    slackChannel: '',
    externalLinks: [],
    showOutputInEmail: false,
    output_formats: outputFormatTypes.map(i => i.value.toLocaleLowerCase())
  };
}

export function emptyCreateJobDefinitionModel(): Scheduler.IJobRunDetail {
  return {
    name: '',
    runId: '',
    task_runs: [],
    namespaceId: '',
    ...defaultScheduleFields,
    schedule: '@once',
    tasks: [emptyCreateTaskModel() as any]
  };
}

export interface IJobsModel {
  key: number;
  jobsView: JobsView;
  cellParams?: string[];
  createTaskModel: Scheduler.ITask;
}

export class JobsModel extends VDomModel {
  private _key: number = Math.random();
  private _jobsView: JobsView = JobsView.ListJobDefinitions;
  private _createTaskModel: Scheduler.ITask;
  /**
   * Callback that gets invoked whenever a model is updated. This should be used
   * to call `ReactWidget.renderDOM()` to synchronously update the VDOM rather
   * than triggering an async VDOM update via Lumino. See #34.
   */
  private _onModelUpdate?: () => unknown;
  private _jobCount: number;

  constructor(options: IJobsModelOptions) {
    super();
    this._jobCount = 0;
    this._key = options.key;
    this._createTaskModel = emptyCreateTaskModel();
    this._onModelUpdate = options.onModelUpdate;
    this._jobsView = options.jobsView || JobsView.ListJobDefinitions;
  }

  get jobsView(): JobsView {
    return this._jobsView;
  }

  set jobsView(view: JobsView) {
    this._jobsView = view;
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }

  get key(): number {
    return this._key;
  }

  get createTaskModel(): Scheduler.ITask {
    return this._createTaskModel;
  }

  set createTaskModel(model: Scheduler.ITask) {
    this._createTaskModel = model;
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
      key: this._key,
      jobsView: this.jobsView,
      createTaskModel: this.createTaskModel
    };

    return data;
  }

  fromJson(data: IJobsModel): void {
    this._key = data.key;
    this._jobsView = data.jobsView ?? JobsView.ListJobDefinitions;
    this._createTaskModel = data.createTaskModel ?? emptyCreateTaskModel();

    // emit state changed signal
    this._onModelUpdate?.();
    this.stateChanged.emit(void 0);
  }
}

export interface IJobsModelOptions {
  key: number;
  jobsView: JobsView;
  onModelUpdate?: () => unknown;
}

export const convertParameters = (parameters: {
  [key: string]: any;
}): IJobParameter[] =>
  Object.entries(parameters).map(([pName, pValue]) => {
    return {
      name: pName,
      value: pValue
    };
  });
