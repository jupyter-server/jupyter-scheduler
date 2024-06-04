import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { Contact, TaskStatus } from './model';
import { DeploymentStatus } from './contants';
import { Toast } from './util/toast-decorator';

const API_NAMESPACE = 'v2/scheduler';

export type Namespace = {
  id: string;
  name: string;
  cluster: string;
  priorityClassName: 'p1' | 'p2' | 'p3' | 'p4';
};

export type NamespaceResponse = {
  namespaces: Namespace[];
};

export class WorkflowsService {
  constructor(options: SchedulerService.IOptions) {
    this.serverSettings =
      options.serverSettings || ServerConnection.makeSettings();
  }

  /**
   * Serializes a query object into a URI query string. Assumes the keys and
   * values of the query object as URI-encodable via `encoderURIComponent()`.
   */
  private serializeToQueryString<
    T extends { sort_by?: Scheduler.ISortField[] }
  >(jobQuery: T): string {
    return (
      '?' +
      (Object.keys(jobQuery) as (keyof T)[])
        .map(prop => {
          if (prop === 'sort_by') {
            const sortList: T['sort_by'] | undefined = jobQuery.sort_by;
            if (sortList === undefined) {
              return null;
            }

            // Serialize sort_by as a series of parameters in the firm dir(name)
            // where 'dir' is the direction and 'name' the sort field
            return sortList
              .map(
                sort =>
                  `sort_by=${encodeURIComponent(
                    sort.direction
                  )}(${encodeURIComponent(sort.name)})`
              )
              .join('&');
          }

          const value = jobQuery[prop];
          return `${encodeURIComponent(prop as any)}=${encodeURIComponent(
            value as any
          )}`;
        })
        .join('&')
    );
  }

