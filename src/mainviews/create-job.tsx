import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';
import { ComputeTypePicker } from '../components/compute-type-picker';
import { CreateScheduleOptions } from '../components/create-schedule-options';
import { EnvironmentPicker } from '../components/environment-picker';
import {
  OutputFormatPicker,
  outputFormatsForEnvironment
} from '../components/output-format-picker';
import { ParametersPicker } from '../components/parameters-picker';
import { Scheduler, SchedulerService } from '../handler';
import { useTranslator } from '../hooks';
import { ICreateJobModel, IJobParameter, ListJobsView } from '../model';
import { Scheduler as SchedulerTokens } from '../tokens';

import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Stack from '@mui/system/Stack';
import TextField from '@mui/material/TextField';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormLabel,
  SelectChangeEvent
} from '@mui/material';

import { caretDownIcon } from '@jupyterlab/ui-components';

import cronstrue from 'cronstrue';

export interface ICreateJobProps {
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  showListView: (list: ListJobsView) => unknown;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
}

function parameterNameMatch(elementName: string): number | null {
  const parameterNameMatch = elementName.match(/^parameter-(\d+)-name$/);

  if (parameterNameMatch === null) {
    return null;
  }

  return parseInt(parameterNameMatch[1]);
}

function parameterValueMatch(elementName: string): number | null {
  const parameterValueMatch = elementName.match(/^parameter-(\d+)-value$/);

  if (parameterValueMatch === null) {
    return null;
  }

  return parseInt(parameterValueMatch[1]);
}

