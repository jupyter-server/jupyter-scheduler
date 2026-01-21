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
import { filterBackendsByFile } from '../util/backend-utils';

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
  // Hide while loading
  if (props.backendList.length === 0) {
    return null;
  }

  // Filter by file extension
  const filteredBackends = filterBackendsByFile(
    props.backendList,
    props.inputFile
  );

  // Hide if no backends match (edge case)
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
        {filteredBackends.map(backend => (
          <MenuItem
            value={backend.id}
            title={backend.description}
            key={backend.id}
          >
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
