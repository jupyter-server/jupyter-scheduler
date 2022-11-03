import React, { useEffect, useMemo } from 'react';
import { TranslationBundle } from '@jupyterlab/translation';

import cronstrue from 'cronstrue';
import tzdata from 'tzdata';

import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField
} from '@mui/material';

import { useTranslator } from '../hooks';
import {
  ScheduleInterval,
  ModelWithScheduleFields,
  defaultScheduleFields
} from '../model';

export type ErrorsWithScheduleFields = {
  schedule?: string;
  scheduleClock?: string;
  scheduleMinute?: string;
  scheduleMonthDay?: string;
  scheduleWeekDay?: string;
};

export type ScheduleInputsProps<
  M extends ModelWithScheduleFields,
  E extends ErrorsWithScheduleFields
> = {
  idPrefix: string;
  model: M;
  handleModelChange: (model: M) => void;
  errors: E;
  handleErrorsChange: (errors: E) => void;
  utcOnly?: boolean;
};

const emptyScheduleErrors: Record<keyof ErrorsWithScheduleFields, ''> = {
  schedule: '',
  scheduleClock: '',
  scheduleMinute: '',
  scheduleMonthDay: '',
  scheduleWeekDay: ''
};

const fieldKeys = [
  'schedule',
  'scheduleClock',
  'scheduleMinute',
  'scheduleMonthDay',
  'scheduleWeekDay'
] as const;

/**
 * Maps schedule field keys to the intervals in which they may appear.
 */
const intervalsByFieldKey: Record<
  keyof ErrorsWithScheduleFields,
  ScheduleInterval[]
> = {
  schedule: ['custom'],
  scheduleClock: ['day', 'week', 'weekday', 'month'],
  scheduleMinute: ['hour'],
  scheduleMonthDay: ['month'],
  scheduleWeekDay: ['week']
};

export function ScheduleInputs<
  M extends ModelWithScheduleFields,
  E extends ErrorsWithScheduleFields