export function CreateJob(props: ICreateJobProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  // Cache environment list.
  const [environmentList, setEnvironmentList] = useState<
    Scheduler.IRuntimeEnvironment[]
  >([]);

  // A mapping from input names to error messages.
  // If an error message is "truthy" (i.e., not null or ''), we should display the
  // input in an error state and block form submission.
  const [errors, setErrors] = useState<SchedulerTokens.ErrorsType>({});

  const api = useMemo(() => new SchedulerService({}), []);

  // Retrieve the environment list once.
  useEffect(() => {
    const setList = async () => {
      setEnvironmentList(await api.getRuntimeEnvironments());
    };

    setList();
  }, []);

  // If any error message is "truthy" (not null or empty), the form should not be submitted.
  const anyErrors = Object.keys(errors).some(key => !!errors[key]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;

    const parameterNameIdx = parameterNameMatch(target.name);
    const parameterValueIdx = parameterValueMatch(target.name);
    const newParams = props.model.parameters || [];

    if (parameterNameIdx !== null) {
      newParams[parameterNameIdx].name = target.value;
      props.handleModelChange({ ...props.model, parameters: newParams });
    } else if (parameterValueIdx !== null) {
      newParams[parameterValueIdx].value = target.value;
      props.handleModelChange({ ...props.model, parameters: newParams });
    } else {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      props.handleModelChange({ ...props.model, [name]: value });
    }
  };

  const validateSchedule = (schedule: string) => {
    try {
      cronstrue.toString(schedule);
      // No error
      setErrors({
        ...errors,
        schedule: ''
      });
    } catch {
      setErrors({
        ...errors,
        schedule: trans.__('You must provide a valid cron expression.')
      });
    }
  };

  const handleScheduleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Validate the cron expression
    validateSchedule(event.target.value);
    handleInputChange(event);
  };

  // Takes only a string as input
  const handleTimezoneChange = (value: string | null) => {
    props.handleModelChange({ ...props.model, timezone: value ?? '' });
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const target = event.target;

    // if setting the environment, default the compute type to its first value (if any are presnt)
    if (target.name === 'environment') {
      const envObj = environmentList.find(env => env.name === target.value);
      props.handleModelChange({
        ...props.model,
        environment: target.value,
        computeType: envObj?.compute_types?.[0]
      });
    } else {
      // otherwise, just set the model
      props.handleModelChange({ ...props.model, [target.name]: target.value });
    }
  };

  const handleOutputFormatsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const outputFormatsList = outputFormatsForEnvironment(
      environmentList,
      props.model.environment
    );
    if (outputFormatsList === null) {
      return; // No data about output formats; give up
    }

    const formatName = event.target.value;
    const isChecked = event.target.checked;

    const wasChecked: boolean = props.model.outputFormats
      ? props.model.outputFormats.some(of => of === formatName)
      : false;

    const oldOutputFormats: string[] = props.model.outputFormats || [];

    // Go from unchecked to checked
    if (isChecked && !wasChecked) {
      // Get the output format matching the given name
      const newFormat = outputFormatsList.find(of => of.name === formatName);
      if (newFormat) {
        props.handleModelChange({
          ...props.model,
          outputFormats: [...oldOutputFormats, newFormat.name]
        });
      }
    }
    // Go from checked to unchecked
    else if (!isChecked && wasChecked) {
      props.handleModelChange({
        ...props.model,
        outputFormats: oldOutputFormats.filter(of => of !== formatName)
      });
    }

    // If no change in checkedness, don't do anything
  };

  const parseTime = (input: string) => {
    // Allow h:mm or hh:mm
    const timeRegex = /^(\d\d?):(\d\d)$/;
    const timeResult = timeRegex.exec(input);

    let hours;
    let minutes;

    if (timeResult) {
      hours = parseInt(timeResult[1]);
      minutes = parseInt(timeResult[2]);
    }

    return [hours, minutes];
  };

  const validateTime = (input: string) => {
    const errorMessage = trans.__('Time must be in hh:mm format');

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
  };

  const handleScheduleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    let hours = props.model.scheduleHour;
    let minutes = props.model.scheduleMinute;
    let schedule = props.model.schedule;

    const timeError = validateTime(value);

    if (!timeError) {
      setErrors({
        ...errors,
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

    setErrors({
      ...errors,
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

  const validateHourMinute = (input: string) => {
    const errorMessage = trans.__('Minute must be between 0 and 59');
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
  };

  const handleScheduleMinuteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    let minutes = props.model.scheduleHourMinute;
    let schedule = props.model.schedule;

    const scheduleHourMinuteError = validateHourMinute(value);

    if (!scheduleHourMinuteError) {
      minutes = parseInt(value);
      // No errors; compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'hour':
          schedule = `${minutes} * * * *`;
          break;
      }
    }

    setErrors({
      ...errors,
      scheduleHourMinute: scheduleHourMinuteError
    });

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleMinuteInput: value,
      scheduleHourMinute: minutes
    });
  };

  const validateMonthDay = (input: string) => {
    const errorMessage = trans.__('Day of the month must be between 1 and 31');

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
  };

  const handleScheduleMonthDayChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    let monthDay = props.model.scheduleMonthDay;
    let schedule = props.model.schedule;

    const monthDayError = validateMonthDay(value);

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

    setErrors({
      ...errors,
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

    const newErrors = errors;
    for (const fieldToValidate of allFields) {
      if (neededFields[newInterval].includes(fieldToValidate)) {
        // Validate the field.
        // Skip validation if value in model is undefined; this typically indicates initial load.
        switch (fieldToValidate) {
          case 'scheduleTime':
            if (props.model.scheduleTimeInput !== undefined) {
              newErrors[fieldToValidate] = validateTime(
                props.model.scheduleTimeInput
              );
            }
            break;
          case 'scheduleHourMinute':
            if (props.model.scheduleMinuteInput !== undefined) {
              newErrors[fieldToValidate] = validateHourMinute(
                props.model.scheduleMinuteInput
              );
            }
            break;
          case 'scheduleMonthDay':
            if (props.model.scheduleMonthDayInput !== undefined) {
              newErrors[fieldToValidate] = validateMonthDay(
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

    setErrors(newErrors);

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

  const handleScheduleOptionsChange = (
    event: ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    const name = event.target.name;

    // When changing from JobDefinition to Job, remove errors,
    // so that in case there's an error with the schedule,
    // the form can still be submitted.
    if (value === 'Job') {
      // Change from 'JobDefinition'
      setErrors({
        ...errors,
        ['schedule']: ''
      });
    }
    if (value === 'JobDefinition') {
      // If the schedule is not populated, don't display an error for now.
      if (props.model.schedule) {
        validateSchedule(props.model.schedule);
      }
    }

    props.handleModelChange({ ...props.model, [name]: value });
  };

  const submitForm = async (event: React.MouseEvent) => {
    switch (props.model.createType) {
      case 'Job':
        return submitCreateJobRequest(event);
      case 'JobDefinition':
        return submitCreateJobDefinitionRequest(event);
    }
  };

  // Convert an array of parameters (as used for display) to an object
  // (for submission to the API)
  const serializeParameters = (parameters: IJobParameter[]) => {
    const jobParameters: { [key: string]: any } = {};

    parameters.forEach(param => {
      const { name, value } = param;
      if (jobParameters[name] !== undefined) {
        console.error(
          'Parameter ' +
            name +
            ' already set to ' +
            jobParameters[name] +
            ' and is about to be set again to ' +
            value
        );
      } else {
        jobParameters[name] = value;
      }
    });

    return jobParameters;
  };

  const submitCreateJobRequest = async (event: React.MouseEvent) => {
    if (anyErrors) {
      console.error(
        'User attempted to submit a createJob request; button should have been disabled'
      );
      return;
    }

    // Serialize parameters as an object.
    const jobOptions: Scheduler.ICreateJob = {
      name: props.model.jobName,
      input_uri: props.model.inputFile,
      output_prefix: props.model.outputPath,
      runtime_environment_name: props.model.environment,
      output_formats: props.model.outputFormats,
      compute_type: props.model.computeType,
      idempotency_token: props.model.idempotencyToken,
      tags: props.model.tags,
      runtime_environment_parameters: props.model.runtimeEnvironmentParameters
    };

    if (props.model.parameters !== undefined) {
      jobOptions.parameters = serializeParameters(props.model.parameters);
    }

    api.createJob(jobOptions).then(response => {
      // Switch to the list view with "Job List" active
      props.showListView('Job');
    });
  };

  const submitCreateJobDefinitionRequest = async (event: React.MouseEvent) => {
    if (anyErrors) {
      console.error(
        'User attempted to submit a createJobDefinition request; button should have been disabled'
      );
      return;
    }

    const jobDefinitionOptions: Scheduler.ICreateJobDefinition = {
      name: props.model.jobName,
      input_uri: props.model.inputFile,
      output_prefix: props.model.outputPath,
      runtime_environment_name: props.model.environment,
      compute_type: props.model.computeType,
      output_formats: props.model.outputFormats,
      tags: props.model.tags,
      runtime_environment_parameters: props.model.runtimeEnvironmentParameters,
      schedule: props.model.schedule,
      timezone: props.model.timezone
    };

    if (props.model.parameters !== undefined) {
      jobDefinitionOptions.parameters = serializeParameters(
        props.model.parameters
      );
    }

    api.createJobDefinition(jobDefinitionOptions).then(response => {
      // Switch to the list view with "Job Definition List" active
      props.showListView('JobDefinition');
    });
  };

  const removeParameter = (idx: number) => {
    const newParams = props.model.parameters || [];
    newParams.splice(idx, 1);

    const newErrors: Record<string, string> = {};
    for (const formKey in errors) {
      const paramMatch = formKey.match(/^parameter-(\d+)/);
      const paramIdx =
        paramMatch && paramMatch.length >= 2 ? parseInt(paramMatch[1]) : -1;

      if (paramIdx === -1 || paramIdx < idx) {
        // restore errors associated with params before deleted param and all
        // other form fields
        newErrors[formKey] = errors[formKey];
        continue;
      }
      if (paramIdx === idx) {
        // ignore errors associated with deleted param
        continue;
      }

      // otherwise, restore errors with params after deleted param by offsetting
      // their index by -1
      newErrors[`parameter-${paramIdx - 1}-name`] =
        errors[`parameter-${paramIdx}-name`];
    }

    props.handleModelChange({ ...props.model, parameters: newParams });
    setErrors(newErrors);
  };

  const addParameter = () => {
    const newParams = props.model.parameters || [];
    newParams.push({ name: '', value: '' });

    props.handleModelChange({ ...props.model, parameters: newParams });
  };

  const formPrefix = 'jp-create-job-';

  const cantSubmit = trans.__('One or more of the fields has an error.');

  return (
    <Box sx={{ p: 4 }}>
      <form className={`${formPrefix}form`} onSubmit={e => e.preventDefault()}>
        <Stack spacing={4}>
          <Heading level={1}>Create Job</Heading>
          <TextField
            label={trans.__('Job name')}
            variant="outlined"
            onChange={handleInputChange}
            value={props.model.jobName}
            id={`${formPrefix}jobName`}
            name="jobName"
          />
          <TextField
            label={trans.__('Input file')}
            variant="outlined"
            onChange={handleInputChange}
            value={props.model.inputFile}
            id={`${formPrefix}inputFile`}
            helperText={errors['inputFile'] ?? ''}
            name="inputFile"
            InputProps={{
              readOnly: true
            }}
          />
          <TextField
            label={trans.__('Output path')}
            variant="outlined"
            onChange={handleInputChange}
            value={props.model.outputPath}
            id={`${formPrefix}outputPath`}
            name="outputPath"
          />
          <EnvironmentPicker
            label={trans.__('Environment')}
            name={'environment'}
            id={`${formPrefix}environment`}
            onChange={handleSelectChange}
            environmentList={environmentList}
            initialValue={props.model.environment}
          />
          <OutputFormatPicker
            label={trans.__('Output formats')}
            name="outputFormat"
            id={`${formPrefix}outputFormat`}
            onChange={handleOutputFormatsChange}
            environmentList={environmentList}
            environment={props.model.environment}
            value={props.model.outputFormats || []}
          />
          <ComputeTypePicker
            label={trans.__('Compute type')}
            name="computeType"
            id={`${formPrefix}computeType`}
            onChange={handleSelectChange}
            environmentList={environmentList}
            environment={props.model.environment}
            value={props.model.computeType}
          />
          <ParametersPicker
            label={trans.__('Parameters')}
            name={'parameters'}
            id={`${formPrefix}parameters`}
            value={props.model.parameters || []}
            onChange={handleInputChange}
            addParameter={addParameter}
            removeParameter={removeParameter}
            formPrefix={formPrefix}
            errors={errors}
            handleErrorsChange={setErrors}
          />
          <Accordion defaultExpanded={false}>
            <AccordionSummary
              expandIcon={<caretDownIcon.react />}
              aria-controls="panel-content"
              id="panel-header"
            >
              <FormLabel component="legend">
                {trans.__('Additional options')}
              </FormLabel>
            </AccordionSummary>
            <AccordionDetails id={`${formPrefix}create-panel-content`}>
              <props.advancedOptions
                jobsView={'CreateJob'}
                model={props.model}
                handleModelChange={props.handleModelChange}
                errors={errors}
                handleErrorsChange={setErrors}
              />
            </AccordionDetails>
          </Accordion>
          <CreateScheduleOptions
            label={trans.__('Schedule')}
            name={'createType'}
            id={`${formPrefix}createType`}
            model={props.model}
            handleModelChange={props.handleModelChange}
            handleScheduleIntervalChange={handleScheduleIntervalChange}
            handleScheduleMonthDayChange={handleScheduleMonthDayChange}
            handleScheduleWeekDayChange={handleScheduleWeekDayChange}
            handleScheduleTimeChange={handleScheduleTimeChange}
            handleScheduleMinuteChange={handleScheduleMinuteChange}
            handleCreateTypeChange={handleScheduleOptionsChange}
            handleScheduleChange={handleScheduleChange}
            handleTimezoneChange={handleTimezoneChange}
            errors={errors}
            handleErrorsChange={setErrors}
          />
          <Cluster gap={3} justifyContent="flex-end">
            <Button variant="outlined" onClick={e => props.showListView('Job')}>
              {trans.__('Cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={(e: React.MouseEvent) => {
                submitForm(e);
                return false;
              }}
              disabled={anyErrors}
              title={anyErrors ? cantSubmit : ''}
            >
              {trans.__('Create')}
            </Button>
          </Cluster>
        </Stack>
      </form>
    </Box>
  );
}