  @Toast({
    pending: 'Creating a Workflow',
    success: 'Workflow created successfully',
    failure: 'Failed to create Workflow'
  })
  async createJobDefinition(
    definition: Scheduler.IJobDefinition
  ): Promise<Scheduler.IJobDefinition> {
    let data;

    const queryString = definition?.version === 'v1' ? '?migrate=true' : '';

    try {
      data = await requestAPI(
        this.serverSettings,
        'job_definitions' + queryString,
        {
          method: 'POST',
          body: JSON.stringify(definition)
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IJobDefinition;
  }

  async getJobDefinition(
    definition_id: string
  ): Promise<Scheduler.IJobDefinition> {
    let data;

    try {
      data = (await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}`,
        {
          method: 'GET'
        }
      )) as Scheduler.IJobDefinition;

      // TODO: Fix this in backend
      if (data && data.version === 'v1') {
        data = {
          ...data,
          tasks: (data.tasks || []).map(t => ({
            ...t,
            status: TaskStatus.CREATED
          }))
        };
      }
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IJobDefinition;
  }

  @Toast({
    pending: 'Updating Workflow',
    success: 'Updated workflow successfully',
    failure: 'Failed to update workflow'
  })
  async updateJobDefinition(
    jobDefId: string,
    model: Scheduler.IJobDefinition
  ): Promise<Scheduler.IJobDefinition> {
    let data;

    try {
      data = await requestAPI(
        this.serverSettings,
        `job_definitions/${jobDefId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(model)
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }

    return data as Scheduler.IJobDefinition;
  }

  async getJobDefinitions(
    jobDefintionsQuery: Scheduler.IListJobDefinitionsQuery,
    definition_id?: string
  ): Promise<Scheduler.IListJobDefinitionsResponse> {
    let data;
    const query = definition_id
      ? `/${definition_id}`
      : this.serializeToQueryString(jobDefintionsQuery);
    try {
      data = await requestAPI(this.serverSettings, `job_definitions${query}`, {
        method: 'GET'
      });
    } catch (e) {
      return Promise.reject(e);
    }

    return data as Scheduler.IListJobDefinitionsResponse;
  }

  @Toast({
    pending: 'Deleting Workflow',
    success: 'Deleted Workflow successfully',
    failure: 'Failed to delete Workflow'
  })
  async deleteJobDefinition(
    definition_id: string
  ): Promise<Scheduler.IDescribeJobDefinition> {
    let data;

    try {
      data = await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}`,
        {
          method: 'DELETE'
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IDescribeJobDefinition;
  }

  @Toast({
    pending: 'Deploying workflow',
    success: 'Deployed workflow successfully',
    failure: 'Failed to deploy workflow'
  })
  async deployJobDefinition(jobDefId: string): Promise<void> {
    try {
      await requestAPI(
        this.serverSettings,
        `job_definitions/${jobDefId}/deploy`,
        {
          method: 'POST'
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
  }

  @Toast({
    pending: 'Creating Task',
    success: 'Task created successfully',
    failure: 'Failed to create Task'
  })
  async createTask(
    model: Scheduler.ITask,
    definition_id?: string
  ): Promise<Scheduler.ICreateJobResponse> {
    let data;
    try {
      data = await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(model)
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.ICreateJobResponse;
  }

  @Toast({
    pending: 'Updating Task',
    success: 'Task updated successfully',
    failure: 'Failed to update Task'
  })
  async updateTask(
    model: Scheduler.ITask,
    definition_id?: string
  ): Promise<Scheduler.ICreateJobResponse> {
    let data;
    try {
      data = await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}/tasks/${model.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(model)
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.ICreateJobResponse;
  }

  @Toast({
    pending: 'Deleting Task',
    success: 'Task deleted successfully',
    failure: 'Failed to delete Task'
  })
  async deleteTask(taskId: string, definition_id?: string): Promise<void> {
    try {
      await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}/tasks/${taskId}`,
        {
          method: 'DELETE'
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getJob(
    job_run_id: string,
    version = 'v2'
  ): Promise<Scheduler.IJobRunDetail> {
    let data;
    let query = '';

    query = `${job_run_id}?version=${version}`;

    try {
      data = (await request(this.serverSettings, `v2/scheduler/jobs/${query}`, {
        method: 'GET'
      })) as Scheduler.IJobRunDetail;

      // TODO: Fix this in backend
      if (data && version === 'v1') {
        data = {
          ...data,
          tasks: (data.tasks || []).map(t => ({
            ...t,
            status: TaskStatus.CREATED
          }))
        };
      }
    } catch (e) {
      return Promise.reject(e);
    }

    return data as Scheduler.IJobRunDetail;
  }

  async getJobs(
    jobQuery: Scheduler.IListJobsQuery,
    job_def_id?: string,
    version = 'v2'
  ): Promise<Scheduler.IListJobsResponse> {
    let data;
    const query = job_def_id
      ? `?job_definition_id=${job_def_id}&version=${version}`
      : this.serializeToQueryString(jobQuery);

    try {
      // TODO: Revert the endpoint
      data = await request(this.serverSettings, `v2/scheduler/jobs${query}`, {
        method: 'GET'
      });
    } catch (e) {
      return Promise.reject(e);
    }

    return data as Scheduler.IListJobsResponse;
  }

  @Toast({
    pending: 'Submitting Job run request',
    success: 'Job run request submitted successfully',
    failure: 'Failed to submit Job run request'
  })
  async runJob(
    job_definition_id: string,
    model: { parameters: Record<string, string> }
  ): Promise<void> {
    try {
      // TODO: Revert the endpoint
      await request(
        this.serverSettings,
        `v2/scheduler/job_definitions/${job_definition_id}/jobs`,
        {
          method: 'POST',
          body: JSON.stringify(model)
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
  }

  @Toast({
    pending: 'Submitting Job re-run request',
    success: 'Job re-run request submitted successfully',
    failure: 'Failed to submit Job re-run request'
  })
  async rerunJob(job_id: string): Promise<void> {
    try {
      // TODO: Revert the endpoint
      await request(this.serverSettings, `v2/scheduler/jobs/${job_id}`, {
        method: 'POST'
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async setJobStatus(job_id: string, status: Scheduler.Status): Promise<void> {
    try {
      await requestAPI(this.serverSettings, `jobs/${job_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async pauseJobDefinition(jobDefId: string): Promise<void> {
    try {
      await requestAPI(this.serverSettings, `job_definitions/${jobDefId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: false })
      });
    } catch (e: unknown) {
      return Promise.reject(e);
    }
  }

  async resumeJobDefinition(jobDefId: string): Promise<void> {
    try {
      await requestAPI(this.serverSettings, `job_definitions/${jobDefId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: true })
      });
    } catch (e: unknown) {
      return Promise.reject(e);
    }
  }

  async downloadFiles(jobId: string, redownload = false): Promise<void> {
    try {
      await requestAPI(
        this.serverSettings,
        `jobs/${jobId}/download_files?redownload=${redownload}`,
        {
          method: 'GET'
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getKernelSpecs(): Promise<any[]> {
    try {
      const { kernelspecs = {} } = await request<{
        kernelspecs: Record<string, { spec: { display_name: string } }>;
      }>(this.serverSettings, 'api/kernelspecs', {
        method: 'GET'
      });

      return Object.keys(kernelspecs).map(key => ({
        value: key,
        label: kernelspecs[key].spec.display_name
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getNamespaces(): Promise<Namespace[]> {
    try {
      try {
        const { namespaces = [] } = await request<NamespaceResponse>(
          this.serverSettings,
          'namespaces',
          {
            method: 'GET'
          }
        );

        return namespaces.map(ns => ({
          ...ns,
          value: ns.id,
          label: ns.name
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getContacts(searchQuery: string): Promise<Contact[]> {
    try {
      const url = `publishing/search/users?search_string=${encodeURIComponent(
        searchQuery
      )}`;

      return request(this.serverSettings, url);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  @Toast({
    pending: 'Sharing',
    failure: 'Failed to share Notebook'
  })
  async getPublishedFileMeta(fileId: string): Promise<any> {
    try {
      const url = `publishing/${fileId}`;

      return request(this.serverSettings, url);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  @Toast({
    pending: 'Downloading',
    success: 'Downloaded file successfully',
    failure: 'Failed to Download'
  })
  download(model: { id: string; path: string }): any {
    const { id: fileId } = model;
    const url = URLExt.join('publishing', fileId, 'download');

    return request(this.serverSettings, url, {
      method: 'POST',
      body: JSON.stringify(model)
    });
  }

  /**
   * The server settings used to make API requests.
   */
  readonly serverSettings: ServerConnection.ISettings;
}

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @param expectData Is response data expected
 * @returns The response body interpreted as JSON
 */
async function requestAPI<T>(
  settings: ServerConnection.ISettings,
  endPoint = '',
  init: RequestInit = {},
  expectData = true
): Promise<T> {
  const requestUrl = URLExt.join(API_NAMESPACE, endPoint);

  return request(settings, requestUrl, init, expectData);
}

async function request<T>(
  settings: ServerConnection.ISettings,
  endPoint = '',
  init: RequestInit = {},
  expectData = true
): Promise<T> {
  // Make request to Jupyter API
  const requestUrl = URLExt.join(settings.baseUrl, endPoint);

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error: any) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();

  if (expectData && data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.error('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export namespace SchedulerService {
  /**
   * The instantiation options for a data registry handler.
   */
  export interface IOptions {
    serverSettings?: ServerConnection.ISettings;
  }
}

export namespace Scheduler {
  export type RuntimeEnvironmentParameters = Record<
    string,
    number | string | boolean
  >;
  export type Parameters = Record<string, string>;

  export interface IJobDefinition {
    id?: string;
    job_definition_id?: string;
    name: string;
    version?: 'v1' | 'v2';
    schedule?: string;
    timezone?: string;
    namespaceId: string;
    parameters?: Parameters;
    notebookParameters?: Parameters;
    active?: boolean;
    create_time?: number;
    update_time?: number;
    deploy_time?: number;
    notificationEvents?: string[];
    notificationEmails?: Contact[];
    scheduleStartDate?: string;
    externalLinks?: IExternalLink[];
    status?: string;
    status_message?: string;
    slackChannel?: string;
    tasks: ITask[];
  }

  export interface IJobRunDetail extends IJobDefinition {
    job_id?: string;
    runId: string;
    task_runs: ITaskRun[];
  }

  export interface IUpdateJobDefinition {
    name?: string;
    schedule?: string;
    timezone?: string;
    active?: boolean;
    input_uri?: string;
    parameters?: Parameters;
    runtimeProperties?: string;
    notificationEmails?: string[];
    notificationEvents?: string[];
    output_formats?: string[];
    input_file_id?: string;
    kernelSpecId: string;
    slackChannel?: string;
    scheduleStartDate?: string;
    taskTimeout?: string;
    showOutputInEmail?: boolean;
  }

  export interface IDescribeJobDefinition {
    name: string;
    input_filename: string;
    output_formats?: string[];
    parameters?: Parameters;
    output_filename_template?: string;
    schedule?: string;
    timezone?: string;
    job_definition_id: string;
    create_time: number;
    update_time: number;
    active: boolean;
    status?: DeploymentStatus;
    status_message?: string;

    kernelSpecId: string;
    namespaceId: string;
    notificationEmails?: string[];
    notificationEvents?: string[];
    input_file_id: string;
    runtimeProperties?: Record<string, string>;
    externalLinks: IExternalLink[];
    slackChannel?: string;
    scheduleStartDate?: string;
    taskTimeout?: string;
    showOutputInEmail?: boolean;
    tasks: any[];
  }

  export interface IEmailNotifications {
    on_start?: string[];
    on_success?: string[];
    on_failure?: string[];
    no_alert_for_skipped_rows: boolean;
  }

  export interface ITask {
    id?: string;
    nodeId: string;
    name: string;
    parameters?: Parameters;
    notebookParameters?: Parameters;
    runtimeProperties?: Record<string, unknown>;
    output_formats?: string[];
    input_uri: string;
    input_file_id?: string;
    input_file_path?: string;
    kernelSpecId: string;
    namespaceId: string;
    input_filename?: string;
    notificationEvents?: string[];
    notificationEmails?: Contact[];
    slackChannel?: string;
    showOutputInEmail?: boolean;
    taskTimeout?: string;
    triggerRule?: string;
    dependsOn: string[];
    status?: TaskStatus;
    status_message?: string;
    externalLinks?: IExternalLink[];
    create_time?: number;
    update_time?: number;
  }

  export interface ITaskRun extends ITask {
    start_time?: number;
    taskId: string;
    end_time?: number;
    run_count?: number;
    outputPreviewLink?: string;
    job_files?: IJobFile[];
    output_file_id: string;
  }

  export type Status =
    | 'CREATED'
    | 'QUEUED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'FAILED'
    | 'STOPPING'
    | 'STOPPED';

  export interface IJobFile {
    display_name: string;
    file_format: string;
    file_path?: string;
  }

  export interface IDescribeJob {
    name: string;
    input_filename: string;
    runtime_environment_name: string;
    input_file_id: string;
    idempotency_token?: string;
    job_definition_id?: string;
    parameters?: Parameters;
    tags?: string[];
    email_notifications?: IEmailNotifications;
    timeout_seconds?: number;
    max_retries?: number;
    min_retry_interval_millis?: number;
    retry_on_timeout?: boolean;
    output_filename_template?: string;
    output_formats?: string[];
    compute_type?: string;
    job_id: string;
    job_files: IJobFile[];
    url: string;
    status: Status;
    status_message: string;
    create_time: number;
    update_time: number;
    start_time?: number;
    end_time?: number;
    downloaded: boolean;
    externalLinks: IExternalLink[];
    runtimeProperties: Record<string, any>;
    outputPreviewLink: string;
    output_file_id?: string;
    slackChannel?: string;
    scheduleStartDate?: string;
    taskTimeout?: string;
    showOutputInEmail?: boolean;
  }

  export interface IExternalLink {
    label: string;
    description: string;
    url: string;
  }

  export interface ICreateJobResponse {
    job_id: string;
  }

  export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc'
  }

  export interface ISortField {
    name: string;
    direction: SortDirection;
  }

  export interface IListJobsQuery {
    status?: Status;
    job_definition_id?: string;
    name?: string;
    start_time?: number;
    sort_by?: ISortField[];
    max_items?: number;
    next_token?: string;
    version?: 'v1' | 'v2';
  }

  export interface IListJobsResponse {
    jobs: IDescribeJob[];
    next_token?: string;
    total_count?: number;
  }

  export interface IListJobDefinitionsQuery {
    sort_by?: ISortField[];
    max_items?: number;
    next_token?: string;
  }

  export interface IListJobDefinitionsResponse {
    job_definitions: IDescribeJobDefinition[];
    next_token?: string;
    total_count?: number;
  }

  export interface IUpdateJob {
    status?: Status;
  }
}
