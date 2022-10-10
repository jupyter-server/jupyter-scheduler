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
import {
  ICreateJobModel,
  IJobParameter,
  IOutputFormat,
  ListJobsView
} from '../model';
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

  const handleInputChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;

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
        schedule: trans.__('You must provide a valid Cron expression.')
      });
    }
  };

  const handleScheduleChange = (event: ChangeEvent) => {
    // Validate the cron expression
    validateSchedule((event.target as HTMLInputElement).value);
    handleInputChange(event);
  };

  // Takes only a string as input
  const handleTimezoneChange = (value: string | null) => {
    props.handleModelChange({ ...props.model, timezone: value ?? '' });
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const target = event.target as HTMLInputElement;

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
      ? props.model.outputFormats.some(of => of.name === formatName)
      : false;

    const oldOutputFormats: IOutputFormat[] = props.model.outputFormats || [];

    // Go from unchecked to checked
    if (isChecked && !wasChecked) {
      // Get the output format matching the given name
      const newFormat = outputFormatsList.find(of => of.name === formatName);
      if (newFormat) {
        props.handleModelChange({
          ...props.model,
          outputFormats: [...oldOutputFormats, newFormat]
        });
      }
    }
    // Go from checked to unchecked
    else if (!isChecked && wasChecked) {
      props.handleModelChange({
        ...props.model,
        outputFormats: oldOutputFormats.filter(of => of.name !== formatName)
      });
    }

    // If no change in checkedness, don't do anything
  };

  const handleScheduleTimeChange = (event: ChangeEvent) => {
    const value = (event.target as HTMLInputElement).value;
    // Allow h:mm or hh:mm
    const timeRegex = /^(\d\d?):(\d\d)$/;
    const timeResult = timeRegex.exec(value);

    let hours = props.model.scheduleHour;
    let minutes = props.model.scheduleMinute;
    let schedule = props.model.schedule;

    if (timeResult) {
      hours = parseInt(timeResult[1]);
      minutes = parseInt(timeResult[2]);
    }

    if (
      timeResult &&
      hours !== undefined &&
      hours >= 0 &&
      hours <= 23 &&
      minutes !== undefined &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      setErrors({
        ...errors,
        scheduleTime: ''
      });

      // Compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'day':
          schedule = `${minutes} ${hours} * * *`;
          break;
        case 'weekday':
          schedule = `${minutes} ${hours} * * MON-FRI`;
          break;
      }
    } else {
      setErrors({
        ...errors,
        scheduleTime: trans.__('Time must be in hh:mm format')
      });
    }

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleTimeInput: value,
      scheduleHour: hours,
      scheduleMinute: minutes
    });
  };

  const handleScheduleMinuteChange = (event: ChangeEvent) => {
    const value = (event.target as HTMLInputElement).value;
    const minuteRegex = /^(\d\d?)$/;
    const minuteResult = minuteRegex.exec(value);

    let minutes = props.model.scheduleHourMinute;
    let schedule = props.model.schedule;

    if (minuteResult) {
      minutes = parseInt(minuteResult[1]);
    }

    if (
      minuteResult &&
      minutes !== undefined &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      setErrors({
        ...errors,
        scheduleHourMinute: ''
      });

      // Compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'hour':
          schedule = `${minutes} * * * *`;
          break;
      }
    } else {
      setErrors({
        ...errors,
        scheduleHourMinute: trans.__('Minute must be between 0 and 59')
      });
    }

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleMinuteInput: value,
      scheduleHourMinute: minutes
    });
  };

  const handleScheduleMonthDayChange = (event: ChangeEvent) => {
    const value = (event.target as HTMLInputElement).value;
    const monthDayRegex = /^(\d\d?)$/;
    const monthDayResult = monthDayRegex.exec(value);

    let monthDay = props.model.scheduleMonthDay;
    let schedule = props.model.schedule;

    if (monthDayResult) {
      monthDay = parseInt(monthDayResult[1]);
    }

    if (
      monthDayResult &&
      monthDay !== undefined &&
      monthDay >= 1 &&
      monthDay <= 31
    ) {
      setErrors({
        ...errors,
        scheduleMonthDay: ''
      });

      // Compose a new schedule in cron format
      switch (props.model.scheduleInterval) {
        case 'month':
          schedule = `${props.model.scheduleMinute ?? 0} ${
            props.model.scheduleHour ?? 0
          } ${monthDay} * *`;
          break;
      }
    } else {
      setErrors({
        ...errors,
        scheduleMonthDay: trans.__('Day of the month must be between 1 and 31')
      });
    }

    props.handleModelChange({
      ...props.model,
      schedule: schedule,
      scheduleMonthDayInput: value,
      scheduleMonthDay: monthDay
    });
  };

  const handleScheduleWeekDayChange = (event: SelectChangeEvent<string>) => {
    // Days of the week are numbered 0 (Sunday) through 6 (Saturday)
    const value = (event.target as HTMLSelectElement).value;

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
    // Set the schedule (in cron format) based on the new interval
    let schedule = props.model.schedule;
    let dayOfWeek = props.model.scheduleWeekDay;

    switch (props.model.scheduleInterval) {
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
    event: React.ChangeEvent<HTMLInputElement>,
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
      compute_type: props.model.computeType,
      idempotency_token: props.model.idempotencyToken,
      tags: props.model.tags,
      runtime_environment_parameters: props.model.runtimeEnvironmentParameters
    };

    if (props.model.parameters !== undefined) {
      jobOptions.parameters = serializeParameters(props.model.parameters);
    }

    if (props.model.outputFormats !== undefined) {
      jobOptions.output_formats = props.model.outputFormats.map(
        entry => entry.name
      );
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
      // idempotency_token is in the form, but not in Scheduler.ICreateJobDefinition
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

    if (props.model.outputFormats !== undefined) {
      jobDefinitionOptions.output_formats = props.model.outputFormats.map(
        entry => entry.name
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

  // If the text field is blank, record an error.
  const validateEmpty = (
    e: EventTarget & (HTMLInputElement | HTMLTextAreaElement)
  ) => {
    const inputName = e.name;
    const inputValue = e.value;

    if (inputValue === '') {
      // blank
      setErrors({
        ...errors,
        [inputName]: trans.__('You must provide a value.')
      });
    } else {
      setErrors({ ...errors, [inputName]: '' });
    }
  };

  // Is there a truthy (non-empty) error for this field?
  const hasError = (inputName: string) => {
    return !!errors[inputName];
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
            onBlur={e => validateEmpty(e.target)}
            error={hasError('inputFile')}
            helperText={errors['inputFile'] ?? ''}
            name="inputFile"
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
