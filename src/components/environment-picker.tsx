import React from 'react';

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

export type EnvironmentPickerProps = {
  label: string;
  name: string;
  id: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  environmentList: Scheduler.IRuntimeEnvironment[];
  value: string;
};

export function EnvironmentPicker(
  props: EnvironmentPickerProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  if (props.environmentList.length === 0) {
    return <em>{trans.__('Loading …')}</em>;
  }

  const labelId = `${props.id}-label`;

  // If exactly one environment is present, do not display an environment UI element.
  if (props.environmentList.length === 1) {
    return null;
  }

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
        {props.environmentList.map((env, idx) => (
          <MenuItem value={env.label} title={env.description} key={idx}>
            {env.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
