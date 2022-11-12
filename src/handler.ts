import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

const API_NAMESPACE = 'scheduler';

export class SchedulerService {
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

  async getJobDefinition(
    definition_id: string
  ): Promise<Scheduler.IDescribeJobDefinition> {
    let data;

    try {
      data = await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}`,
        {
          method: 'GET'
        }
      );
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IDescribeJobDefinition;
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

  async createJobDefinition(
    definition: Scheduler.ICreateJobDefinition
  ): Promise<Scheduler.IDescribeJobDefinition> {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'job_definitions', {
        method: 'POST',
        body: JSON.stringify(definition)
      });
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IDescribeJobDefinition;
  }

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

  async getJob(job_id: string): Promise<Scheduler.IDescribeJob> {
    let data;
    let query = '';

    query = `/${job_id}`;

    try {
      data = await requestAPI(this.serverSettings, `jobs${query}`, {
        method: 'GET'
      });
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IDescribeJob;
  }

  async getJobs(
    jobQuery: Scheduler.IListJobsQuery,
    job_id?: string
  ): Promise<Scheduler.IListJobsResponse> {
    let data;
    const query = job_id ? `/${job_id}` : this.serializeToQueryString(jobQuery);

    try {
      data = await requestAPI(this.serverSettings, `jobs${query}`, {
        method: 'GET'
      });
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.IListJobsResponse;
  }

  async getjobCount(status?: string): Promise<number> {
    let data: { count: number } = { count: 0 }; // Fail safe
    let query = '';
    if (status) {
      query = `?status=${encodeURIComponent(status)}`;
    }

    try {
      data = await requestAPI(this.serverSettings, `jobs/count${query}`, {
        method: 'GET'
      });
    } catch (e) {
      return Promise.reject(e);
    }

    return data.count;
  }

  async createJob(
    model: Scheduler.ICreateJob
  ): Promise<Scheduler.ICreateJobResponse> {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'jobs', {
        method: 'POST',
        body: JSON.stringify(model)
      });
    } catch (e) {
      return Promise.reject(e);
    }
    return data as Scheduler.ICreateJobResponse;
  }

  async createJobFromDefinition(
    definition_id: string,
    model: Scheduler.ICreateJobFromDefinition
  ): Promise<Scheduler.ICreateJobResponse> {
    let data;
    try {
      data = await requestAPI(
        this.serverSettings,
        `job_definitions/${definition_id}/jobs`,
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

  async getRuntimeEnvironments(): Promise<Scheduler.IRuntimeEnvironment[]> {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'runtime_environments', {
        method: 'GET'
      });
    } catch (e) {
      return Promise.reject(e);
    }

    return data as Scheduler.IRuntimeEnvironment[];
  }

  async deleteJob(job_id: string): Promise<void> {
    try {
      await requestAPI(this.serverSettings, `jobs/${job_id}`, {
        method: 'DELETE'
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
      console.log(e);
    }
  }

  async updateJobDefinition(
    jobDefId: string,
    model: Scheduler.IUpdateJobDefinition
  ): Promise<void> {
    try {
      await requestAPI(this.serverSettings, `job_definitions/${jobDefId}`, {
        method: 'PATCH',
        body: JSON.stringify(model)
      });
    } catch (e) {
      return Promise.reject(e);
    }
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
  // Make request to Jupyter API
  const requestUrl = URLExt.join(settings.baseUrl, API_NAMESPACE, endPoint);

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

  export interface ICreateJobDefinition {
    name: string;
    input_uri: string;
    runtime_environment_name: string;
    runtime_environment_parameters?: RuntimeEnvironmentParameters;
    output_formats?: string[];
    parameters?: Parameters;
    tags?: string[];
    output_filename_template?: string;
    compute_type?: string;
    schedule?: string;
    timezone?: string;
  }

  export interface IUpdateJobDefinition {
    name?: string;
    schedule?: string;
    timezone?: string;
    active?: boolean;
  }

  export interface IDescribeJobDefinition {
    name: string;
    input_filename: string;
    runtime_environment_name: string;
    runtime_environment_parameters?: RuntimeEnvironmentParameters;
    output_formats?: string[];
    parameters?: Parameters;
    tags?: string[];
    output_filename_template?: string;
    compute_type?: string;
    schedule?: string;
    timezone?: string;
    job_definition_id: string;
    create_time: number;
    update_time: number;
    active: boolean;
  }

  export interface IEmailNotifications {
    on_start?: string[];
    on_success?: string[];
    on_failure?: string[];
    no_alert_for_skipped_rows: boolean;
  }

  export interface ICreateJob {
    name: string;
    input_uri: string;
    runtime_environment_name: string;
    runtime_environment_parameters?: RuntimeEnvironmentParameters;
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
  }

  export interface ICreateJobFromDefinition {
    parameters?: Parameters;
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
    runtime_environment_parameters?: RuntimeEnvironmentParameters;
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

  export interface IRuntimeEnvironment {
    name: string;
    label: string;
    description: string;
    file_extensions: string[];
    output_formats: IOutputFormat[];
    metadata: { [key: string]: string };
    compute_types: string[] | null;
    default_compute_type: string | null;
    utc_only?: boolean;
  }

  export interface IOutputFormat {
    name: string;
    label: string;
  }
}
