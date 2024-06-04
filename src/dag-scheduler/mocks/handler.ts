import { Namespace, Scheduler, WorkflowsService } from '../handler';
import { job_definitions } from './job-definitions';
import { job_definition } from './job-definition';
import { job_runs } from './job-runs';
import { job_run } from './job-run';
import { Contact } from '../model';
import { namespaces } from './namespaces';
import { nanoid } from 'nanoid';

export class MockWorkflowService extends WorkflowsService {
  public override createJobDefinition(
    definition: Scheduler.IJobDefinition
  ): Promise<Scheduler.IJobDefinition> {
    return Promise.resolve({ job_definition_id: nanoid() }) as any;
  }

  public override getJobDefinitions(
    jobDefintionsQuery: Scheduler.IListJobDefinitionsQuery,
    definition_id?: string | undefined
  ): Promise<Scheduler.IListJobDefinitionsResponse> {
    return Promise.resolve(job_definitions as any);
  }

  public override getJobDefinition(
    definition_id: string
  ): Promise<Scheduler.IJobDefinition> {
    return Promise.resolve(job_definition as any);
  }

  public override getJobs(
    jobQuery: Scheduler.IListJobsQuery,
    job_def_id?: string | undefined,
    version?: string
  ): Promise<Scheduler.IListJobsResponse> {
    return Promise.resolve(job_runs as any);
  }

  public override getJob(
    job_run_id: string,
    version?: string
  ): Promise<Scheduler.IJobRunDetail> {
    return Promise.resolve(job_run as any);
  }

  public override getNamespaces(): Promise<Namespace[]> {
    return namespaces as any;
  }

  public override getContacts(searchQuery: string): Promise<Contact[]> {
    return [
      { id: '1', name: 'Alice Graham', email: 'alice@yahoo.com' },
      { id: '2', name: 'Asher Reichert', email: 'asher@yahoo.com' },
      { id: '3', name: 'James Anderson', email: 'james@yahoo.com' },
      { id: '4', name: 'Ervin Howell ', email: 'ervin@yahoo.com' },
      { id: '5', name: 'Barbara Stein', email: 'barbara@yahoo.com' },
      { id: '6', name: 'Clementine Bauch ', email: 'chris-s@yahoo.com' },
      { id: '7', name: 'Matthew Hogard', email: 'mat@gmail.com' },
      { id: '8', name: 'Patricia Lebsack', email: 'patricia@gmail.com' },
      { id: '9', name: 'Sathish kumar', email: 'sathishlxg@gmail.com' },
      { id: '10', name: '', email: 'lebron@yahoo.com' }
    ] as any;
  }
}
