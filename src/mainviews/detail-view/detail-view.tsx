import React, { useEffect, useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  convertDescribeDefinitiontoDefinition,
  convertDescribeJobtoJobDetail,
  ICreateJobModel,
  IDetailViewModel,
  IJobDefinitionModel,
  IJobDetailModel,
  JobsView,
  ListJobsView
} from '../../model';
import { useTranslator } from '../../hooks';
import { SchedulerService } from '../../handler';
import { Scheduler } from '../../tokens';
import { JobDetail } from './job-detail';
import { JobDefinition } from './job-definition';

import Stack from '@mui/material/Stack';
import {
  Box,
  Breadcrumbs,
  CircularProgress,
  Link,
  Typography
} from '@mui/material';
import { Heading } from '../../components/heading';

export interface IDetailViewProps {
  app: JupyterFrontEnd;
  model: IDetailViewModel;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setJobsView: (view: JobsView) => void;
  setListJobsView: (view: ListJobsView) => void;
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

/**
 * Renders both the job details view and the job definition details view,
 * dispatching on `props.model.detailType`.
 */
export function DetailView(props: IDetailViewProps): JSX.Element {
  const [jobModel, setJobsModel] = useState<IJobDetailModel | null>(null);
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
    const jobDetailModel = convertDescribeJobtoJobDetail(jobFromService);
    setJobsModel(jobDetailModel);
  };

  const fetchJobDefinitionModel = async () => {
    const definitionFromService = await ss.getJobDefinition(props.model.id);
    const jobDefinitionModel = convertDescribeDefinitiontoDefinition(
      definitionFromService
    );
    setJobDefinitionModel(jobDefinitionModel);
  };

  useEffect(() => {
    switch (props.model.detailType) {
      case 'Job':
        fetchJobDetailModel();
        break;
      case 'JobDefinition':
        fetchJobDefinitionModel();
        break;
    }
  }, [props.model]);

  const BreadcrumbsStyled = (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          onClick={(
            _:
              | React.MouseEvent<HTMLAnchorElement, MouseEvent>
              | React.MouseEvent<HTMLSpanElement, MouseEvent>
          ): void => {
            props.setJobsView('ListJobs');
            props.setListJobsView(
              props.model.detailType === 'Job' ? 'Job' : 'JobDefinition'
            );
          }}
        >
          {props.model.detailType === 'Job'
            ? trans.__('Notebook Jobs')
            : trans.__('Notebook Job Definitions')}
        </Link>
        <Typography color="text.primary">
          {props.model.detailType === 'Job'
            ? jobModel?.jobName ?? ''
            : jobDefinitionModel?.name ?? ''}
        </Typography>
      </Breadcrumbs>
    </div>
  );

  if (props.model.detailType) {
    return (
      <Box sx={{ p: 4 }}>
        <Stack spacing={4}>
          {BreadcrumbsStyled}
          <Heading level={1}>
            {props.model.detailType === 'Job'
              ? trans.__('Job Detail')
              : trans.__('Job Definition')}
          </Heading>
          {props.model.detailType === 'Job' && jobModel && (
            <JobDetail
              app={props.app}
              model={jobModel}
              handleModelChange={() => fetchJobDetailModel()}
              setCreateJobModel={props.setCreateJobModel}
              setJobsView={props.setJobsView}
              setListJobsView={props.setListJobsView}
              // Extension point: optional additional component
              advancedOptions={props.advancedOptions}
              outputFormatsStrings={outputFormatStrings ?? []}
            />
          )}
          {props.model.detailType === 'JobDefinition' && jobDefinitionModel && (
            <JobDefinition
              model={jobDefinitionModel}
              setJobsView={props.setJobsView}
              setListJobsView={props.setListJobsView}
              refresh={fetchJobDefinitionModel}
            />
          )}
          {!jobModel && !jobDefinitionModel && (
            <Loading title={trans.__('Loading')} />
          )}
        </Stack>
      </Box>
    );
  }

  return <Loading title={trans.__('Loading')} />;
}
