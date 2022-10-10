import React, { ChangeEvent } from 'react';

import {
  FormControlLabel,
  InputLabel,
  Radio,
  RadioGroup,
  SelectChangeEvent
} from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import { ScheduleInputs } from './schedule-inputs';
import { Scheduler } from '../tokens';

export type CreateScheduleOptionsProps = {
  label: string;
  name: string;
  id: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  handleScheduleIntervalChange: (event: SelectChangeEvent<string>) => void;
  handleScheduleWeekDayChange: (event: SelectChangeEvent<string>) => void;
  handleScheduleMonthDayChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleScheduleTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleScheduleMinuteChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleCreateTypeChange: (
    event: ChangeEvent<HTMLInputElement>,
    value: string
  ) => void;
  schedule?: string;
  handleScheduleChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
        value={props.model.createType}
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
      {props.model.createType === 'JobDefinition' && (
        <ScheduleInputs
          idPrefix={`${props.id}-definition-`}
          model={props.model}
          handleModelChange={props.handleModelChange}
          handleScheduleIntervalChange={props.handleScheduleIntervalChange}
          handleScheduleWeekDayChange={props.handleScheduleWeekDayChange}
          handleScheduleMonthDayChange={props.handleScheduleMonthDayChange}
          handleScheduleTimeChange={props.handleScheduleTimeChange}
          handleScheduleMinuteChange={props.handleScheduleMinuteChange}
          handleScheduleChange={props.handleScheduleChange}
          handleTimezoneChange={props.handleTimezoneChange}
          errors={props.errors}
          handleErrorsChange={props.handleErrorsChange}
        />
      )}
    </Stack>
  );
}
