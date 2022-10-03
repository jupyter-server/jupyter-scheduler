import React, { ChangeEvent } from 'react';

import { TextField } from '@mui/material';

import { useTranslator } from '../hooks';

export type ScheduleInputsProps = {
  idPrefix: string;
  schedule?: string;
  timezone?: string;
  handleScheduleChange: (event: ChangeEvent) => void;
  handleTimezoneChange: (event: ChangeEvent) => void;
};

export function ScheduleInputs(props: ScheduleInputsProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  return (
    <>
      <TextField
        label={trans.__('Cron expression')}
        variant="outlined"
        onChange={props.handleScheduleChange}
        value={props.schedule || ''}
        id={`${props.idPrefix}schedule`}
        name="schedule"
      />
      <TextField
        label={trans.__('Time zone')}
        variant="outlined"
        onChange={props.handleTimezoneChange}
        value={props.timezone || ''}
        id={`${props.idPrefix}timezone`}
        name="timezone"
      />
    </>
  );
}
