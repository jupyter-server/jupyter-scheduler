import React from 'react';
import { caretDownIcon, caretUpIcon, LabIcon } from '@jupyterlab/ui-components';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';

import { AdvancedTableColumn, AdvancedTableQuery } from './advanced-table';
import { Scheduler } from '../../handler';

type AdvancedTableHeaderProps<Q extends AdvancedTableQuery> = {
  columns: AdvancedTableColumn[];
  query: Q;
  setQuery: React.Dispatch<React.SetStateAction<Q>>;
};

export function AdvancedTableHeader<Q extends AdvancedTableQuery>(
  props: AdvancedTableHeaderProps<Q>
): JSX.Element {
  return (
    <TableHead>
      {props.columns.map((column, idx) => (
        <AdvancedTableHeaderCell
          key={idx}
          column={column}
          query={props.query}
          setQuery={props.setQuery}
        />
      ))}
    </TableHead>
  );
}

const sortAscendingIcon = (
  <LabIcon.resolveReact icon={caretUpIcon} tag="span" />
);
const sortDescendingIcon = (
  <LabIcon.resolveReact icon={caretDownIcon} tag="span" />
);

type AdvancedTableHeaderCellProps<Q extends AdvancedTableQuery> = Pick<
  AdvancedTableHeaderProps<Q>,
  'query' | 'setQuery'
> & {
  column: AdvancedTableColumn;
};

function AdvancedTableHeaderCell<Q extends AdvancedTableQuery>(
  props: AdvancedTableHeaderCellProps<Q>
): JSX.Element {
  const sort = props.query.sort_by;
  const defaultSort = sort?.[0];

  const headerIsDefaultSort =
    defaultSort && defaultSort.name === props.column.sortField;
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
    if (!props.column.sortField) {
      return;
    }

    // Change the sort of this column.
    // If not sorted at all or if sorted descending, sort ascending. If sorted ascending, sort descending.
    const newSortDirection = isSortedAscending
      ? Scheduler.SortDirection.DESC
      : Scheduler.SortDirection.ASC;

    // Set the new sort direction.
    const newSort: Scheduler.ISortField = {
      name: props.column.sortField,
      direction: newSortDirection
    };

    // If this field is already present in the sort list, remove it.
    const oldSortList = sort || [];
    const newSortList = [
      newSort,
      ...oldSortList.filter(item => item.name !== props.column.sortField)
    ];

    // Sub the new sort list in to the query.
    props.setQuery(query => ({ ...query, sort_by: newSortList }));
  };

  return (
    <TableCell
      onClick={sortByThisColumn}
      sx={props.column.sortField ? { cursor: 'pointer' } : {}}
    >
      {props.column.name}
      {isSortedAscending && sortAscendingIcon}
      {isSortedDescending && sortDescendingIcon}
    </TableCell>
  );
}
