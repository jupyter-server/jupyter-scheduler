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
  initialValue: string;
};

export function EnvironmentPicker(props: EnvironmentPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  if (props.environmentList.length === 0) {
    return <em>{trans.__('Loading …')}</em>;
  }

  const labelId = `${props.id}-label`;

  return (
    <FormControl>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      {props.environmentList.length === 1 ? (
        <Select
          labelId={labelId}
          label={props.label}
          name={props.name}
          id={props.id}
          onChange={props.onChange}
          value={props.environmentList[0]?.label}
        >
          <MenuItem
            value={props.environmentList[0]?.label}
            title={props.environmentList[0]?.description}
            selected
          >
            {props.environmentList[0]?.name}
          </MenuItem>
        </Select>
      ) : (
        <Select
          labelId={labelId}
          label={props.label}
          name={props.name}
          id={props.id}
          onChange={props.onChange}
          value={props.initialValue}
        >
          {props.environmentList.map((env, idx) => (
            <MenuItem value={env.label} title={env.description} key={idx}>
              {env.name}
            </MenuItem>
          ))}
        </Select>
      )}
    </FormControl>
  );
}
