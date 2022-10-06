import React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { Scheduler as SchedulerTokens } from '../tokens';
import { ICreateJobModel, IJobDetailModel, JobsView } from '../model';
import { JobDetail } from './job-detail';

export interface IDetailViewProps {
  app: JupyterFrontEnd;
  model: IJobDetailModel;
  handleModelChange: (model: IJobDetailModel) => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
}

export function DetailView(props: IDetailViewProps): JSX.Element {
  return (
    <JobDetail
      app={props.app}
      model={{
        jobId: props.model.jobId,
        jobName: '',
        outputPath: '',
        environment: '',
        inputFile: '',
        detailType: 'JobDefinition',
        createType: 'JobDefinition'
      }}
      handleModelChange={props.handleModelChange}
      setCreateJobModel={props.setCreateJobModel}
      setView={props.setView}
      advancedOptions={props.advancedOptions}
    />
  );
}
