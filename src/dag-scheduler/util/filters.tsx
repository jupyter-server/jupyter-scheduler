import React, { forwardRef } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

function escapeRegExp(value: string): string {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export const operatorFunctions = {
  eq: (cellValue: string, filterValue: string): boolean => {
    const collator = new Intl.Collator(undefined, {
      usage: 'search',
      sensitivity: 'base'
    });

    return collator.compare(cellValue.toString().trim(), filterValue) === 0;
  },
  neq: (cellValue: string, filterValue: string): boolean => {
    return !operatorFunctions.eq(cellValue, filterValue);
  },
  contains: (cellValue: string, filterValue: string): boolean => {
    const filterRegex = new RegExp(escapeRegExp(filterValue), 'i');

    return filterRegex.test(cellValue.toString());
  },
  notContains: (cellValue: string, filterValue: string): boolean => {
    return !operatorFunctions.contains(cellValue, filterValue);
  },
  startsWith: (cellValue: string, filterValue: string): boolean => {
    const filterRegex = new RegExp(`^${escapeRegExp(filterValue)}.*`, 'i');

    return filterRegex.test(cellValue.toString());
  },
  endsWith: (cellValue: string, filterValue: string): boolean => {
    const filterRegex = new RegExp(`.*${escapeRegExp(filterValue)}$`, 'i');

    return filterRegex.test(cellValue.toString());
  },
  is: (cellValue: string, filterValue: string): boolean => {
    return operatorFunctions.eq(cellValue, filterValue);
  },
  isNot: (cellValue: string, filterValue: string): boolean => {
    return !operatorFunctions.eq(cellValue, filterValue);
  },
  isAfter: (cellValue: string, value: string): boolean => {
    return new Date(cellValue) > new Date(value);
  },
  isBefore: (cellValue: string, value: string): boolean => {
    return new Date(cellValue) < new Date(value);
  }
};

export const operators = {
  string: {
    options: ['eq', 'neq', 'startsWith', 'endsWith', 'contains', 'notContains'],
    ComponentProps: { type: 'text' },
    Component: forwardRef<any>((props, ref) => (
      <TextField {...props} ref={ref} />
    ))
  },
  date: {
    options: ['isAfter', 'isBefore'],
    Component: DateTimePicker,
    ComponentProps: { type: 'datetime-local' }
  },
  singleSelect: {
    options: ['is', 'isNot'],
    ComponentProps: {},
    Component: forwardRef(
      (
        {
          sx,
          name,
          label,
          value,
          options,
          onChange,
          inputRef,
          placeholder
        }: any,
        _: unknown
      ) => (
        <FormControl sx={sx}>
          <InputLabel id="value-selector-label">{label}</InputLabel>
          <Select
            name={name}
            value={value}
            label={label}
            inputRef={inputRef}
            onChange={onChange}
            id="value-selector"
            labelId="value-selector-label"
          >
            {options.map(
              ({ label, value }: { label: string; value: string }) => (
                <MenuItem value={value}>{label}</MenuItem>
              )
            )}
          </Select>
        </FormControl>
      )
    )
  }
};

export type FilterItem = { field: string; condition: string; value: string };

export type OperatorKeys = keyof typeof operatorFunctions;

export type FilterFunction = (
  row: any
) => (cellValue: string, filterValue: string) => boolean;

export function getFilterFunctions(filters: FilterItem[]): FilterFunction[] {
  return filters.map(filterItem => {
    const func = operatorFunctions[filterItem.condition as OperatorKeys];

    return (row: any) => {
      const cellValue = row[filterItem.field];

      return cellValue && func(cellValue, filterItem.value);
    };
  });
}
