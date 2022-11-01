import React, { ChangeEvent, useMemo } from 'react';
import { TranslationBundle } from '@jupyterlab/translation';

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
import { ModelWithScheduleFields } from '../model';
import { Scheduler } from '../tokens';

export type ScheduleInputsProps<M extends ModelWithScheduleFields> = {
  idPrefix: string;
  model: M;
  handleModelChange: (model: M) => void;
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

export function ScheduleInputs<M extends ModelWithScheduleFields>(
  props: ScheduleInputsProps<M>
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const validator = useMemo(() => new ScheduleValidator(trans), [trans]);

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

  const handleScheduleIntervalChange = (event: SelectChangeEvent<string>) => {
    const newInterval = event.target.value;
    // Set the schedule (in cron format) based on the new interval
    let schedule = props.model.schedule;
    let dayOfWeek = props.model.scheduleWeekDay;

    // On switch, validate only the needed text fields, and remove errors for unneeded fields.
    const neededFields: { [key: string]: string[] } = {
      minute: [], // No inputs
      hour: ['scheduleHourMinute'],
      day: ['scheduleTime'],
      week: ['scheduleTime'],
      weekday: ['scheduleTime'],
      month: ['scheduleTime', 'scheduleMonthDay'],
      custom: []
    };

    const allFields = [
      'scheduleTime',
      'scheduleHourMinute',
      'scheduleMonthDay'
    ];

    const newErrors = { ...props.errors };
    for (const fieldToValidate of allFields) {
      if (neededFields[newInterval].includes(fieldToValidate)) {
        // Validate the field.
        // Skip validation if value in model is undefined; this typically indicates initial load.
        switch (fieldToValidate) {
          case 'scheduleTime':
            if (props.model.scheduleTimeInput !== undefined) {
              newErrors[fieldToValidate] = validator.validateTime(
                props.model.scheduleTimeInput
              );
            }
            break;
          case 'scheduleHourMinute':
            if (props.model.scheduleMinuteInput !== undefined) {
              newErrors[fieldToValidate] = validator.validateHourMinute(
                props.model.scheduleMinuteInput
              );
            }
            break;
          case 'scheduleMonthDay':
            if (props.model.scheduleMonthDayInput !== undefined) {
              newErrors[fieldToValidate] = validator.validateMonthDay(
                props.model.scheduleMonthDayInput
              );
            }
            break;
        }
      } else {
        // Clear validation errors.
        newErrors[fieldToValidate] = '';
      }
    }

    props.handleErrorsChange(newErrors);

    switch (newInterval) {
      case 'minute':
        schedule = '* * * * *'; // every minute
        break;
      case 'hour':
        schedule = `${props.model.scheduleHourMinute ?? '0'} * * * *`;
        break;
      case 'day':
        schedule = `${props.model.scheduleMinute ?? '0'} ${
          props.model.scheduleHour ?? '0'
        } * * *`;
        break;
      case 'week':
        schedule = `${props.model.scheduleMinute ?? '0'} ${
          props.model.scheduleHour ?? '0'
        } * * ${props.model.scheduleWeekDay ?? '1'}`;
        dayOfWeek ??= '1'; // Default to Monday
        break;
      case 'weekday':
        schedule = `${props.model.scheduleMinute ?? '0'} ${
          props.model.scheduleHour ?? '0'
        } * * MON-FRI`;
        break;
      case 'month':
        schedule = `${props.model.scheduleMinute ?? '0'} ${
          props.model.scheduleHour ?? '0'
        } ${props.model.scheduleMonthDay ?? '1'} * *`;
        break;
    }

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleInterval: event.target.value,
      scheduleWeekDay: dayOfWeek
    });
  };

  const handleScheduleMinuteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    let minutes = props.model.scheduleHourMinute;
    let schedule = props.model.schedule;

    const scheduleHourMinuteError = validator.validateHourMinute(value);

    if (!scheduleHourMinuteError) {
      minutes = parseInt(value);
      // No errors; compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'hour':
          schedule = `${minutes} * * * *`;
          break;
      }
    }

    props.handleErrorsChange({
      ...props.errors,
      scheduleHourMinute: scheduleHourMinuteError
    });

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleMinuteInput: value,
      scheduleHourMinute: minutes
    });
  };

  const handleScheduleMonthDayChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    let monthDay = props.model.scheduleMonthDay;
    let schedule = props.model.schedule;

    const monthDayError = validator.validateMonthDay(value);

    if (!monthDayError) {
      monthDay = parseInt(value);
      // Compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'month':
          schedule = `${props.model.scheduleMinute ?? 0} ${
            props.model.scheduleHour ?? 0
          } ${monthDay} * *`;
          break;
      }
    }

    props.handleErrorsChange({
      ...props.errors,
      scheduleMonthDay: monthDayError
    });

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleMonthDayInput: value,
      scheduleMonthDay: monthDay
    });
  };

  const handleScheduleWeekDayChange = (event: SelectChangeEvent<string>) => {
    // Days of the week are numbered 0 (Sunday) through 6 (Saturday)
    const value = event.target.value;

    let schedule = props.model.schedule;

    schedule = `${props.model.scheduleMinute ?? '0'} ${
      props.model.scheduleHour ?? '0'
    } * * ${value}`;

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleWeekDay: value
    });
  };

  const handleScheduleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Validate the cron expression
    props.handleErrorsChange({
      ...props.errors,
      schedule: validator.validateSchedule(event.target.value)
    });
    props.handleModelChange({
      ...props.model,
      schedule: event.target.value
    });
  };

  const handleTimezoneChange = (value: string | null) => {
    props.handleModelChange({
      ...props.model,
      timezone: value ?? ''
    });
  };

  const handleScheduleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    let hours = props.model.scheduleHour;
    let minutes = props.model.scheduleMinute;
    let schedule = props.model.schedule;

    const timeError = validator.validateTime(value);

    if (!timeError) {
      props.handleErrorsChange({
        ...props.errors,
        scheduleTime: ''
      });

      // Parse the time (we expect that neither minutes nor hours will be undefined)
      [hours, minutes] = parseTime(value);

      // Compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'day':
          schedule = `${minutes} ${hours} * * *`;
          break;
        case 'weekday':
          schedule = `${minutes} ${hours} * * MON-FRI`;
          break;
      }
    }

    props.handleErrorsChange({
      ...props.errors,
      scheduleTime: timeError
    });

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleTimeInput: value,
      scheduleHour: hours,
      scheduleMinute: minutes
    });
  };

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
        handleTimezoneChange(newValue);
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
      onChange={handleScheduleTimeChange}
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
          onChange={handleScheduleIntervalChange}
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
            onChange={handleScheduleMinuteChange}
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
              onChange={handleScheduleWeekDayChange}
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
            onChange={handleScheduleMonthDayChange}
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
            onChange={handleScheduleChange}
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

