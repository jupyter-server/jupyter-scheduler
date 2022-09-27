import React, { ChangeEvent, useMemo } from 'react';

import { Checkbox, FormControlLabel, InputLabel } from '@mui/material';

import { Stack } from './stack';

import { Cluster } from './cluster';
import { Scheduler } from '../handler';
import { IOutputFormat } from '../model';

export type OutputFormatPickerProps = {
  label: string;
  name: string;
  id: string;
  environment: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: IOutputFormat[];
};

export function outputFormatsForEnvironment(
  environment: string
): IOutputFormat[] | null {
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

  return environmentObj['output_formats'] as IOutputFormat[];
}

export function OutputFormatPicker(
  props: OutputFormatPickerProps
): JSX.Element | null {
  const outputFormats = useMemo(
    () => outputFormatsForEnvironment(props.environment),
    [props.environment]
  );
  if (outputFormats === null) {
    return null;
  }

  return (
    <Stack size={2}>
      <InputLabel>{props.label}</InputLabel>
      <Cluster gap={3} justifyContent="flex-start">
        {outputFormats.map((of, idx) => (
          <FormControlLabel
            key={idx}
            control={
              <Checkbox
                defaultChecked={props.value.some(sof => of.name === sof.name)}
                id={`${props.id}-${of.name}`}
                value={of.name}
                onChange={props.onChange}
              />
            }
            label={of.label}
          />
        ))}
      </Cluster>
    </Stack>
  );
}
