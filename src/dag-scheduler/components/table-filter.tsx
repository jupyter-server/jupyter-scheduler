import React, { FC, useEffect, useRef, useState } from 'react';
import {
  AddCircle,
  ClearAll,
  CloseOutlined,
  FilterList
} from '@mui/icons-material';
import {
  Badge,
  Button,
  Chip,
  ClickAwayListener,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popper,
  Select
} from '@mui/material';
import { Stack } from '@mui/system';
import { AdvancedTableColumn } from './advanced-table';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import { FilterItem, getFilterFunctions, operators } from '../util/filters';
import { parseDate } from '../util';

const DEFAULT_ITEM: FilterItem = { field: '', condition: '', value: '' };

type Props = {
  columns: AdvancedTableColumn[];
  onFilterChange: (filters: any[]) => void;
};

export const TableFilter: FC<Props> = ({ onFilterChange, columns }) => {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const filterableColumns = columns.filter(c => c.filterable);

  const handleToggle = () => {
    setOpen(state => !state);
  };

  const handleApplyFilter = (value: FilterItem[] = []) => {
    const nextState = value.filter(
      item => item.condition && item.field && item.value
    );

    setOpen(false);
    setFilters(nextState);
  };

  const handleDelete = (index: number) => {
    const nextState = filters.slice();

    nextState.splice(index, 1);

    setFilters(nextState);
  };

  useEffect(() => {
    onFilterChange(getFilterFunctions(filters));
  }, [filters]);

  if (!filterableColumns.length) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Stack spacing={4} direction="row" my={2}>
        <Button
          startIcon={
            <Badge badgeContent={filters.length} color="primary">
              <FilterList />
            </Badge>
          }
          onClick={handleToggle}
          ref={anchorRef}
        >
          Filter
        </Button>
        <Stack spacing={2} direction={'row'} alignItems="center" gap={1}>
          {filters.map((item, index) => {
            const Component = (
              <>
                <b>{item.field}:</b>&nbsp;{item.condition}&nbsp;{item.value}
              </>
            );

            return (
              <Chip
                key={index}
                size="small"
                label={Component}
                onClick={handleToggle}
                onDelete={() => handleDelete(index)}
              />
            );
          })}
          {filters.length ? (
            <IconButton
              size="small"
              sx={{ height: 28, width: 28 }}
              title="Clear all"
              onClick={() => setFilters([])}
            >
              <ClearAll />
            </IconButton>
          ) : null}
        </Stack>
        <Popper
          open={open}
          modifiers={[]}
          placement="bottom-start"
          anchorEl={anchorRef.current}
        >
          <ClickAwayListener onClickAway={handleToggle} mouseEvent="onMouseUp">
            <Paper
              elevation={3}
              sx={{
                padding: '10px'
              }}
            >
              <FilterForm
                value={filters}
                onClose={handleToggle}
                onSave={handleApplyFilter}
                columns={filterableColumns}
              />
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Stack>
    </LocalizationProvider>
  );
};

type FilterFormProps = {
  value: FilterItem[];
  onClose: () => void;
  columns: AdvancedTableColumn[];
  onSave: (value: FilterItem[]) => void;
};

