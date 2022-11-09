import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableBody from '@mui/material/TableBody';
import TablePagination, {
  LabelDisplayedRowsArgs
} from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';

import { Scheduler } from '../../handler';
import { AdvancedTableHeader } from './advanced-table-header';
import { useTranslator } from '../../hooks';
import { Alert } from '@mui/material';

const PAGE_SIZE = 25;

export type AdvancedTableColumn = {
  sortField: string | null;
  name: string;
};

type AdvancedTablePayload =
  | {
      next_token?: string;
      total_count?: number;
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
  pageSize?: number;
  /**
   * Height of the table. If set to 'auto', this table automatically expands to
   * fit the remaining height of the page when wrapped in a flex container with
   * its height equal to the height of the page. Otherwise the max-height is
   * manually set to whatever value is provided. Defaults to 'auto'.
   */
  height?: 'auto' | string | number;
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
  const [totalCount, setTotalCount] = useState<number>();
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const trans = useTranslator('jupyterlab');
  const theme = useTheme();

  const pageSize = props.pageSize ?? PAGE_SIZE;

  const fetchInitialRows = async () => {
    // reset pagination state
    setPage(0);
    setMaxPage(0);

    setLoading(true);
    setDisplayError(null); // Cancel previous errors

    props
      .request({
        ...props.query,
        max_items: pageSize
      })
      .then(payload => {
        setLoading(false);
        setRows(props.extractRows(payload));
        setNextToken(payload?.next_token);
        setTotalCount(payload?.total_count);
      })
      .catch((e: Error) => {
        setDisplayError(e.message);
      });
  };

  // Fetch the initial rows asynchronously on component creation
  // After setJobsQuery is called, force a reload.
  useEffect(() => {
    fetchInitialRows();
  }, [props.query]);

  const fetchMoreRows = async (newPage: number) => {
    // Do nothing if the next token is undefined (shouldn't happen, but required for type safety)
    if (nextToken === undefined) {
      return false;
    }

    // Apply the custom token to the existing query parameters
    setLoading(true);
    setDisplayError(null); // Cancel previous errors

    props
      .request({
        ...props.query,
        max_items: pageSize,
        next_token: nextToken
      })
      .then(payload => {
        setLoading(false);
        const newRows = props.extractRows(payload) || [];

        if (newRows.length === 0) {
          // no rows in next page -- leave page unchanged, disable next page
          // button, and show an error banner
          setNextToken(undefined);
          setDisplayError(trans.__('Last page reached.'));
          return;
        }

        // otherwise, merge the two lists of jobs and keep the next token from
        // the new response.
        setRows(rows => [
          ...(rows || []),
          ...(props.extractRows(payload) || [])
        ]);
        setNextToken(payload?.next_token);
        setTotalCount(payload?.total_count);
        setPage(newPage);
        setMaxPage(newPage);
      })
      .catch((e: Error) => {
        setDisplayError(e.message);
      });
  };

  const renderedRows: JSX.Element[] = useMemo(
    () =>
      (rows || [])
        .slice(page * pageSize, (page + 1) * pageSize)
        .filter(row => (props.rowFilter ? props.rowFilter(row) : true))
        .map(row => props.renderRow(row)),
    [rows, props.rowFilter, props.renderRow, page, pageSize]
  );

  const handlePageChange = async (e: unknown, newPage: number) => {
    // first clear any display errors
    setDisplayError(null);
    // if newPage <= maxPage, no need to fetch more rows
    if (newPage <= maxPage) {
      setPage(newPage);
      return;
    }

    await fetchMoreRows(newPage);
  };

  const onLastPage = page === maxPage && nextToken === undefined;

  const height = props.height ?? 'auto';

  /**
   * Renders the label to the left of the pagination buttons.
   */
  const labelDisplayedRows = useCallback(
    ({ from, to, count }: LabelDisplayedRowsArgs) => {
      if (count === -1) {
        const loadedRows = rows?.length ?? 0;
        if (onLastPage) {
          // for some reason `to` is set incorrectly on the last page in
          // server-side pagination, so we need to build the string differently
          // in this case.
          return trans.__('%1–%2 of %3', from, loadedRows, loadedRows);
        } else {
          return trans.__(
            '%1–%2 of %3',
            from,
            to,
            loadedRows + (nextToken === undefined ? '' : '+')
          );
        }
      } else {
        return trans.__('%1–%2 of %3', from, to, count);
      }
    },
    [rows, onLastPage, trans]
  );

  if (rows && !rows.length) {
    return (
      <p className={'jp-notebook-job-list-empty'}>{props.emptyRowMessage}</p>
    );
  }

  const tableDiv = (
    <div
      style={height === 'auto' ? { flex: 1, height: 0 } : { maxHeight: height }}
    >
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
          count={totalCount ?? -1}
          labelDisplayedRows={labelDisplayedRows}
          page={page}
          onPageChange={handlePageChange}
          nextIconButtonProps={{
            disabled: onLastPage
          }}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[pageSize]}
        />
      </TableContainer>
    </div>
  );

  return (
    <>
      {displayError && <Alert severity="error">{displayError}</Alert>}
      {tableDiv}
    </>
  );
}
