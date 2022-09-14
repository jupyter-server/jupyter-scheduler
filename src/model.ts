import { Signal } from "@lumino/signaling";
import { Scheduler } from "./handler";

export class NotebookJobsListingModel implements INotebookJobsListingModel {
    private _scheduled_jobs: Scheduler.IDescribeJob[];
    readonly scheduledJobsChanged: Signal<any, any>;
    readonly inProgressJobCountChanged: Signal<any, number>;
    public inProgressJobCount: number;

    constructor(
      scheduled_jobs: Scheduler.IDescribeJob[],
      next_token?: string
    ) {
        const inProgressJobs = scheduled_jobs
          ? scheduled_jobs.filter(job => job.status === 'IN_PROGRESS')
          : [];
        this.inProgressJobCount = inProgressJobs.length;

        this._scheduled_jobs = scheduled_jobs;
        this.scheduledJobsChanged = new Signal(this);
        this.inProgressJobCountChanged = new Signal(this);
    }

    updateJobs(jobs: Scheduler.IDescribeJob[]) {
        let jobsChanged = false;

        if(jobs.length != this._scheduled_jobs.length) {
            jobsChanged = true;
        }
        if(!jobsChanged){
            for(let i = 0; i < jobs.length; i++) {
                const job = jobs[i]
                const modelJob = this._scheduled_jobs[i]
                if(job.status !== modelJob.status) {
                    jobsChanged = true;
                    break;
                }
            }
        }
        if(jobsChanged){
            this._scheduled_jobs = jobs;
            this.scheduledJobsChanged.emit(jobs);
        }
    }

    updateJobsCount(jobCount: number) {
      if (jobCount !== this.inProgressJobCount) {
        this.inProgressJobCount = jobCount;
        this.inProgressJobCountChanged.emit(jobCount);
      }
    }
}

export interface INotebookJobsWithToken {
  jobs: Scheduler.IDescribeJob[];
  next_token?: string
}

export interface INotebookJobsListingModel {
  inProgressJobCount: number
  inProgressJobCountChanged: Signal<any, number>
  scheduledJobsChanged: Signal<any, INotebookJobsWithToken>
}

export interface ICreateJobInputModel {
  jobName: string;
  inputFile: string;
  outputPath: string;
  environment: string;
  parameters?: {[key: string]: any};
}

export interface ICreateJobInput {
  changed: Signal<ICreateJobInputModel, string>;
  model: ICreateJobInputModel;
}
