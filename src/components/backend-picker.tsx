import React from 'react';

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';

import { Scheduler } from '../handler';

export type BackendPickerProps = {
  label: string;
  name: string;
  id: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  backendList: Scheduler.IBackend[];
  value: string;
  inputFile?: string;
};

export function BackendPicker(props: BackendPickerProps): JSX.Element | null {
  // Hide only while loading
  if (props.backendList.length === 0) {
    return null;
  }

  // Filter by file extension if inputFile provided
  const fileExt = props.inputFile?.split('.').pop()?.toLowerCase();
  const filteredBackends = fileExt
    ? props.backendList.filter(
        b =>
          b.file_extensions.length === 0 || b.file_extensions.includes(fileExt)
      )
    : props.backendList;

  // Hide only if no backends match (edge case)
  if (filteredBackends.length === 0) {
    return null;
  }

  const labelId = `${props.id}-label`;
  const isDisabled = filteredBackends.length === 1;
  const selectedBackend = filteredBackends.find(b => b.id === props.value);

  return (
    <FormControl>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <Select
        labelId={labelId}
        label={props.label}
        name={props.name}
        id={props.id}
        onChange={props.onChange}
        value={props.value}
        disabled={isDisabled}
      >
        {filteredBackends.map((backend, idx) => (
          <MenuItem value={backend.id} title={backend.description} key={idx}>
            {backend.name}
          </MenuItem>
        ))}
      </Select>
      {selectedBackend && (
        <FormHelperText>{selectedBackend.description}</FormHelperText>
      )}
    </FormControl>
  );
}
