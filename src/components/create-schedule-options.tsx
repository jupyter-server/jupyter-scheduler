import React, { ChangeEvent } from 'react';

import { FormControlLabel, InputLabel, Radio, RadioGroup } from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';
import { ScheduleInputs } from './schedule-inputs';
import { Scheduler } from '../tokens';

export type CreateScheduleOptionsProps = {
  label: string;
  name: string;
  id: string;
  createType: string;
  handleCreateTypeChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    value: string
  ) => void;
  schedule?: string;
  handleScheduleChange: (event: ChangeEvent) => void;
  timezone?: string;
  handleTimezoneChange: (newValue: string | null) => void;
  errors: Scheduler.ErrorsType;
  handleErrorsChange: (errors: Scheduler.ErrorsType) => void;
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
        <FormControlLabel
          value="JobDefinition"
          control={<Radio />}
          label={trans.__('Run on a schedule')}
        />
      </RadioGroup>
      {props.createType === 'JobDefinition' && (
        <ScheduleInputs
          idPrefix={`${props.id}-definition-`}
          schedule={props.schedule}
          handleScheduleChange={props.handleScheduleChange}
          timezone={props.timezone}
          handleTimezoneChange={props.handleTimezoneChange}
          errors={props.errors}
          handleErrorsChange={props.handleErrorsChange}
        />
      )}
    </Stack>
  );
}
