import React from 'react';

import {
  FormControl,
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
  // Hide while loading (length === 0) or if only one backend (no choice to make)
  if (props.backendList.length <= 1) {
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

  // Hide if only one backend matches the file type
  if (filteredBackends.length <= 1) {
    return null;
  }

  const labelId = `${props.id}-label`;

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
      >
        {filteredBackends.map((backend, idx) => (
          <MenuItem value={backend.id} title={backend.description} key={idx}>
            {backend.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
