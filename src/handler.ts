import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

const API_NAMESPACE = 'scheduler';

export class SchedulerService {
  constructor(options: SchedulerService.IOptions) {
    this.serverSettings =
      options.serverSettings || ServerConnection.makeSettings();
  }

  async getJobDefinitions(
    definition_id: string
  ): Promise<Scheduler.IDescribeJobDefinition[]> {
    let data;
    let query = '';
    if (definition_id) {
      query = `/${definition_id}`;
    }
    try {
      data = await requestAPI(this.serverSettings, `job_definitions${query}`, {
        method: 'GET'
      });
    } catch (e: any) {
      console.error(e);
    }
    return data as Scheduler.IDescribeJobDefinition[];
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
    } catch (e: any) {
      console.error(e);
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
    } catch (e: any) {
      console.error(e);
    }
    return data as Scheduler.IDescribeJob;
  }

  async getJobs(
    jobQuery: Scheduler.IListJobsQuery,
    job_id?: string
  ): Promise<Scheduler.IListJobsResponse> {
    let data;
    let query = '';

    if (job_id) {
      query = `/${job_id}`;
    } else if (jobQuery) {
      query =
        '?' +
        Object.keys(jobQuery)
          .map(prop => {
            if (prop === 'sort_by') {
              const sortList: Scheduler.ISortField[] | undefined =
                jobQuery.sort_by;
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

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const value = jobQuery[prop];
            return `${encodeURIComponent(prop)}=${encodeURIComponent(value)}`;
          })
          .join('&');
    }

    try {
      data = await requestAPI(this.serverSettings, `jobs${query}`, {
        method: 'GET'
      });
    } catch (e: any) {
      console.error(e);
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
      console.error(e);
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
      console.error(e);
    }
    return data as Scheduler.ICreateJobResponse;
  }

  async setJobStatus(
    job_id: string,
    status: Scheduler.Status
  ): Promise<Scheduler.IDescribeJob> {
    let data;
    try {
      data = await requestAPI(this.serverSettings, `jobs/${job_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error(e);
    }

    return data as Scheduler.IDescribeJob;
  }

  async getRuntimeEnvironments(): Promise<Scheduler.IRuntimeEnvironment[]> {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'runtime_environments', {
        method: 'GET'
      });
    } catch (e) {
      console.error(e);
    }

    return data as Scheduler.IRuntimeEnvironment[];
  }

  async deleteJob(job_id: string): Promise<void> {
    try {
      await requestAPI(this.serverSettings, `jobs/${job_id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error(e);
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
  export interface ICreateJobDefinition {
    input_uri: string;
    output_prefix: string;
    runtime_environment_name: string;
    runtime_environment_parameters?: { [key: string]: number | string };
    output_formats?: string[];
    parameters?: { [key: string]: any };
    tags?: string[];
    name?: string;
    output_filename_template?: string;
    compute_type?: string;
    schedule?: string;
    timezone?: string;
  }

  export interface IUpdateJobDefinition extends ICreateJobDefinition {
    job_definition_id: string;
    idempotency_token?: string;
    url?: string;
  }

  export interface IDescribeJobDefinition extends ICreateJobDefinition {
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
    input_uri: string;
    output_prefix: string;
    runtime_environment_name: string;
    runtime_environment_parameters?: { [key: string]: number | string };
    idempotency_token?: string;
    job_definition_id?: string;
    parameters?: { [key: string]: any };
    tags?: string[];
    name?: string;
    email_notifications?: IEmailNotifications;
    timeout_seconds?: number;
    max_retries?: number;
    min_retry_interval_millis?: number;
    retry_on_timeout?: boolean;
    output_filename_template?: string;
    output_formats?: string[];
    compute_type?: string;
  }

  export type Status =
    | 'CREATED'
    | 'QUEUED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'FAILED'
    | 'STOPPING'
    | 'STOPPED';

  export interface IDescribeJob extends ICreateJob {
    job_id: string;
    output_uri: string;
    url: string;
    status: Status;
    status_message: string;
    create_time: number;
    update_time: number;
    start_time?: number;
    end_time?: number;
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
    total_count: number;
  }

  export interface IRuntimeEnvironment {
    name: string;
    label: string;
    description: string;
    file_extensions: string[];
    output_formats: IOutputFormat[];
    metadata: { [key: string]: string };
    compute_types: string[] | null;
  }

  export interface IOutputFormat {
    name: string;
    label: string;
  }
}
