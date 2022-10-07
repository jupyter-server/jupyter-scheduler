import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { Heading } from '../components/heading';
import { useTranslator } from '../hooks';
import { buildJobRow } from '../components/job-row';
import { buildJobDefinitionRow } from '../components/job-definition-row';
import { ICreateJobModel, IListJobsModel } from '../model';
import { Scheduler, SchedulerService } from '../handler';
import { Cluster } from '../components/cluster';
import {
  AdvancedTable,
  AdvancedTableColumn
} from '../components/advanced-table';

interface IListJobsTableProps {
  startToken?: string;
  app: JupyterFrontEnd;
  // Function that results in the create job form being made visible
  // with job details prepopulated.
  showCreateJob: (state: ICreateJobModel) => void;
  // function that shows job detail view
  showDetailView: (jobId: string) => void;
}

function ListJobsTable(props: IListJobsTableProps): JSX.Element {
  const [jobsQuery, setJobsQuery] = useState<Scheduler.IListJobsQuery>({});
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

  const reloadButton = (
    <Cluster justifyContent="flex-end">
      <Button variant="contained" size="small" onClick={() => setJobsQuery({})}>
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
      sortField: 'input_uri',
      name: trans.__('Input file')
    },
    {
      sortField: null, // Output prefix is not visible in UI
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
      props.showDetailView
    );

  const rowFilter = (job: Scheduler.IDescribeJob) =>
    !deletedRows.has(job.job_id);

  const emptyRowMessage = useMemo(
    () =>
      trans.__(
        'There are no notebook jobs. ' +
          'Right-click on a file in the file browser to run or schedule a notebook as a job.'
      ),
    [trans]
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
  const api = useMemo(() => new SchedulerService({}), []);

  const columns: AdvancedTableColumn[] = [
    {
      sortField: 'name',
      name: trans.__('Job definition name')
    }
  ];

  const reloadButton = (
    <Cluster justifyContent="flex-end">
      <Button
        variant="contained"
        size="small"
        onClick={() => setJobDefsQuery({})}
      >
        {trans.__('Reload')}
      </Button>
    </Cluster>
  );

  const renderRow = (jobDef: Scheduler.IDescribeJobDefinition) =>
    buildJobDefinitionRow(jobDef, props.app, props.showJobDefinitionDetail);

  const emptyRowMessage = useMemo(
    () => trans.__('There are no notebook job definitions.'),
    [trans]
  );

  return (
    <>
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
      />
    </>
  );
}

export interface IListJobsProps {
  app: JupyterFrontEnd;
  model: IListJobsModel;
  handleModelChange: (model: IListJobsModel) => void;
  showCreateJob: (newModel: ICreateJobModel) => void;
  showJobDetail: (jobId: string) => void;
  showJobDefinitionDetail: (jobDefId: string) => void;
}

export function NotebookJobsList(props: IListJobsProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const [tab, setTab] = useState<number>(0);

  const jobsHeader = useMemo(() => trans.__('Notebook Jobs'), [trans]);
  const jobDefinitionsHeader = useMemo(
    () => trans.__('Notebook Job Definitions'),
    [trans]
  );

  // Retrieve the initial jobs list
  return (
    <Box sx={{ p: 4 }} style={{ height: '100%', boxSizing: 'border-box' }}>
      <Stack spacing={3} style={{ height: '100%' }}>
        <Tabs value={tab} onChange={(_, newTab) => setTab(newTab)}>
          <Tab label={jobsHeader} />
          <Tab label={jobDefinitionsHeader} />
        </Tabs>
        {tab === 0 && (
          <>
            <Heading level={1}>{jobsHeader}</Heading>
            <ListJobsTable
              app={props.app}
              showCreateJob={props.showCreateJob}
              showDetailView={props.showJobDetail}
            />
          </>
        )}
        {tab === 1 && (
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
