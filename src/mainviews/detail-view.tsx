import React, { useEffect, useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  convertDescribeJobtoJobDetail,
  ICreateJobModel,
  IDetailViewModel,
  IJobDefinitionModel,
  IJobDetailModel,
  JobsView
} from '../model';
import { useTranslator } from '../hooks';
import { SchedulerService } from '../handler';
import { Scheduler } from '../tokens';
import { JobDetail } from './job-detail';
import { JobDefinition } from './job-definition';

import Stack from '@mui/material/Stack';
import { Box, CircularProgress } from '@mui/material';

export interface IDetailViewProps {
  app: JupyterFrontEnd;
  model: IDetailViewModel;
  handleModelChange: (model: IJobDetailModel) => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<Scheduler.IAdvancedOptionsProps>;
}

interface ILoadingProps {
  title: string;
}

const Loading = (props: ILoadingProps) => (
  <Stack direction="row" justifyContent="center">
    <CircularProgress title={props.title} />
  </Stack>
);

export function DetailView(props: IDetailViewProps): JSX.Element {
  const [jobsModel, setJobsModel] = useState<IJobDetailModel | null>(null);
  const [jobDefinitionModel, setJobDefinitionModel] =
    useState<IJobDefinitionModel | null>(null);
  const [outputFormatStrings, setOutputFormatStrings] = useState<
    string[] | null
  >(null);

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const fetchJobDetailModel = async () => {
    const jobFromService = await ss.getJob(props.model.id);
    setOutputFormatStrings(jobFromService.output_formats ?? []);
    const newModel = convertDescribeJobtoJobDetail(jobFromService);
    setJobsModel(newModel);
  };

  const fetchJobDefinitionlModel = async () => {
    const definitionFromService = await ss.getJobDefinition(props.model.id);
    setJobDefinitionModel(definitionFromService);
  };

  useEffect(() => {
    switch (props.model.detailType) {
      case 'Job':
        fetchJobDetailModel();
        break;
      case 'JobDefinition':
        fetchJobDefinitionlModel();
        break;
    }
  }, [props.model]);

  if (props.model.detailType) {
    return (
      <Box sx={{ p: 4 }}>
        <Stack spacing={4}>
          {props.model.detailType === 'Job' && jobsModel && (
            <JobDetail
              app={props.app}
              model={jobsModel}
              handleModelChange={props.handleModelChange}
              setCreateJobModel={props.setCreateJobModel}
              setView={props.setView}
              // Extension point: optional additional component
              advancedOptions={props.advancedOptions}
              outputFormatsStrings={outputFormatStrings ?? []}
            />
          )}
          {props.model.detailType === 'JobDefinition' && jobDefinitionModel && (
            <JobDefinition model={jobDefinitionModel} setView={props.setView} />
          )}
        </Stack>
      </Box>
    );
  }

  return <Loading title={trans.__('Loading')} />;
}
