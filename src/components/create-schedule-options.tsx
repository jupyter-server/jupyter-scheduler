import React, { ChangeEvent, useMemo } from 'react';

import { FormControlLabel, InputLabel, Radio, RadioGroup } from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import { ScheduleInputs, ScheduleValidator } from './schedule-inputs';
import { Scheduler } from '../tokens';

export type CreateScheduleOptionsProps = {
  label: string;
  name: string;
  id: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  errors: Scheduler.ErrorsType;
  handleErrorsChange: (errors: Scheduler.ErrorsType) => void;
};

export function CreateScheduleOptions(
  props: CreateScheduleOptionsProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const validator = useMemo(() => new ScheduleValidator(trans), [trans]);

  const labelId = `${props.id}-label`;

  const handleScheduleOptionsChange = (
    event: ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    const name = event.target.name;

    // When changing from JobDefinition to Job, remove errors,
    // so that in case there's an error with the schedule,
    // the form can still be submitted.
    if (value === 'Job') {
      // Change from 'JobDefinition' and clear all job definition specific errors
      props.handleErrorsChange({
        ...props.errors,
        schedule: '',
        scheduleInterval: '',
        timezone: '',
        scheduleHourMinute: '',
        scheduleMinute: '',
        scheduleHour: '',
        scheduleMonthDay: '',
        scheduleWeekDay: '',
        scheduleTime: ''
      });
    }
    if (value === 'JobDefinition' && props.model.schedule) {
      // If the schedule is not populated, don't display an error for now.
      props.handleErrorsChange({
        ...props.errors,
        schedule: validator.validateSchedule(props.model.schedule)
      });
    }

    props.handleModelChange({ ...props.model, [name]: value });
  };

  return (
    <Stack spacing={4}>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <RadioGroup
        aria-labelledby={labelId}
        name={props.name}
        value={props.model.createType}
        onChange={handleScheduleOptionsChange}
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
          errors={props.errors}
          handleErrorsChange={props.handleErrorsChange}
        />
      )}
    </Stack>
  );
}