>(props: ScheduleInputsProps<M, E>): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const validator = useMemo(() => new ScheduleValidator(trans), [trans]);
  const timezones = useMemo(() => Object.keys(tzdata.zones).sort(), []);
  const timezoneLabel = trans.__('Time zone');

  // maps validator method to each field keys
  const validatorsByFieldKey = useMemo(
    () => ({
      schedule: validator.validateCron.bind(validator),
      scheduleClock: validator.validateClock.bind(validator),
      scheduleMinute: validator.validateMinute.bind(validator),
      scheduleWeekDay: validator.validateWeekDay.bind(validator),
      scheduleMonthDay: validator.validateMonthDay.bind(validator)
    }),
    [validator]
  );

  // validates all schedule fields
  const validateScheduleFields = (model: ModelWithScheduleFields) => {
    const newErrors = { ...props.errors };
    for (const fieldKey of fieldKeys) {
      const validator = validatorsByFieldKey[fieldKey];

      // if this field doesn't have a validator, or if the current schedule
      // interval doesn't render this field, then clear validation errors.
      if (
        !validator ||
        !intervalsByFieldKey[fieldKey].includes(model.scheduleInterval)
      ) {
        newErrors[fieldKey] = '';
        continue;
      }

      // otherwise validate the current field.
      newErrors[fieldKey] = validator(model[fieldKey]);
    }

    props.handleErrorsChange(newErrors);
  };

  /**
   * Effect:
   * - whenever component is mounted, validate all schedule fields
   * - whenever component is unmounted, remove all schedule fields from errors object
   */
  useEffect(() => {
    validateScheduleFields(props.model);

    return () => {
      props.handleErrorsChange({
        ...props.errors,
        ...emptyScheduleErrors
      });
    };
  }, []);

  /**
   * Effect: compute derived state on change in fields state
   * - when using easy scheduling, props.model.schedule is derived from the other fields
   * - otherwise, the other fields are derived from props.model.schedule
   */
  useEffect(() => {
    if (props.model.scheduleInterval === 'custom') {
      const [minute, hour, monthDay, , weekDay] = parseCron(
        props.model.schedule
      );

      props.handleModelChange({
        ...props.model,
        scheduleClock: toClock(hour, minute),
        scheduleMinute: `${minute}`,
        scheduleMonthDay: `${monthDay}`,
        scheduleWeekDay: `${weekDay}`
      });
    } else {
      props.handleModelChange({
        ...props.model,
        schedule: toCron(props.model)
      });
    }
  }, [
    props.model.scheduleInterval,
    props.model.schedule,
    props.model.scheduleMinute,
    props.model.scheduleClock,
    props.model.scheduleMonthDay,
    props.model.scheduleWeekDay
  ]);

  const handleChange = (
    e:
      | SelectChangeEvent
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newModel = {
      ...props.model,
      [e.target.name]: e.target.value
    };
    props.handleModelChange(newModel);
    validateScheduleFields(newModel);
  };

  const handleTimezoneChange = (e: unknown, value: string | null) => {
    props.handleModelChange({
      ...props.model,
      timezone: value ?? defaultScheduleFields.timezone
    });
  };

  const intervalLabelId = `${props.idPrefix}interval-label`;
  const intervalLabelText = trans.__('Interval');

  const dayOfWeekLabelId = `${props.idPrefix}dayofweek-label`;
  const dayOfWeekText = trans.__('Day of the week');

  const monthDayHelperText = useMemo(() => {
    const monthDay = parseInt(props.model.scheduleMonthDay);

    return !isNaN(monthDay) && monthDay > 28
      ? trans.__(
          'The job will not run in months with fewer than %1 days',
          props.model.scheduleMonthDay
        )
      : '1–31';
  }, [trans, props.model.scheduleMonthDay]);

  const clockHelperText = useMemo(() => {
    const [hours, minutes] = parseClock(props.model.scheduleClock);

    if (hours === undefined || minutes === undefined) {
      return trans.__('00:00-23:59');
    }

    const displayHours = hours % 12 === 0 ? '12' : hours % 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;

    if (hours < 12) {
      return trans.__('%1:%2 AM', displayHours, displayMinutes);
    } else {
      return trans.__('%1:%2 PM', displayHours, displayMinutes);
    }
  }, [trans, props.model.scheduleClock]);

  const scheduleHelperText = useMemo(() => {
    try {
      return cronstrue.toString(props.model.schedule);
    } catch (e) {
      return '';
    }
  }, [props.model.schedule]);

  const tzOffsetHours = new Date().getTimezoneOffset() / 60;
  let tzMessage;
  if (tzOffsetHours === 0) {
    tzMessage = trans.__('Specify time in UTC (local time)');
  } else if (tzOffsetHours === -1) {
    tzMessage = trans.__(
      'Specify time in UTC (subtract 1 hour from local time)'
    );
  } else if (tzOffsetHours < 0) {
    tzMessage = trans.__(
      'Specify time in UTC (subtract %1 hours from local time)',
      -tzOffsetHours
    );
  } else if (tzOffsetHours === 1) {
    tzMessage = trans.__('Specify time in UTC (add 1 hour to local time)');
  } else if (tzOffsetHours > 0) {
    tzMessage = trans.__(
      'Specify time in UTC (add %1 hours to local time)',
      tzOffsetHours
    );
  }

  const timezonePicker = props.utcOnly ? (
    <p>
      {tzMessage}
      <br />
      {trans.__(
        'Schedules in UTC are affected by daylight saving time or summer time changes'
      )}
    </p>
  ) : (
    <Autocomplete
      id={`${props.idPrefix}timezone`}
      options={timezones}
      value={props.model.timezone}
      onChange={handleTimezoneChange}
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

  const clockInput = (
    <TextField
      label={trans.__('Time')}
      name="scheduleClock"
      value={props.model.scheduleClock}
      onChange={handleChange}
      error={!!props.errors.scheduleClock}
      helperText={props.errors.scheduleClock || clockHelperText}
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
          name="scheduleInterval"
          value={props.model.scheduleInterval}
          onChange={handleChange}
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
            name="scheduleMinute"
            value={props.model.scheduleMinute}
            onChange={handleChange}
            error={!!props.errors.scheduleMinute}
            helperText={props.errors.scheduleMinute || trans.__('0–59')}
          />
        </>
      )}
      {props.model.scheduleInterval === 'week' && (
        <>
          <FormControl error={!!props.errors.scheduleWeekDay}>
            <InputLabel id={dayOfWeekLabelId}>{dayOfWeekText}</InputLabel>
            <Select
              labelId={dayOfWeekLabelId}
              label={dayOfWeekText}
              variant="outlined"
              id={`${props.idPrefix}dayOfWeek`}
              name="scheduleWeekDay"
              value={props.model.scheduleWeekDay}
              onChange={handleChange}
            >
              <MenuItem value={'1'}>{trans.__('Monday')}</MenuItem>
              <MenuItem value={'2'}>{trans.__('Tuesday')}</MenuItem>
              <MenuItem value={'3'}>{trans.__('Wednesday')}</MenuItem>
              <MenuItem value={'4'}>{trans.__('Thursday')}</MenuItem>
              <MenuItem value={'5'}>{trans.__('Friday')}</MenuItem>
              <MenuItem value={'6'}>{trans.__('Saturday')}</MenuItem>
              <MenuItem value={'0'}>{trans.__('Sunday')}</MenuItem>
            </Select>
            <FormHelperText>
              {props.errors.scheduleWeekDay || ''}
            </FormHelperText>
          </FormControl>
          {clockInput}
          {timezonePicker}
        </>
      )}
      {(props.model.scheduleInterval === 'weekday' ||
        props.model.scheduleInterval === 'day') && (
        <>
          {clockInput}
          {timezonePicker}
        </>
      )}
      {props.model.scheduleInterval === 'month' && (
        <>
          <TextField
            label={trans.__('Day of the month')}
            name="scheduleMonthDay"
            value={props.model.scheduleMonthDay}
            onChange={handleChange}
            error={!!props.errors.scheduleMonthDay}
            helperText={props.errors.scheduleMonthDay || monthDayHelperText}
          />
          {clockInput}
          {timezonePicker}
        </>
      )}
      {props.model.scheduleInterval === 'custom' && (
        <>
          <TextField
            label={trans.__('cron expression')}
            variant="outlined"
            onChange={handleChange}
            value={props.model.schedule}
            id={`${props.idPrefix}schedule`}
            name="schedule"
            error={!!props.errors.schedule}
            helperText={props.errors.schedule || scheduleHelperText}
          />
          {cronTips}
          {timezonePicker}
        </>
      )}
    </>
  );
}

