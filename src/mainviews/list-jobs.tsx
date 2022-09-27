/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { useTranslator } from '../hooks';

import { buildTableRow } from '../components/job-row';
import {
  INotebookJobsWithToken,
  ICreateJobModel,
  IListJobsModel
} from '../model';
import { caretDownIcon, caretUpIcon, LabIcon } from '@jupyterlab/ui-components';
import { Scheduler, SchedulerService } from '../handler';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';

import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Stack from '@mui/system/Stack';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';

export const PAGE_SIZE = 25;

interface INotebookJobsListBodyProps {
  showHeaders?: boolean;
  startToken?: string;
  app: JupyterFrontEnd;
  // Function that results in the create job form being made visible
  // with job details prepopulated.
  showCreateJob: (state: ICreateJobModel) => void;
  // Function that retrieves some jobs
  getJobs: (
    query: Scheduler.IListJobsQuery
  ) => Promise<INotebookJobsWithToken | undefined>;
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
  const [notebookJobs, setNotebookJobs] = useState<
    INotebookJobsWithToken | undefined
  >(undefined);
  const [jobsQuery, setJobsQuery] = useState<Scheduler.IListJobsQuery>({});
  const [deletedRows, setDeletedRows] = useState<
    Set<Scheduler.IDescribeJob['job_id']>
  >(new Set());
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useTheme();

  const deleteRow = useCallback((id: Scheduler.IDescribeJob['job_id']) => {
    setDeletedRows(deletedRows => new Set([...deletedRows, id]));
  }, []);

  const fetchInitialRows = async () => {
    // reset pagination state
    setPage(0);
    setMaxPage(0);
    // Get initial job list (next_token is undefined)
    setLoading(true);
    const initialNotebookJobs = await props.getJobs(jobsQuery);
    setLoading(false);
    setNotebookJobs(initialNotebookJobs);
  };

  // Fetch the initial rows asynchronously on component creation
  // After setJobsQuery is called, force a reload.
  useEffect(() => {
    fetchInitialRows();
  }, [jobsQuery]);

  const fetchMoreRows = async (next_token: string | undefined) => {
    // Do nothing if the next token is undefined (shouldn't happen, but required for type safety)
    if (next_token === undefined) {
      return;
    }

    // Apply the custom token to the existing query parameters
    setLoading(true);
    const newNotebookJobs = await props.getJobs({ ...jobsQuery, next_token });
    setLoading(false);

    if (!newNotebookJobs) {
      return;
    }

    // Merge the two lists of jobs and keep the next token from the new response.
    setNotebookJobs({
      jobs: [...(notebookJobs?.jobs || []), ...(newNotebookJobs?.jobs || [])],
      next_token: newNotebookJobs.next_token,
      total_count: newNotebookJobs.total_count
    });
  };

  const trans = useTranslator('jupyterlab');