function parseTime(input: string): [number | undefined, number | undefined] {
  // Allow h:mm or hh:mm
  const timeRegex = /^(\d\d?):(\d\d)$/;
  const timeResult = timeRegex.exec(input);

  let hours: number | undefined = undefined;
  let minutes: number | undefined = undefined;

  if (timeResult) {
    hours = parseInt(timeResult[1]);
    minutes = parseInt(timeResult[2]);
  }

  return [hours, minutes];
}

/**
 * Accepts a translation bundle in its constructor and returns the appropriate
 * error message. If no errors are present, the methods return an empty string.
 */
export class ScheduleValidator {
  trans: TranslationBundle;

  constructor(trans: TranslationBundle) {
    this.trans = trans;
  }

  validateTime(input: string): string {
    const errorMessage = this.trans.__('Time must be in hh:mm format');

    const [hours, minutes] = parseTime(input);

    if (
      hours === undefined ||
      minutes === undefined ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return errorMessage;
    }

    return '';
  }

  validateHourMinute(input: string): string {
    const errorMessage = this.trans.__('Minute must be between 0 and 59');
    const minuteRegex = /^(\d\d?)$/;
    const minuteResult = minuteRegex.exec(input);

    let minutes;
    if (minuteResult) {
      minutes = parseInt(minuteResult[1]);
    }

    if (minutes === undefined || minutes < 0 || minutes > 59) {
      return errorMessage;
    }

    return ''; // No error
  }

  validateMonthDay(input: string): string {
    const errorMessage = this.trans.__(
      'Day of the month must be between 1 and 31'
    );

    const monthDayRegex = /^(\d\d?)$/;
    const monthDayResult = monthDayRegex.exec(input);

    let monthDay;
    if (monthDayResult) {
      monthDay = parseInt(monthDayResult[1]);
    }

    if (monthDay === undefined || monthDay < 1 || monthDay > 31) {
      return errorMessage;
    }

    return ''; // No error
  }

  validateSchedule(schedule: string): string {
    try {
      cronstrue.toString(schedule);
      // No error
      return '';
    } catch {
      return this.trans.__('You must provide a valid cron expression.');
    }
  }
}
