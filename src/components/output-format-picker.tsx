import React, { ChangeEvent } from 'react';

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
  environmentList: Scheduler.IRuntimeEnvironment[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string[];
};

export function outputFormatsForEnvironment(
  environmentList: Scheduler.IRuntimeEnvironment[],
  environment: string
): IOutputFormat[] | null {
  const environmentObj = environmentList.find(env => env.name === environment);
  if (!environmentObj || !environmentObj['output_formats']) {
    return null;
  }

  return environmentObj['output_formats'] as IOutputFormat[];
}

export function OutputFormatPicker(
  props: OutputFormatPickerProps
): JSX.Element | null {
  const outputFormats = outputFormatsForEnvironment(
    props.environmentList,
    props.environment
  );

  // Don't display anything, not even the label, if there are no output formats
  if (outputFormats === null || outputFormats.length === 0) {
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
                checked={props.value.some(sof => of.name === sof)}
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
