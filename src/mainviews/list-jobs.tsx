import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { Alert, Button, Box, Stack, Tab, Tabs } from '@mui/material';

import { Heading } from '../components/heading';
import { useTranslator } from '../hooks';
import { buildJobRow } from '../components/job-row';
import { buildJobDefinitionRow } from '../components/job-definition-row';
import { ICreateJobModel, JobsView } from '../model';
import { Scheduler, SchedulerService } from '../handler';
import { Cluster } from '../components/cluster';
import {
  AdvancedTable,
  AdvancedTableColumn
} from '../components/advanced-table';

interface IListJobsTableProps {
  app: JupyterFrontEnd;
  // Function that results in the create job form being made visible
  // with job details prepopulated.
  showCreateJob: (state: ICreateJobModel) => void;
  // function that shows job detail view
  showJobDetail: (jobId: string) => void;
  jobDefinitionId?: string;
  height?: 'auto' | string | number;
  pageSize?: number;
  emptyRowMessage?: string;
}

export function ListJobsTable(props: IListJobsTableProps): JSX.Element {
  const [jobsQuery, setJobsQuery] = useState<Scheduler.IListJobsQuery>(
    props.jobDefinitionId
      ? {
          job_definition_id: props.jobDefinitionId
        }
      : {}
  );
  const [deletedRows, setDeletedRows] = useState<
    Set<Scheduler.IDescribeJob['job_id']>
  >(new Set());

  const trans = useTranslator('jupyterlab');

  // Cache environment list — we need this for the output formats.
  const [environmentList, setEnvironmentList] = useState<
    Scheduler.IRuntimeEnvironment[]
  >([]);

  const api = useMemo(() => new SchedulerService({}), []);

  // Retrieve the environment list once.
  useEffect(() => {
    const setList = async () => {
      setEnvironmentList(await api.getRuntimeEnvironments());
    };

    setList();
  }, []);

  const deleteRow = useCallback((id: Scheduler.IDescribeJob['job_id']) => {
    setDeletedRows(deletedRows => new Set([...deletedRows, id]));
  }, []);

  const reload = useCallback(() => {
    setJobsQuery(query => ({ ...query }));
  }, []);

  const reloadButton = (
    <Cluster justifyContent="flex-end">
      <Button variant="contained" size="small" onClick={reload}>
        {trans.__('Reload')}
      </Button>
    </Cluster>
  );

  const translateStatus = useCallback(
    (status: Scheduler.Status) => {
      // This may look inefficient, but it's intended to call the `trans` function
      // with distinct, static values, so that code analyzers can pick up all the
      // needed source strings.
      switch (status) {
        case 'CREATED':
          return trans.__('Created');
        case 'QUEUED':
          return trans.__('Queued');
        case 'COMPLETED':
          return trans.__('Completed');
        case 'FAILED':
          return trans.__('Failed');
        case 'IN_PROGRESS':
          return trans.__('In progress');
        case 'STOPPED':
          return trans.__('Stopped');
        case 'STOPPING':
          return trans.__('Stopping');
      }
    },
    [trans]
  );

  // Display column headers with sort indicators.
  const columns: AdvancedTableColumn[] = [
    {
      sortField: 'name',
      name: trans.__('Job name')
    },
    {
      sortField: 'input_filename',
      name: trans.__('Input file')
    },
    {
      sortField: null,
      name: trans.__('Output files')
    },
    {
      sortField: 'create_time',
      name: trans.__('Created at')
    },
    {
      sortField: 'status', // This will sort on the server status, not localized
      name: trans.__('Status')
    },
    {
      sortField: null, // Non sortable
      name: trans.__('Actions')
    }
  ];

  const renderRow = (job: Scheduler.IDescribeJob) =>
    buildJobRow(
      job,
      environmentList,
      props.app,
      props.showCreateJob,
      deleteRow,
      translateStatus,
      props.showJobDetail,
      reload
    );

  const rowFilter = (job: Scheduler.IDescribeJob) =>
    !deletedRows.has(job.job_id);

  const emptyRowMessage = useMemo(
    () =>
      props.emptyRowMessage ??
      trans.__(
        'There are no notebook jobs. Notebook jobs run files in the background, immediately or on a schedule. ' +
          'To create a notebook job, right-click on a notebook in the file browser and select "Create Notebook Job".'
      ),
    [props.emptyRowMessage, trans]
  );

  // note that root element here must be a JSX fragment for DataGrid to be sized properly
  return (
    <>
      {reloadButton}
      <AdvancedTable
        query={jobsQuery}
        setQuery={setJobsQuery}
        request={api.getJobs.bind(api)}
        extractRows={(payload: Scheduler.IListJobsResponse) =>
          payload?.jobs || []
        }
        renderRow={renderRow}
        columns={columns}
        emptyRowMessage={emptyRowMessage}
        rowFilter={rowFilter}
        height={props.height}
        pageSize={props.pageSize}
      />
    </>
  );
}

type ListJobDefinitionsTableProps = {
  app: JupyterFrontEnd;
  showJobDefinitionDetail: (jobDefId: string) => void;
};

