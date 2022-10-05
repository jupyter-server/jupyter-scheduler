import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { Heading } from '../components/heading';
import { useTranslator } from '../hooks';
import { buildTableRow } from '../components/job-row';
import { ICreateJobModel, IListJobsModel } from '../model';
import { Scheduler, SchedulerService } from '../handler';
import { Cluster } from '../components/cluster';
import { AdvancedTable } from '../components/advanced-table';

interface INotebookJobsListBodyProps {
  startToken?: string;
  app: JupyterFrontEnd;
  // Function that results in the create job form being made visible
  // with job details prepopulated.
  showCreateJob: (state: ICreateJobModel) => void;
  // function that shows job detail view
  showDetailView: (jobId: string) => void;
}

type GridColumn = {
  sortField: string | null;
  name: string;
};

export function NotebookJobsListBody(
  props: INotebookJobsListBodyProps
): JSX.Element {
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
  const columns: GridColumn[] = [
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
    buildTableRow(
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

export interface IListJobsProps {
  app: JupyterFrontEnd;
  model: IListJobsModel;
  handleModelChange: (model: IListJobsModel) => void;
  showCreateJob: (newModel: ICreateJobModel) => void;
  showDetailView: (jobId: string) => void;
}

export function NotebookJobsList(props: IListJobsProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  // Retrieve the initial jobs list
  return (
    <Box sx={{ p: 4 }} style={{ height: '100%', boxSizing: 'border-box' }}>
      <Stack spacing={3} style={{ height: '100%' }}>
        <Heading level={1}>{trans.__('Notebook Jobs')}</Heading>
        <NotebookJobsListBody
          app={props.app}
          showCreateJob={props.showCreateJob}
          showDetailView={props.showDetailView}
        />
      </Stack>
    </Box>
  );
}
