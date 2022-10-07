import React, { useEffect, useState } from 'react';

import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableBody from '@mui/material/TableBody';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';

import { Scheduler } from '../../handler';
import { AdvancedTableHeader } from './advanced-table-header';

const PAGE_SIZE = 25;

export type AdvancedTableColumn = {
  sortField: string | null;
  name: string;
};

type AdvancedTablePayload =
  | {
      next_token?: string;
      total_count: number;
    }
  | undefined;

export type AdvancedTableQuery = {
  max_items?: number;
  next_token?: string;
  sort_by?: Scheduler.ISortField[];
};

/**
 * P = payload (response) type, Q = query (request) type, R = row type
 *
 * Requires `next_token` to be defined in Q to function.
 */
type AdvancedTableProps<
  P extends AdvancedTablePayload,
  Q extends AdvancedTableQuery,
  R
> = {
  query: Q;
  setQuery: React.Dispatch<React.SetStateAction<Q>>;
  request: (query: Q) => Promise<P>;
  renderRow: (row: R) => JSX.Element;
  extractRows: (payload: P) => R[];
  columns: AdvancedTableColumn[];
  emptyRowMessage: string;
  rowFilter?: (row: R) => boolean;
};

/**
 * Advanced table that automatically fills remaining screen width, asynchronous
 * pagination, and loading states.
 */
export function AdvancedTable<
  P extends AdvancedTablePayload,
  Q extends AdvancedTableQuery,
  R
>(props: AdvancedTableProps<P, Q, R>): JSX.Element {
  const [rows, setRows] = useState<R[]>();
  const [nextToken, setNextToken] = useState<string>();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const theme = useTheme();

  const fetchInitialRows = async () => {
    // reset pagination state
    setPage(0);
    setMaxPage(0);

    setLoading(true);
    const payload = await props.request({
      ...props.query,
      max_items: PAGE_SIZE
    });
    setLoading(false);

    // TODO: more elegant handling of a failed network request.
    if (!payload) {
      return;
    }

    setRows(props.extractRows(payload));
    setNextToken(payload.next_token);
    setTotalCount(payload.total_count);
  };

  // Fetch the initial rows asynchronously on component creation
  // After setJobsQuery is called, force a reload.
  useEffect(() => {
    fetchInitialRows();
  }, [props.query]);

  const fetchMoreRows = async () => {
    // Do nothing if the next token is undefined (shouldn't happen, but required for type safety)
    if (nextToken === undefined) {
      return;
    }

    // Apply the custom token to the existing query parameters
    setLoading(true);
    const payload = await props.request({
      ...props.query,
      max_items: PAGE_SIZE,
      next_token: nextToken
    });
    setLoading(false);

    if (!payload) {
      return;
    }

    // Merge the two lists of jobs and keep the next token from the new response.
    setRows(rows => [...(rows || []), ...(props.extractRows(payload) || [])]);
    setNextToken(payload.next_token);
    setTotalCount(payload.total_count);
  };

  if (rows && !rows.length) {
    return (
      <p className={'jp-notebook-job-list-empty'}>{props.emptyRowMessage}</p>
    );
  }

  const renderedRows: JSX.Element[] = (rows || [])
    .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    .filter(row => (props.rowFilter ? props.rowFilter(row) : true))
    .map(row => props.renderRow(row));

  const handlePageChange = async (e: unknown, newPage: number) => {
    // if newPage <= maxPage, no need to fetch more rows
    if (newPage <= maxPage) {
      setPage(newPage);
      return;
    }

    await fetchMoreRows();
    setPage(newPage);
    setMaxPage(newPage);
  };

  // outer div expands to fill rest of screen
  return (
    <div style={{ flex: 1, height: 0 }}>
      <TableContainer
        component={Paper}
        sx={{
          height: '100%',
          ...(loading ? { pointerEvents: 'none', opacity: 0.5 } : {})
        }}
      >
        <Table stickyHeader>
          <AdvancedTableHeader
            columns={props.columns}
            query={props.query}
            setQuery={props.setQuery}
          />
          <TableBody>{renderedRows}</TableBody>
        </Table>
        <TablePagination
          component="div"
          sx={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          nextIconButtonProps={{
            disabled: page === maxPage && !nextToken
          }}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </TableContainer>
    </div>
  );
}
