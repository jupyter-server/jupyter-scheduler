import React, { useMemo } from 'react';

import { InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import { Scheduler } from '../handler';

export type ComputeTypePickerProps = {
  label: string;
  name: string;
  id: string;
  environment: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  initialValue: string;
};

export function computeTypesForEnvironment(
  environment: string
): string[] | null {
  // Retrieve the environment data from session storage.
  const environmentsData = sessionStorage.getItem('environments');
  if (environmentsData === null) {
    return null;
  }

  const environments = JSON.parse(
    environmentsData
  ) as Array<Scheduler.IRuntimeEnvironment>;
  const environmentObj = environments.find(env => env.name === environment);
  if (!environmentObj || !environmentObj['output_formats']) {
    return null;
  }

  return environmentObj['compute_types'];
}

export function ComputeTypePicker(
  props: ComputeTypePickerProps
): JSX.Element | null {
  const computeTypes = useMemo(
    () => computeTypesForEnvironment(props.environment),
    [props.environment]
  );
  if (computeTypes === null) {
    return null;
  }

  const labelId = `${props.id}-label`;

  return (
    <>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <Select
        labelId={labelId}
        name={props.name}
        id={props.id}
        onChange={props.onChange}
        value={props.initialValue}
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
