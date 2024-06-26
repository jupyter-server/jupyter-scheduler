import React, { useState, useCallback, useMemo, FC } from 'react';

import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';

import { useWorkflows, useTranslator } from '../hooks';
import { buildJobRow } from '../components/job-row';
import { Scheduler } from '../handler';
import {
  AdvancedTable,
  AdvancedTableColumn
} from '../components/advanced-table';
import { useNavigate, useParams } from 'react-router-dom';
import { Refresh } from '@mui/icons-material';
import { WorkflowsViewType } from '../contants';
import { PageHeader } from '../components/styled';

type IListJobsTableProps = {
  // function that shows job detail view
  pageSize?: number;
  jobDefinitionId?: string;
  emptyRowMessage?: string;
  height?: 'auto' | string | number;
  showJobDetail: (jobId: string) => void;
};

export const ListJobsTable: FC<IListJobsTableProps> = props => {
  const trans = useTranslator('jupyterlab');
  const { api, currentWorkflow } = useWorkflows();

  const [jobsQuery, setJobsQuery] = useState<Scheduler.IListJobsQuery>(
    props.jobDefinitionId
      ? {
          job_definition_id: props.jobDefinitionId,
          version: currentWorkflow?.version
        }
      : {}
  );
  const [displayError, setDisplayError] = useState<React.ReactNode | null>(
    null
  );

  const reload = useCallback(() => {
    setJobsQuery(query => ({ ...query }));
  }, []);

  const reloadButton = (
    <Stack direction="row" justifyContent="flex-end">
      <Button
        variant="text"
        size="small"
        startIcon={<Refresh />}
        onClick={reload}
      >
        {trans.__('Reload')}
      </Button>
    </Stack>
  );

  // Display column headers with sort indicators.
  const columns: AdvancedTableColumn[] = [
    {
      sortField: 'runId',
      name: trans.__('Run Id'),
      filterable: true,
      field: 'runId'
    },
    {
      sortField: null,
      name: trans.__('Id'),
      filterable: true,
      field: 'job_id'
    },
    {
      sortField: 'status', // This will sort on the server status, not localized
      name: trans.__('Status'),
      filterable: true,
      field: 'status',
      type: 'singleSelect',
      valueOptions: [
        {
          label: 'Not started',
          value: 'NOT_STARTED'
        },

        {
          label: 'In progress',
          value: 'IN_PROGRESS'
        },

        {
          label: 'Running',
          value: 'RUNNING'
        },

        {
          label: 'Completed',
          value: 'COMPLETED'
        },
        {
          label: 'Failed',
          value: 'FAILED'
        },

        {
          label: 'Stopping',
          value: 'STOPPING'
        }
      ]
    },
    {
      sortField: 'create_time',
      name: trans.__('Created at'),
      field: 'create_time',
      type: 'date',
      filterable: true
    },

    {
      sortField: null,
      name: trans.__('External links')
    }
  ];

  const renderRow = (job: Scheduler.IDescribeJob) =>
    buildJobRow(job, props.showJobDetail);

  const emptyRowMessage = useMemo(
    () =>
      props.emptyRowMessage ??
      trans.__(
        'There are no workflow runs. Notebook workflows run files in the background, immediately or on a schedule. '
      ),
    [props.emptyRowMessage, trans]
  );

  // note that root element here must be a JSX fragment for DataGrid to be sized properly
  return (
    <>
      {displayError && (
        <Alert severity="error" onClose={() => setDisplayError(null)}>
          {displayError}
        </Alert>
      )}
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
        height={props.height}
        pageSize={props.pageSize}
        toolbarComponent={reloadButton}
      />
    </>
  );
};

type Props = { readOnly?: boolean };

const JobRunsList: FC<Props> = props => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentWorkflow } = useWorkflows();
  const trans = useTranslator('jupyterlab');

  const handleNavigate = (id: string) => {
    navigate(
      `/job-definitions/${jobId}/runs/${id}?version=${
        currentWorkflow?.version || 'v2'
      }`
    );
  };

  return (
    <Stack sx={{ height: '100%' }}>
      <PageHeader sx={{ p: 3 }}>
        <Typography variant="h6" color="text.primary">
          {currentWorkflow?.name || 'Untitled'}
        </Typography>
        <Stack direction="row" gap={2} ml="auto" />
      </PageHeader>
      <Stack sx={{ pb: 4, height: '100%', overflow: 'scroll' }}>
        <Tabs value={WorkflowsViewType.Runs}>
          <Tab
            label={trans.__(WorkflowsViewType.Runs)}
            value={WorkflowsViewType.Runs}
          />
          <Tab
            label={trans.__(WorkflowsViewType.Tasks)}
            value={WorkflowsViewType.Tasks}
            onClick={() => navigate(`/job-definitions/${jobId}`)}
          />
        </Tabs>
        <Box
          sx={{
            margin: 0,
            height: '100%',
            padding: '12px',
            overflow: 'hidden'
          }}
        >
          <ListJobsTable
            height="100%"
            jobDefinitionId={jobId}
            showJobDetail={handleNavigate}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default JobRunsList;