  const reloadButton = (
    <Cluster justifyContent="flex-end">
      <Button
        variant="contained"
        size="small"
        onClick={() => fetchInitialRows()}
      >
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

  if (notebookJobs === undefined) {
    return (
      <p>
        <em>{trans.__('Loading …')}</em>
      </p>
    );
  }

  if (!notebookJobs?.jobs.length) {
    return (
      <>
        {reloadButton}
        <p className={'jp-notebook-job-list-empty'}>
          {trans.__(
            'There are no notebook jobs. ' +
              'Right-click on a file in the file browser to run or schedule a notebook as a job.'
          )}
        </p>
      </>
    );
  }

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
      name: trans.__('Create time')
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

  const rows: JSX.Element[] = notebookJobs.jobs
    .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    .filter(job => !deletedRows.has(job.job_id))
    .map(job =>
      buildTableRow(
        job,
        props.app,
        props.showCreateJob,
        deleteRow,
        translateStatus,
        props.showDetailView
      )
    );

  const handlePageChange = async (e: unknown, newPage: number) => {
    // if newPage <= maxPage, no need to fetch more rows
    if (newPage <= maxPage) {
      setPage(newPage);
      return;
    }

    await fetchMoreRows(notebookJobs.next_token);
    setPage(newPage);
    setMaxPage(newPage);
  };

  // note that the parent must be a JSX fragment for DataGrid to be sized properly
  return (
    <>
      {reloadButton}
      {/* outer div expands to fill rest of screen */}
      <div style={{ flex: 1, height: 0 }}>
        <TableContainer
          component={Paper}
          sx={{
            height: '100%',
            ...(loading ? { pointerEvents: 'none', opacity: 0.5 } : {})
          }}
        >
          <Table stickyHeader>
            <TableHead>
              {columns.map((column, idx) => (
                <NotebookJobsColumnHeader
                  key={idx}
                  gridColumn={column}
                  jobsQuery={jobsQuery}
                  setJobsQuery={setJobsQuery}
                />
              ))}
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
          <TablePagination
            component="div"
            sx={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`
            }}
            count={notebookJobs.total_count}
            page={page}
            onPageChange={handlePageChange}
            nextIconButtonProps={{
              disabled: page === maxPage && !notebookJobs.next_token
            }}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </TableContainer>
      </div>
    </>
  );
}

interface INotebookJobsColumnHeaderProps {
  gridColumn: GridColumn;
  jobsQuery: Scheduler.IListJobsQuery;
  setJobsQuery: React.Dispatch<React.SetStateAction<Scheduler.IListJobsQuery>>;
}

const sortAscendingIcon = (
  <LabIcon.resolveReact icon={caretUpIcon} tag="span" />
);
const sortDescendingIcon = (
  <LabIcon.resolveReact icon={caretDownIcon} tag="span" />
);

function NotebookJobsColumnHeader(
  props: INotebookJobsColumnHeaderProps
): JSX.Element {
  const sort = props.jobsQuery.sort_by;
  const defaultSort = sort?.[0];

  const headerIsDefaultSort =
    defaultSort && defaultSort.name === props.gridColumn.sortField;
  const isSortedAscending =
    headerIsDefaultSort &&
    defaultSort &&
    defaultSort.direction === Scheduler.SortDirection.ASC;
  const isSortedDescending =
    headerIsDefaultSort &&
    defaultSort &&
    defaultSort.direction === Scheduler.SortDirection.DESC;

  const sortByThisColumn = () => {
    // If this field is not sortable, do nothing.
    if (!props.gridColumn.sortField) {
      return;
    }

    // Change the sort of this column.
    // If not sorted at all or if sorted descending, sort ascending. If sorted ascending, sort descending.
    const newSortDirection = isSortedAscending
      ? Scheduler.SortDirection.DESC
      : Scheduler.SortDirection.ASC;

    // Set the new sort direction.
    const newSort: Scheduler.ISortField = {
      name: props.gridColumn.sortField,
      direction: newSortDirection
    };

    // If this field is already present in the sort list, remove it.
    const oldSortList = sort || [];
    const newSortList = [
      newSort,
      ...oldSortList.filter(item => item.name !== props.gridColumn.sortField)
    ];

    // Sub the new sort list in to the query.
    props.setJobsQuery({ ...props.jobsQuery, sort_by: newSortList });
  };

  return (
    <TableCell
      onClick={sortByThisColumn}
      sx={props.gridColumn.sortField ? { cursor: 'pointer' } : {}}
    >
      {props.gridColumn.name}
      {isSortedAscending && sortAscendingIcon}
      {isSortedDescending && sortDescendingIcon}
    </TableCell>
  );
}

function getJobs(
  jobQuery: Scheduler.IListJobsQuery
): Promise<INotebookJobsWithToken | undefined> {
  const api = new SchedulerService({});

  // Impose max_items if not otherwise specified.
  if (jobQuery['max_items'] === undefined) {
    jobQuery.max_items = PAGE_SIZE;
  }

  return api.getJobs(jobQuery);
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
          showHeaders={true}
          app={props.app}
          showCreateJob={props.showCreateJob}
          getJobs={getJobs}
          showDetailView={props.showDetailView}
        />
      </Stack>
    </Box>
  );
}
