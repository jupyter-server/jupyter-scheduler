import React, { ChangeEvent } from 'react';
import tzdata from 'tzdata';

import { Autocomplete, TextField } from '@mui/material';

import { useTranslator } from '../hooks';
import { Scheduler } from '../tokens';

export type ScheduleInputsProps = {
  idPrefix: string;
  schedule?: string;
  handleScheduleChange: (event: ChangeEvent) => void;
  timezone?: string;
  handleTimezoneChange: (newValue: string | null) => void;
  errors: Scheduler.ErrorsType;
  handleErrorsChange: (errors: Scheduler.ErrorsType) => void;
};

export function ScheduleInputs(props: ScheduleInputsProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  const timezones = Object.keys(tzdata.zones).sort();

  const timezoneLabel = trans.__('Time zone');

  return (
    <>
      <TextField
        label={trans.__('Cron expression')}
        variant="outlined"
        onChange={props.handleScheduleChange}
        value={props.schedule ?? ''}
        id={`${props.idPrefix}schedule`}
        name="schedule"
        error={!!props.errors['schedule']}
        helperText={props.errors['schedule']}
      />
      <Autocomplete
        id={`${props.idPrefix}timezone`}
        options={timezones}
        value={props.timezone ?? null}
        onChange={(
          event: React.SyntheticEvent<Element, Event>,
          newValue: string | null
        ) => {
          props.handleTimezoneChange(newValue);
        }}
        renderInput={(params: any) => (
          <TextField
            {...params}
            name="timezone"
            label={timezoneLabel}
            variant="outlined"
          />
        )}
      />
    </>
  );
}
