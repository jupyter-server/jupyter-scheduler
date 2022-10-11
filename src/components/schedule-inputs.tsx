import React, { ChangeEvent } from 'react';

import cronstrue from 'cronstrue';
import tzdata from 'tzdata';

import {
  Autocomplete,
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

export type ScheduleInputsProps = {
  idPrefix: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  handleScheduleIntervalChange: (event: SelectChangeEvent<string>) => void;
  handleScheduleWeekDayChange: (event: SelectChangeEvent<string>) => void;
  handleScheduleMonthDayChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleScheduleTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleScheduleMinuteChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleScheduleChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
    if (props.model.schedule && !props.errors['schedule']) {
      cronString = cronstrue.toString(props.model.schedule);
    }
  } catch (e) {
    // Do nothing; let the errors or nothing display instead
  }

  // Converts 24-hour hh:mm format to 12-hour hh:mm AM/PM format
  const twentyFourToTwelveHourTime = (hours: number, minutes: number) => {
    const displayMinutes: string = minutes < 10 ? '0' + minutes : '' + minutes;

    if (hours === 0) {
      return trans.__('%1:%2 AM', hours, displayMinutes);
    } else if (hours === 12) {
      return trans.__('%1:%2 PM', hours, displayMinutes);
    } else if (hours > 12) {
      return trans.__('%1:%2 PM', hours - 12, displayMinutes);
    } else {
      return trans.__('%1:%2 AM', hours, displayMinutes);
    }
  };

  const intervalLabelId = `${props.idPrefix}interval-label`;
  const intervalLabelText = trans.__('Interval');

  const dayOfWeekLabelId = `${props.idPrefix}dayofweek-label`;
  const dayOfWeekText = trans.__('Day of the week');

  const monthDayHelperText =
    props.model.scheduleMonthDay !== undefined &&
    props.model.scheduleMonthDay > 28
      ? trans.__(
          'The job will not run in months with fewer than %1 days',
          props.model.scheduleMonthDay
        )
      : '1–31';

  const timeHelperText =
    !props.errors['scheduleTime'] &&
    props.model.scheduleHour !== undefined &&
    props.model.scheduleMinute !== undefined
      ? twentyFourToTwelveHourTime(
          props.model.scheduleHour,
          props.model.scheduleMinute
        )
      : trans.__('00:00–23:59');

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

  const timePicker = (
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
      helperText={props.errors['scheduleTime'] || timeHelperText}
    />
  );

  const cronTips = (
    <p>
      <a
        href="https://www.gnu.org/software/mcron/manual/html_node/Crontab-file.html"
        target="_blank"
      >
        {trans.__('Get help with cron syntax')}
      </a>
    </p>
  );

  return (
    <>
      <FormControl>
        <InputLabel id={intervalLabelId}>{intervalLabelText}</InputLabel>
        <Select
          labelId={intervalLabelId}
          label={intervalLabelText}
          variant="outlined"
          id={`${props.idPrefix}interval`}
          name="interval"
          value={props.model.scheduleInterval}
          onChange={props.handleScheduleIntervalChange}
        >
          <MenuItem value={'minute'}>{trans.__('Minute')}</MenuItem>
          <MenuItem value={'hour'}>{trans.__('Hour')}</MenuItem>
          <MenuItem value={'day'}>{trans.__('Day')}</MenuItem>
          <MenuItem value={'week'}>{trans.__('Week')}</MenuItem>
          <MenuItem value={'weekday'}>{trans.__('Weekday')}</MenuItem>
          <MenuItem value={'month'}>{trans.__('Month')}</MenuItem>
          <MenuItem value={'custom'}>{trans.__('Custom schedule')}</MenuItem>
        </Select>
      </FormControl>
      {props.model.scheduleInterval === 'hour' && (
        <>
          <TextField
            label={trans.__('Minutes past the hour')}
            value={
              props.model.scheduleMinuteInput ??
              props.model.scheduleHourMinute ??
              0
            }
            onChange={props.handleScheduleMinuteChange}
            error={!!props.errors['scheduleHourMinute']}
            helperText={props.errors['scheduleHourMinute'] || trans.__('0–59')}
          />
        </>
      )}
      {props.model.scheduleInterval === 'week' && (
        <>
          <FormControl>
            <InputLabel id={dayOfWeekLabelId}>{dayOfWeekText}</InputLabel>
            <Select
              labelId={dayOfWeekLabelId}
              label={dayOfWeekText}
              variant="outlined"
              id={`${props.idPrefix}dayOfWeek`}
              name="dayOfWeek"
              value={props.model.scheduleWeekDay ?? '1'}
              onChange={props.handleScheduleWeekDayChange}
            >
              <MenuItem value={'1'}>{trans.__('Monday')}</MenuItem>
              <MenuItem value={'2'}>{trans.__('Tuesday')}</MenuItem>
              <MenuItem value={'3'}>{trans.__('Wednesday')}</MenuItem>
              <MenuItem value={'4'}>{trans.__('Thursday')}</MenuItem>
              <MenuItem value={'5'}>{trans.__('Friday')}</MenuItem>
              <MenuItem value={'6'}>{trans.__('Saturday')}</MenuItem>
              <MenuItem value={'0'}>{trans.__('Sunday')}</MenuItem>
            </Select>
          </FormControl>
          {timePicker}
          {timezonePicker}
        </>
      )}
      {(props.model.scheduleInterval === 'weekday' ||
        props.model.scheduleInterval === 'day') && (
        <>
          {timePicker}
          {timezonePicker}
        </>
      )}
      {props.model.scheduleInterval === 'month' && (
        <>
          <TextField
            label={trans.__('Day of the month')}
            value={
              props.model.scheduleMonthDayInput ??
              props.model.scheduleMonthDay ??
              ''
            }
            onChange={props.handleScheduleMonthDayChange}
            error={!!props.errors['scheduleMonthDay']}
            helperText={props.errors['scheduleMonthDay'] || monthDayHelperText}
          />
          {timePicker}
          {timezonePicker}
        </>
      )}
      {props.model.scheduleInterval === 'custom' && (
        <>
          <TextField
            label={trans.__('cron expression')}
            variant="outlined"
            onChange={props.handleScheduleChange}
            value={props.model.schedule ?? ''}
            id={`${props.idPrefix}schedule`}
            name="schedule"
            error={!!props.errors['schedule']}
            helperText={props.errors['schedule'] || cronString}
          />
          {cronTips}
          {timezonePicker}
        </>
      )}
    </>
  );
}
