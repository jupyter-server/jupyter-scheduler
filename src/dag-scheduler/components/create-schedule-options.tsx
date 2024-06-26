import React, { useState, useRef } from 'react';

import {
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';
import {
  defaultScheduleFields,
  JobSchedule,
  ModelWithScheduleFields
} from '../model';
import { ScheduleInputs } from './schedule-inputs';
import { Workflows } from '../tokens';

export type CreateScheduleOptionsProps<T extends ModelWithScheduleFields> = {
  model: T;
  id: string;
  label: string;
  utcOnly?: boolean;
  required?: boolean;
  canChangeSchedule?: boolean;
  errors: Workflows.ErrorsType;
  handleModelChange: (model: T) => void;
  handleErrorsChange: (errors: Workflows.ErrorsType) => void;
};

export function CreateScheduleOptions<T extends ModelWithScheduleFields>(
  props: CreateScheduleOptionsProps<T>
): JSX.Element | null {
  const labelId = `${props.id}-label`;
  const trans = useTranslator('jupyterlab');
  const [scheduleOption, setScheduleOption] = useState(
    props.model.schedule === '@once'
      ? JobSchedule.RunOnce
      : JobSchedule.RunOnSchedule
  );
  const previousSchedule = useRef(defaultScheduleFields.schedule);

  const handleScheduleOptionsChange = (_: unknown, value: string) => {
    const schedule =
      value === JobSchedule.RunOnce ? '@once' : previousSchedule.current;

    const timezone =
      value === JobSchedule.RunOnce ? 'UTC' : props.model.timezone;

    if (value === JobSchedule.RunOnce) {
      previousSchedule.current = props.model.schedule;
    }

    setScheduleOption(value as JobSchedule);
    props.handleModelChange({ ...props.model, schedule, timezone });
  };

  return (
    <Stack spacing={2} mb={2}>
      <Stack>
        <InputLabel id={labelId}>
          {props.label}{' '}
          {props.required ? null : (
            <Typography variant="caption">- Optional</Typography>
          )}
        </InputLabel>
        <FormHelperText>
          *{trans.__('Run once schedule will take few mins to run the job')}
        </FormHelperText>
      </Stack>
      {props.canChangeSchedule ? (
        <>
          <RadioGroup
            value={scheduleOption}
            aria-labelledby={labelId}
            onChange={handleScheduleOptionsChange}
            sx={{
              mb: 3
            }}
          >
            <FormControlLabel
              control={<Radio />}
              value={JobSchedule.RunOnce}
              label={trans.__('Run once')}
            />
            <FormControlLabel
              control={<Radio />}
              value={JobSchedule.RunOnSchedule}
              label={trans.__('Run on a schedule')}
            />
          </RadioGroup>
        </>
      ) : null}
      {scheduleOption === JobSchedule.RunOnSchedule && (
        <ScheduleInputs
          model={props.model}
          errors={props.errors}
          utcOnly={props.utcOnly}
          idPrefix={`${props.id}-definition-`}
          handleModelChange={props.handleModelChange}
          handleErrorsChange={props.handleErrorsChange}
        />
      )}
    </Stack>
  );
}