function parseClock(input: string): [number | undefined, number | undefined] {
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

// Converts hours and minutes to hh:mm format
function toClock(hours: number, minutes: number): string {
  return (
    (hours < 10 ? '0' + hours : hours) +
    ':' +
    (minutes < 10 ? '0' + minutes : minutes)
  );
}

type CronTerms = [number, number, number, number, number];

/**
 * Extracts cron terms and coerces them into an array of numbers. Ranges are
 * coerced by their first term, e.g. "12-34" is coerced to 12.
 */
function parseCron(schedule: string): CronTerms {
  // default values are all valid and should match model.ts
  const parsedTerms: CronTerms = [0, 0, 1, 1, 1];

  const terms = /(\S*) (\S*) (\S*) (\S*) (\S*)/.exec(schedule.trim());

  if (!terms || terms.length < 6) {
    return parsedTerms;
  }

  for (let i = 0; i < 5; i++) {
    const parsed = parseInt(terms[i + 1]);
    if (!isNaN(parsed)) {
      parsedTerms[i] = parsed;
    }
  }

  return parsedTerms;
}

/**
 * Accepts the model and returns its equivalent cron expression.
 */
function toCron(model: ModelWithScheduleFields): string {
  if (model.scheduleInterval === 'custom') {
    return model.schedule;
  }
  if (model.scheduleInterval === 'minute') {
    return '* * * * *';
  }
  if (model.scheduleInterval === 'hour') {
    const minute = model.scheduleMinute;
    return `${minute} * * * *`;
  }

  // other intervals always use clock, so parse it
  const [hour, minute] = parseClock(model.scheduleClock);
  // leave schedule untouched if invalid clock; validation errors should prevent
  // submission anyways.
  if (hour === undefined || minute === undefined) {
    return model.schedule;
  }

  switch (model.scheduleInterval) {
    case 'day': {
      return `${minute} ${hour} * * *`;
    }
    case 'week': {
      const weekDay = model.scheduleWeekDay;
      return `${minute} ${hour} * * ${weekDay}`;
    }
    case 'weekday':
      return `${minute} ${hour} * * MON-FRI`;
    case 'month': {
      const monthDay = model.scheduleMonthDay;
      return `${minute} ${hour} ${monthDay} * *`;
    }
  }
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

  validateClock(input: string): string {
    const errorMessage = this.trans.__('Time must be in hh:mm format');

    const [hours, minutes] = parseClock(input);

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

  validateMinute(input: string): string {
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

  validateWeekDay(input: string): string {
    const errorMessage = this.trans.__(
      'Day of the week must be between Monday and Sunday'
    );

    // OK to compare single chars by lexicographical order
    if (input.length !== 1 || input < '0' || input > '6') {
      return errorMessage;
    }

    return '';
  }

  validateCron(schedule: string): string {
    try {
      cronstrue.toString(schedule);
      // No error
      return '';
    } catch {
      return this.trans.__('You must provide a valid cron expression.');
    }
  }
}