function FilterForm({ value, columns, onSave, onClose }: FilterFormProps) {
  const [filters, setFilters] = useState<FilterItem[]>(
    value.length ? [...value] : [{ ...DEFAULT_ITEM }]
  );

  const handleInputChange =
    (index: number) => (fieldName: keyof FilterItem, fieldValue: string) => {
      const nextState = filters.length
        ? filters.slice()
        : [{ ...DEFAULT_ITEM }];

      nextState[index][fieldName] = fieldValue;

      // Reset the filter value, if column is changed and retain the condition if possible
      if (fieldName === 'field') {
        const currentColumn = columns.find(c => c.field === fieldValue);
        const { type } = currentColumn || ({} as AdvancedTableColumn);

        const current = nextState[index]['condition'];
        const { options } = operators[type || 'string'];
        const isConditionValid = options.find(o => o === current);

        const defaultOp =
          (isConditionValid ? current : null) || (fieldValue ? options[0] : '');

        nextState[index]['value'] = '';
        nextState[index]['condition'] = defaultOp;
      }

      setFilters(nextState);
    };

  const handleAddFilter = () => {
    setFilters([...filters, { ...DEFAULT_ITEM }]);
  };

  const handleDelete = (index: number) => {
    const nextState = filters.slice();

    nextState.splice(index, 1);

    if (!nextState.length) {
      onSave([]);
    }

    setFilters(nextState);
  };

  return (
    <Stack spacing={0}>
      {filters.map(({ field, condition, value }, index: number) => (
        <FilterRow
          value={value}
          field={field}
          columns={columns}
          condition={condition}
          onChange={handleInputChange(index)}
          onDelete={() => handleDelete(index)}
        />
      ))}
      <div style={{ marginTop: '8px' }}>
        <Button
          startIcon={
            <AddCircle
              titleAccess={
                filters.length === 5 ? 'Only 5 filters are allowed' : ''
              }
            />
          }
          onClick={handleAddFilter}
          disabled={filters.length === 5}
        >
          Add filter
        </Button>
      </div>
      <Stack justifyContent="flex-end" direction="row" gap={2}>
        <Button size="small" color="info" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => onSave(filters)}
        >
          Apply
        </Button>
      </Stack>
    </Stack>
  );
}

type FilterRowProps = {
  value: string;
  field: string;
  condition: string;
  onDelete: () => void;
  columns: AdvancedTableColumn[];
  onChange: (name: keyof FilterItem, value: string) => void;
};

type ColumnTypeKeys = keyof typeof operators;

function FilterRow({
  columns,
  onChange,
  onDelete,
  field,
  value,
  condition
}: FilterRowProps) {
  const opRef = useRef<any>();
  const valRef = useRef<any>();

  const currentColumn = columns.find(c => c.field === field);
  const { type: dataType, valueOptions } = currentColumn || {};
  const [columnType, setColumnType] = useState<ColumnTypeKeys | undefined>(
    dataType || 'string'
  );

  const { options, Component, ComponentProps } =
    operators[columnType || 'string'];

  const isDateType = columnType === 'date';

  const handleColumnChange = (event: any) => {
    const { name, value } = event.target;
    const item = columns.find(c => c.field === value);

    setColumnType(item?.type);
    onChange(name, value);
  };

  const handleConditionChange = (event: any) => {
    onChange('condition', event.target.value);
  };

  const handleValueChange = (event: any) => {
    onChange('value', isDateType ? event.format() : event.target.value);
  };

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="field-selector-label">Columns</InputLabel>
        <Select
          labelId="field-selector-label"
          id="field-selector"
          label="Columns"
          name="field"
          value={field}
          onChange={handleColumnChange}
          onClose={() => setTimeout(() => opRef.current?.focus(), 0)}
        >
          {columns.map((item, colIndex) => (
            <MenuItem key={colIndex} value={item.field}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ m: 1, width: 120 }}>
        <InputLabel id="condition-selector-label">Operator</InputLabel>
        <Select
          labelId="condition-selector-label"
          id="condition-selector"
          label="Operator"
          name="condition"
          inputRef={opRef}
          value={condition}
          onChange={handleConditionChange}
          onClose={() => setTimeout(() => valRef.current?.focus(), 0)}
        >
          {options.map(item => (
            <MenuItem value={item}>{item}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Component
        name="value"
        inputRef={valRef}
        label="Filter value"
        placeholder="Filter value"
        sx={{ my: 1, width: 200 }}
        onChange={handleValueChange}
        value={isDateType ? parseDate(value) : value}
        {...ComponentProps}
        {...{ options: valueOptions }}
      />
      <IconButton onClick={onDelete}>
        <CloseOutlined />
      </IconButton>
    </Stack>
  );
}