function ListJobDefinitionsTable(props: ListJobDefinitionsTableProps) {
  const trans = useTranslator('jupyterlab');
  const [jobDefsQuery, setJobDefsQuery] =
    useState<Scheduler.IListJobDefinitionsQuery>({});
  const [deletedRows, setDeletedRows] = useState<
    Set<Scheduler.IDescribeJobDefinition['job_definition_id']>
  >(new Set());

  const [displayError, setDisplayError] = useState<React.ReactNode | null>(
    null
  );

  const api = useMemo(() => new SchedulerService({}), []);

  const deleteRow = useCallback(
    (id: Scheduler.IDescribeJobDefinition['job_definition_id']) => {
      setDeletedRows(deletedRows => new Set([...deletedRows, id]));
    },
    []
  );

  const columns: AdvancedTableColumn[] = [
    {
      sortField: 'name',
      name: trans.__('Job definition name')
    },
    {
      sortField: 'input_filename',
      name: trans.__('Input filename')
    },
    {
      sortField: 'create_time',
      name: trans.__('Created at')
    },
    {
      sortField: null,
      name: trans.__('Schedule')
    },
    {
      sortField: null,
      name: trans.__('Status')
    },
    {
      sortField: null,
      name: trans.__('Actions')
    }
  ];

  const reloadButton = (
    <Cluster justifyContent="flex-end">
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          setDisplayError(null);
          setJobDefsQuery(query => ({ ...query }));
        }}
      >
        {trans.__('Reload')}
      </Button>
    </Cluster>
  );

  const renderRow = (jobDef: Scheduler.IDescribeJobDefinition) =>
    buildJobDefinitionRow(
      jobDef,
      props.app,
      props.showJobDefinitionDetail,
      deleteRow,
      () => setJobDefsQuery({}),
      trans,
      new SchedulerService({}),
      setDisplayError
    );

  const rowFilter = (jobDef: Scheduler.IDescribeJobDefinition) =>
    !deletedRows.has(jobDef.job_definition_id);

  const emptyRowMessage = useMemo(
    () =>
      trans.__(
        'There are no notebook job definitions. Notebook job definitions run files in the background on a schedule. ' +
          'To create a notebook job definition, right-click on a notebook in the file browser and select "Create Notebook Job".'
      ),
    [trans]
  );

  return (
    <>
      {displayError && (
        <Alert severity="error" onClose={() => setDisplayError(null)}>
          {displayError}
        </Alert>
      )}
      {reloadButton}
      <AdvancedTable
        query={jobDefsQuery}
        setQuery={setJobDefsQuery}
        request={api.getJobDefinitions.bind(api)}
        extractRows={(payload: Scheduler.IListJobDefinitionsResponse) =>
          payload?.job_definitions || []
        }
        renderRow={renderRow}
        columns={columns}
        emptyRowMessage={emptyRowMessage}
        rowFilter={rowFilter}
      />
    </>
  );
}

export interface IListJobsProps {
  app: JupyterFrontEnd;
  listView: JobsView.ListJobs | JobsView.ListJobDefinitions;
  showListView: (view: JobsView.ListJobs | JobsView.ListJobDefinitions) => void;
  showCreateJob: (newModel: ICreateJobModel) => void;
  showJobDetail: (jobId: string) => void;
  showJobDefinitionDetail: (jobDefId: string) => void;
  newlyCreatedId?: string;
  newlyCreatedName?: string;
}

export function NotebookJobsList(props: IListJobsProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const jobsHeader = useMemo(() => trans.__('Notebook Jobs'), [trans]);
  const jobDefinitionsHeader = useMemo(
    () => trans.__('Notebook Job Definitions'),
    [trans]
  );

  // Display creation message
  const successMessage =
    props.newlyCreatedId !== undefined && props.newlyCreatedName !== undefined
      ? props.listView === JobsView.ListJobs
        ? trans.__(
            'Your job "%1" has been created. ' +
              'If you do not see it in the list below, please reload the list in a few seconds.',
            props.newlyCreatedName
          )
        : trans.__(
            'Your job definition "%1" has been created. ' +
              'If you do not see it in the list below, please reload the list in a few seconds.',
            props.newlyCreatedName
          )
      : null;

  const [displayInfo, setDisplayInfo] = useState<React.ReactNode | null>(
    successMessage
  );

  // Retrieve the initial jobs list
  return (
    <Box sx={{ p: 4 }} style={{ height: '100%', boxSizing: 'border-box' }}>
      <Stack spacing={3} style={{ height: '100%' }}>
        <Tabs
          value={props.listView}
          onChange={(
            _,
            newTab: JobsView.ListJobs | JobsView.ListJobDefinitions
          ) => props.showListView(newTab)}
        >
          <Tab label={jobsHeader} value={JobsView.ListJobs} />
          <Tab
            label={jobDefinitionsHeader}
            value={JobsView.ListJobDefinitions}
          />
        </Tabs>
        {displayInfo && (
          <Alert severity="info" onClose={() => setDisplayInfo(null)}>
            {displayInfo}
          </Alert>
        )}
        {props.listView === JobsView.ListJobs && (
          <>
            <Heading level={1}>{jobsHeader}</Heading>
            <ListJobsTable
              app={props.app}
              showCreateJob={props.showCreateJob}
              showJobDetail={props.showJobDetail}
            />
          </>
        )}
        {props.listView === JobsView.ListJobDefinitions && (
          <>
            <Heading level={1}>{jobDefinitionsHeader}</Heading>
            <ListJobDefinitionsTable
              app={props.app}
              showJobDefinitionDetail={props.showJobDefinitionDetail}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}
