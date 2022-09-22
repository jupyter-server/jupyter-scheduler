import React, { useEffect, useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { useTranslator } from '../hooks';

import { JobRow } from '../components/job-row';
import {
  ICreateJobModel, 
  IListJobsModel,
  INotebookJobsWithToken
} from '../model';
import { caretDownIcon, caretUpIcon, LabIcon } from '@jupyterlab/ui-components';
import { Scheduler, SchedulerService } from '../handler';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';

import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Stack from '@mui/system/Stack';

const ListItemClass = 'jp-notebook-job-list-item';

export const JobListPageSize = 25;

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
}

// Used for table cells including headers
const jobTraitClass = 'jp-notebook-job-list-trait';

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

  const fetchInitialRows = () => {
    // Get initial job list (next_token is undefined)
    props.getJobs(jobsQuery).then(initialNotebookJobs => {
      setNotebookJobs(initialNotebookJobs);
    });
  };

  // Fetch the initial rows asynchronously on component creation
  // After setJobsQuery is called, force a reload.
  useEffect(() => fetchInitialRows(), [jobsQuery]);

  const fetchMoreRows = async (next_token: string | undefined) => {
    // Do nothing if the next token is undefined (shouldn't happen, but required for type safety)
    if (next_token === undefined) {
      return;
    }

    // Apply the custom token to the existing query parameters
    const newNotebookJobs = await props.getJobs({ ...jobsQuery, next_token });

    if (!newNotebookJobs) {
      return;
    }

    // Merge the two lists of jobs and keep the next token from the new response.
    setNotebookJobs({
      jobs: [...(notebookJobs?.jobs || []), ...(newNotebookJobs?.jobs || [])],
      next_token: newNotebookJobs.next_token
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
      sortField: 'start_time',
      name: trans.__('Start time')
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

  return (
    <>
      {reloadButton}
      <div className={`${ListItemClass} jp-notebook-job-list-header`}>
        {columns.map((column, idx) => (
          <NotebookJobsColumnHeader
            key={idx}
            gridColumn={column}
            jobsQuery={jobsQuery}
            setJobsQuery={setJobsQuery}
          />
        ))}
      </div>
      {notebookJobs.jobs.map(job => (
        <JobRow
          key={job.job_id}
          job={job}
          rowClass={ListItemClass}
          cellClass={jobTraitClass}
          app={props.app}
          showCreateJob={props.showCreateJob}
        />
      ))}
      {notebookJobs.next_token !== undefined && (
        <Button
          onClick={(e: React.MouseEvent<HTMLElement>) =>
            fetchMoreRows(notebookJobs.next_token)
          }
        >
          {trans.__('Show more')}
        </Button>
      )}
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
    <div className={jobTraitClass} onClick={sortByThisColumn}>
      {props.gridColumn.name}
      {isSortedAscending && sortAscendingIcon}
      {isSortedDescending && sortDescendingIcon}
    </div>
  );
}

function getJobs(
  jobQuery: Scheduler.IListJobsQuery
): Promise<INotebookJobsWithToken | undefined> {
  const api = new SchedulerService({});

  // Impose max_items if not otherwise specified.
  if (jobQuery['max_items'] === undefined) {
    jobQuery.max_items = JobListPageSize;
  }

  return api.getJobs(jobQuery);
}

export interface IListJobsProps {
  app: JupyterFrontEnd;
  model: IListJobsModel;
  modelChanged: (model: IListJobsModel) => void;
  showCreateJob: (newModel: ICreateJobModel) => void;
}

export function NotebookJobsList(props: IListJobsProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  // Retrieve the initial jobs list
  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Heading level={1}>{trans.__('Notebook Jobs')}</Heading>
        <NotebookJobsListBody
          showHeaders={true}
          app={props.app}
          showCreateJob={props.showCreateJob}
          getJobs={getJobs}
        />
      </Stack>
    </Box>
  );
}
