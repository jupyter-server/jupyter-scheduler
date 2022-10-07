import React, { ChangeEvent } from 'react';

import cronstrue from 'cronstrue';
import tzdata from 'tzdata';

import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField
} from '@mui/material';

import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import { Scheduler } from '../tokens';

import { Cluster } from './cluster';

export type ScheduleInputsProps = {
  idPrefix: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  handleScheduleIntervalChange: (event: SelectChangeEvent<string>) => void;
  handleScheduleTimeChange: (event: ChangeEvent) => void;
  handleScheduleChange: (event: ChangeEvent) => void;
  handleTimezoneChange: (newValue: string | null) => void;
  errors: Scheduler.ErrorsType;
  handleErrorsChange: (errors: Scheduler.ErrorsType) => void;
};

// Converts hours and minutes to hh:mm format
function formatTime(hours: number, minutes: number): string {
  return (
    (hours < 10 ? '0' + hours : hours) +
    ':' +
    (minutes < 10 ? '0' + minutes : minutes)
  );
}

export function ScheduleInputs(props: ScheduleInputsProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  const timezones = Object.keys(tzdata.zones).sort();

  const timezoneLabel = trans.__('Time zone');

  let cronString;
  try {
    if (props.model.schedule !== undefined && !props.errors['schedule']) {
      cronString = cronstrue.toString(props.model.schedule);
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

  const labelId = `${props.idPrefix}every-label`;
  const labelText = trans.__('Every');

  const timezonePicker = (
    <Autocomplete
      id={`${props.idPrefix}timezone`}
      options={timezones}
      value={props.model.timezone ?? null}
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
  );

  return (
    <>
      <FormControl>
        <InputLabel id={labelId}>{labelText}</InputLabel>
        <Select
          labelId={labelId}
          label={labelText}
          variant="outlined"
          id={`${props.idPrefix}every`}
          name="every"
          value={props.model.scheduleInterval}
          onChange={props.handleScheduleIntervalChange}
        >
          <MenuItem value={'minute'}>{trans.__('Minute')}</MenuItem>
          <MenuItem value={'day'}>{trans.__('Day')}</MenuItem>
          <MenuItem value={'weekday'}>{trans.__('Weekday')}</MenuItem>
          <MenuItem value={'custom'}>{trans.__('Custom schedule')}</MenuItem>
        </Select>
      </FormControl>
      {(props.model.scheduleInterval === 'weekday' ||
        props.model.scheduleInterval === 'day') && (
        <>
          <TextField
            label={trans.__('Time')}
            value={
              props.model.scheduleTimeInput ??
              formatTime(
                props.model.scheduleHour ?? 0,
                props.model.scheduleMinute ?? 0
              )
            }
            onChange={props.handleScheduleTimeChange}
            error={!!props.errors['scheduleTime']}
            helperText={props.errors['scheduleTime'] || trans.__('00:00–23:59')}
          />
          {timezonePicker}
        </>
      )}
      {props.model.scheduleInterval === 'custom' && (
        <>
          <Cluster gap={4}>
            {presets.map(preset => presetButton(preset.label, preset.schedule))}
          </Cluster>
          <TextField
            label={trans.__('Cron expression')}
            variant="outlined"
            onChange={props.handleScheduleChange}
            value={props.model.schedule ?? ''}
            id={`${props.idPrefix}schedule`}
            name="schedule"
            error={!!props.errors['schedule']}
            helperText={props.errors['schedule'] || cronString}
          />
          {timezonePicker}
        </>
      )}
    </>
  );
}
