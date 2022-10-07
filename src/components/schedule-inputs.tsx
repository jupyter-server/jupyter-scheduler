import React, { ChangeEvent } from 'react';

import cronstrue from 'cronstrue';
import tzdata from 'tzdata';

import { Autocomplete, Button, TextField } from '@mui/material';

import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import { Scheduler } from '../tokens';

import { Cluster } from './cluster';

export type ScheduleInputsProps = {
  idPrefix: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
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

  let cronString;
  try {
    if (props.schedule !== undefined && !props.errors['schedule']) {
      cronString = cronstrue.toString(props.schedule);
    }
  } catch (e) {
    // Do nothing; let the errors or nothing display instead
  }

  const presetButton = (label: string, schedule: string) => {
    return (
      <Button
        onClick={e => {
          props.handleModelChange({
            ...props.model,
            schedule: schedule
          });
        }}
      >
        {label}
      </Button>
    );
  };

  const presets = [
    {
      label: trans.__('Every day'),
      schedule: '0 7 * * *'
    },
    {
      label: trans.__('Every 6 hours'),
      schedule: '* */6 * * *'
    },
    {
      label: trans.__('Every weekday'),
      schedule: '0 6 * * MON-FRI'
    },
    {
      label: trans.__('Every month'),
      schedule: '0 5 1 * *'
    }
  ];

  return (
    <>
      <Cluster gap={4}>
        {presets.map(preset => presetButton(preset.label, preset.schedule))}
      </Cluster>
      <TextField
        label={trans.__('Cron expression')}
        variant="outlined"
        onChange={props.handleScheduleChange}
        value={props.schedule ?? ''}
        id={`${props.idPrefix}schedule`}
        name="schedule"
        error={!!props.errors['schedule']}
        helperText={props.errors['schedule'] || cronString}
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
