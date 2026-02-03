import React, { ChangeEvent } from 'react';

import { Checkbox, FormControlLabel, InputLabel, Tooltip } from '@mui/material';

import { Stack } from './stack';

import { Cluster } from './cluster';
import { Scheduler } from '../handler';

export type OutputFormatPickerProps = {
  label: string;
  name: string;
  id: string;
  backend_id: string;
  backendList: Scheduler.IBackend[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string[];
};

export function outputFormatsForBackend(
  backendList: Scheduler.IBackend[],
  backend_id: string
): Scheduler.IOutputFormat[] | null {
  const backendObj = backendList.find(b => b.id === backend_id);
  if (!backendObj || !backendObj.output_formats) {
    return null;
  }

  return backendObj.output_formats;
}

export function OutputFormatPicker(
  props: OutputFormatPickerProps
): JSX.Element | null {
  const outputFormats = outputFormatsForBackend(
    props.backendList,
    props.backend_id
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
          <Tooltip key={idx} title={of.description || ''} placement="top">
            <FormControlLabel
              control={
                <Checkbox
                  checked={props.value.some(sof => of.id === sof)}
                  id={`${props.id}-${of.id}`}
                  value={of.id}
                  onChange={props.onChange}
                />
              }
              label={of.label}
            />
          </Tooltip>
        ))}
      </Cluster>
    </Stack>
  );
}
