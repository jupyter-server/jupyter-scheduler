import React, { useEffect, useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  convertDescribeDefinitiontoDefinition,
  convertDescribeJobtoJobDetail,
  ICreateJobModel,
  IDetailViewModel,
  IJobDefinitionModel,
  IJobDetailModel,
  JobsView
} from '../../model';
import { useTranslator } from '../../hooks';
import { SchedulerService } from '../../handler';
import { Scheduler } from '../../tokens';
import { JobDetail } from './job-detail';
import { JobDefinition } from './job-definition';

import {
  Alert,
  Box,
  Breadcrumbs,
  CircularProgress,
  Link,
  Stack,
  Typography
} from '@mui/material';
import { Heading } from '../../components/heading';

export interface IDetailViewProps {
  app: JupyterFrontEnd;
  model: IDetailViewModel;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  jobsView: JobsView;
  setJobsView: (view: JobsView) => void;
  showJobDetail: (jobId: string) => void;
  showCreateJob: (state: ICreateJobModel) => void;
  editJobDefinition: (jobDefinition: IJobDefinitionModel) => void;
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
 * dispatching on `props.jobsView`.
 */
export function DetailView(props: IDetailViewProps): JSX.Element {
  const [jobModel, setJobsModel] = useState<IJobDetailModel | null>(null);
  const [jobDefinitionModel, setJobDefinitionModel] =
    useState<IJobDefinitionModel | null>(null);
  const [fetchError, setFetchError] = useState<string>();

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const fetchJobDetailModel = async () => {
    try {
      const jobFromService = await ss.getJob(props.model.id);
      const jobDetailModel = convertDescribeJobtoJobDetail(jobFromService);
      setJobsModel(jobDetailModel);
    } catch (e: any) {
      setFetchError(e.message);
    }
  };

  const fetchJobDefinitionModel = async () => {
    try {
      const definitionFromService = await ss.getJobDefinition(props.model.id);
      const jobDefinitionModel = convertDescribeDefinitiontoDefinition(
        definitionFromService
      );
      setJobDefinitionModel(jobDefinitionModel);
    } catch (e: any) {
      setFetchError(e.message);
    }
  };

  useEffect(() => {
    switch (props.jobsView) {
      case JobsView.JobDetail:
        fetchJobDetailModel();
        break;
      case JobsView.JobDefinitionDetail:
        fetchJobDefinitionModel();
        break;
    }
  }, [props.jobsView, props.model, props.model.id]);

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
            props.setJobsView(
              props.jobsView === JobsView.JobDetail
                ? JobsView.ListJobs
                : JobsView.ListJobDefinitions
            );
          }}
        >
          {props.jobsView === JobsView.JobDetail
            ? trans.__('Notebook Jobs')
            : trans.__('Notebook Job Definitions')}
        </Link>
        <Typography color="text.primary">
          {props.jobsView === JobsView.JobDetail
            ? jobModel?.jobName ?? ''
            : jobDefinitionModel?.name ?? ''}
        </Typography>
      </Breadcrumbs>
    </div>
  );

  return (
    <Box sx={{ p: 4, maxWidth: '1000px' }}>
      <Stack spacing={4}>
        {BreadcrumbsStyled}
        <Heading level={1}>
          {props.jobsView === JobsView.JobDetail
            ? trans.__('Job Detail')
            : trans.__('Job Definition')}
        </Heading>
        {fetchError && <Alert severity="error">{fetchError}</Alert>}
        {props.jobsView === JobsView.JobDetail && jobModel && (
          <JobDetail
            app={props.app}
            model={jobModel}
            handleModelChange={fetchJobDetailModel}
            setCreateJobModel={props.setCreateJobModel}
            setJobsView={props.setJobsView}
            // Extension point: optional additional component
            advancedOptions={props.advancedOptions}
          />
        )}
        {props.jobsView === JobsView.JobDefinitionDetail && jobDefinitionModel && (
          <JobDefinition
            app={props.app}
            model={jobDefinitionModel}
            setJobsView={props.setJobsView}
            refresh={fetchJobDefinitionModel}
            showCreateJob={props.showCreateJob}
            showJobDetail={props.showJobDetail}
            editJobDefinition={props.editJobDefinition}
            // Extension point: optional additional component
            advancedOptions={props.advancedOptions}
          />
        )}
        {!jobModel && !jobDefinitionModel && !fetchError && (
          <Loading title={trans.__('Loading')} />
        )}
      </Stack>
    </Box>
  );
}
