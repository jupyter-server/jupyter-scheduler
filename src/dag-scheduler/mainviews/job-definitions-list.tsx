import React, { useState, useCallback, useMemo, FC } from 'react';

import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { useWorkflows, useTranslator } from '../hooks';
import { buildJobDefinitionRow } from '../components/job-definition-row';
import { Scheduler } from '../handler';
import {
  AdvancedTable,
  AdvancedTableColumn
} from '../components/advanced-table';

import { DeploymentStatus } from '../contants';
import { useNavigate } from 'react-router-dom';
import { Add, Refresh } from '@mui/icons-material';

type JobDefinitionsListProps = {
  height?: 'auto' | string | number;
};

export const JobDefinitionsList: FC<JobDefinitionsListProps> = props => {
  const { api } = useWorkflows();
  const navigate = useNavigate();
  const trans = useTranslator('jupyterlab');
  const workflowsHeader = useMemo(() => trans.__('Workflows'), [trans]);

  const handleNavigate = (id: string) => {
    navigate(`/job-definitions/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/job-definitions/new');
  };

  const [jobDefsQuery, setJobDefsQuery] =
    useState<Scheduler.IListJobDefinitionsQuery>({});

  const [deletedRows, setDeletedRows] = useState<
    Set<Scheduler.IDescribeJobDefinition['job_definition_id']>
  >(new Set());

  const [displayError, setDisplayError] = useState<React.ReactNode | null>(
    null
  );

  const deleteRow = useCallback(
    (id: Scheduler.IDescribeJobDefinition['job_definition_id']) => {
      setDeletedRows(deletedRows => new Set([...deletedRows, id]));
    },
    []
  );

  const handleDelete = (id: string) => {
    setDisplayError(null);

    return api
      .deleteJobDefinition(id)
      .then(_ => deleteRow(id))
      .catch((error: Error) => setDisplayError(error.message));
  };

  const columns: AdvancedTableColumn[] = [
    {
      sortField: 'name',
      name: trans.__('Name'),
      field: 'name',
      filterable: true
    },
    {
      sortField: null,
      name: trans.__('Id'),
      field: 'job_definition_id',
      filterable: true
    },
    {
      sortField: 'status',
      name: trans.__('Status'),
      field: 'status',
      type: 'singleSelect',
      filterable: true,
      valueOptions: [
        {
          label: 'Creating',
          value: DeploymentStatus.CREATING
        },
        {
          label: 'Created',
          value: DeploymentStatus.CREATED
        },
        {
          label: 'Updated',
          value: DeploymentStatus.UPDATED
        },
        {
          label: 'Deploying',
          value: DeploymentStatus.DEPLOYING
        },
        {
          label: 'Deployed',
          value: DeploymentStatus.DEPLOYED
        },
        {
          label: 'Failed to create',
          value: DeploymentStatus.FAILED_TO_CREATE
        },
        {
          label: 'Failed to deploy',
          value: DeploymentStatus.FAILED_TO_DEPLOY
        },
        {
          label: 'Failed to update',
          value: DeploymentStatus.FAILED_TO_UPDATE
        }
      ]
    },
    {
      sortField: 'create_time',
      name: trans.__('Created at'),
      type: 'date',
      field: 'create_time',
      filterable: true
    },
    {
      sortField: null,
      name: trans.__('Schedule'),
      field: 'schedule',
      filterable: true
    },
    {
      sortField: null,
      name: trans.__('External links')
    },
    {
      sortField: null,
      name: trans.__('Actions')
    }
  ];

  const ToolbarComponent = (
    <Stack direction="row" gap={2} justifyContent="flex-end">
      <Button
        variant="text"
        size="small"
        startIcon={<Refresh />}
        onClick={() => {
          setDisplayError(null);
          setJobDefsQuery(query => ({ ...query }));
        }}
      >
        {trans.__('Reload')}
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<Add />}
        onClick={() => handleCreateNew()}
      >
        {trans.__('Create workflow')}
      </Button>
    </Stack>
  );

  const renderRow = (jobDef: Scheduler.IDescribeJobDefinition) =>
    buildJobDefinitionRow(
      jobDef,
      handleNavigate,
      handleDelete,
      () => setJobDefsQuery({}),
      setDisplayError
    );

  const rowFilter = (jobDef: Scheduler.IDescribeJobDefinition) =>
    !deletedRows.has(jobDef.job_definition_id);

  const emptyRowMessage = useMemo(
    () =>
      trans.__(
        'There are no workflows. ' +
          'To create a notebook workflow, right-click on a notebook in the file browser and select "Create Notebook Workflow".'
      ),
    [trans]
  );

  return (
    <Box
      sx={{
        p: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <Typography variant="h5" mb={4}>
        {workflowsHeader}
      </Typography>
      {displayError && (
        <Alert severity="error" onClose={() => setDisplayError(null)}>
          {displayError}
        </Alert>
      )}

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
        height={'100%'}
        toolbarComponent={ToolbarComponent}
      />
    </Box>
  );
};
