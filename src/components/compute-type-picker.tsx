import React from 'react';

import { InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import { Scheduler } from '../handler';

export type ComputeTypePickerProps = {
  label: string;
  name: string;
  id: string;
  environment: string;
  environmentList: Scheduler.IRuntimeEnvironment[];
  onChange: (event: SelectChangeEvent<string>) => void;
  value: string | undefined;
};

export function ComputeTypePicker(
  props: ComputeTypePickerProps
): JSX.Element | null {
  const environmentObj = props.environmentList.find(
    env => env.name === props.environment
  );
  if (!environmentObj || !environmentObj.compute_types) {
    return null;
  }

  const computeTypes = environmentObj.compute_types;

  const labelId = `${props.id}-label`;

  return (
    <>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <Select
        labelId={labelId}
        name={props.name}
        id={props.id}
        onChange={props.onChange}
        value={props.value}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: '20em'
            }
          }
        }}
      >
        {computeTypes.map((ct, idx) => (
          <MenuItem value={ct} key={idx}>
            {ct}
          </MenuItem>
        ))}
      </Select>
    </>
  );
}
