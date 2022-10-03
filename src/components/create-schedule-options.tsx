import React, { ChangeEvent } from 'react';

import {
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';
import { ScheduleInputs } from './schedule-inputs';

export type CreateScheduleOptionsProps = {
  label: string;
  name: string;
  id: string;
  createType: string;
  schedule?: string;
  timezone?: string;
  handleCreateTypeChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    value: string
  ) => void;
  handleScheduleChange: (event: ChangeEvent) => void;
  handleTimezoneChange: (event: ChangeEvent) => void;
};

export function CreateScheduleOptions(
  props: CreateScheduleOptionsProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  const labelId = `${props.id}-label`;

  return (
    <Stack spacing={4}>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <RadioGroup
        aria-labelledby={labelId}
        name={props.name}
        value={props.createType}
        onChange={props.handleCreateTypeChange}
      >
        <FormControlLabel
          value="Job"
          control={<Radio />}
          label={trans.__('Run now')}
        />
        <Typography sx={{ fontSize: '90%', marginLeft: '2.5em' }}>
          {trans.__('Run your notebook immediately')}
        </Typography>
        <FormControlLabel
          value="JobDefinition"
          control={<Radio />}
          label={trans.__('Run on a schedule')}
        />
        <Typography sx={{ fontSize: '90%', marginLeft: '2.5em' }}>
          {trans.__('Schedule a notebook at a regular interval')}
        </Typography>
      </RadioGroup>
      {props.createType === 'JobDefinition' && (
        <ScheduleInputs
          idPrefix={`${props.id}-definition-`}
          schedule={props.schedule}
          timezone={props.timezone}
          handleScheduleChange={props.handleScheduleChange}
          handleTimezoneChange={props.handleTimezoneChange}
        />
      )}
    </Stack>
  );
}
