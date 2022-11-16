import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';

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
import { ICreateJobModel, IJobParameter, JobsView } from '../model';
import { Scheduler as SchedulerTokens } from '../tokens';
import { NameError } from '../util/job-name-validation';

import { caretDownIcon } from '@jupyterlab/ui-components';

import ErrorIcon from '@mui/icons-material/Error';
import FolderIcon from '@mui/icons-material/Folder';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  CircularProgress,
  FormLabel,
  InputAdornment,
  SelectChangeEvent,
  TextField
} from '@mui/material';

import { Box, Stack } from '@mui/system';

export interface ICreateJobProps {
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  showListView: (
    list: JobsView.ListJobs | JobsView.ListJobDefinitions,
    newlyCreatedId?: string,
    newlyCreatedName?: string
  ) => unknown;
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

  const [advancedOptionsExpanded, setAdvancedOptionsExpanded] =
    useState<boolean>(false);

  // A mapping from input names to error messages.
  // If an error message is "truthy" (i.e., not null or ''), we should display the
  // input in an error state and block form submission.
  const [errors, setErrors] = useState<SchedulerTokens.ErrorsType>({});
  // Errors for the advanced options
  const [advancedOptionsErrors, setAdvancedOptionsErrors] =
    useState<SchedulerTokens.ErrorsType>({});

  const api = useMemo(() => new SchedulerService({}), []);

  // Retrieve the environment list once.
  useEffect(() => {
    const setList = async () => {
      const envList = await api.getRuntimeEnvironments();
      setEnvironmentList(envList);

      // Choose the first environment if none was selected before
      // (this would happen if the create form is used for editing)
      if (props.model.environment === '') {
        // If no default compute type is specified, show the first one by default
        let newComputeType = envList[0].compute_types?.[0];

        // Validate that the default compute type is in fact in the list
        if (
          envList[0].default_compute_type &&
          envList[0].compute_types &&
          envList[0].compute_types.includes(envList[0].default_compute_type)
        ) {
          newComputeType = envList[0].default_compute_type;
        }

        const outputFormats = outputFormatsForEnvironment(
          envList,
          envList[0].name
        )?.map(format => format.name);

        props.handleModelChange({
          ...props.model,
          environment: envList[0].name,
          computeType: newComputeType,
          outputFormats: outputFormats
        });
      }
    };

    setList();
  }, []);

  const envsByName = useMemo(() => {
    const obj: Record<string, Scheduler.IRuntimeEnvironment> = {};
    for (const env of environmentList) {
      obj[env.name] = env;
    }

    return obj;
  }, [environmentList]);

  const prevEnvName = useRef<string>();

  /**
   * Effect: when selected environment changes between supporting/not supporting
   * timezones, set the timezone accordingly.
   */
  useEffect(() => {
    const prevEnv = envsByName[prevEnvName.current ?? ''];
    const currEnv = envsByName[props.model.environment];

    if (currEnv && (!prevEnv || prevEnv.utc_only !== currEnv.utc_only)) {
      props.handleModelChange({
        ...props.model,
        timezone: currEnv.utc_only
          ? 'UTC'
          : Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }

    prevEnvName.current = props.model.environment;
  }, [props.model.environment, envsByName]);

  // If any error message is "truthy" (not null or empty), the form should not be submitted.
  const anyAdvancedErrors = Object.keys(advancedOptionsErrors).some(
    key => !!advancedOptionsErrors[key]
  );
  const anyErrors =
    Object.keys(errors).some(key => !!errors[key]) || anyAdvancedErrors;

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

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const target = event.target;

    // if setting the environment, default the compute type to its default value or its first value
    if (target.name === 'environment') {
      const envObj = environmentList.find(env => env.name === target.value);
      // Validate that the default compute type is in fact in the list
      let newComputeType = envObj?.compute_types?.[0];

      if (
        envObj?.default_compute_type &&
        envObj?.compute_types &&
        envObj?.compute_types.includes(envObj?.default_compute_type)
      ) {
        newComputeType = envObj.default_compute_type;
      }

      const newEnvOutputFormats = outputFormatsForEnvironment(
        environmentList,
        target.value
      )?.map(format => format.name);

      props.handleModelChange({
        ...props.model,
        environment: target.value,
        computeType: newComputeType,
        outputFormats: newEnvOutputFormats
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

  const submitForm = async (event: React.MouseEvent) => {
    // Collapse the "Advanced Options" section so that users can see
    // errors at the top, if there are any.
    setAdvancedOptionsExpanded(false);

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

    props.handleModelChange({
      ...props.model,
      createError: undefined,
      createInProgress: true
    });

    api
      .createJob(jobOptions)
      .then(response => {
        // Switch to the list view with "Job List" active
        props.showListView(JobsView.ListJobs, response.job_id, jobOptions.name);
      })
      .catch((error: Error) => {
        props.handleModelChange({
          ...props.model,
          createError: error.message,
          createInProgress: false
        });
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

    props.handleModelChange({
      ...props.model,
      createError: undefined,
      createInProgress: true
    });

    api
      .createJobDefinition(jobDefinitionOptions)
      .then(response => {
        // Switch to the list view with "Job Definition List" active
        props.showListView(
          JobsView.ListJobDefinitions,
          response.job_definition_id,
          jobDefinitionOptions.name
        );
      })
      .catch((error: Error) => {
        props.handleModelChange({
          ...props.model,
          createError: error.message,
          createInProgress: false
        });
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
  const createError: string | undefined = props.model.createError;

  const homeAdornment = (
    <InputAdornment position="start">
      <FolderIcon fontSize="small" />
      &nbsp;&nbsp;/
    </InputAdornment>
  );

  // Does the currently-selected environment accept times in UTC only?
  const utcOnly = envsByName[props.model.environment]?.utc_only;

  return (
    <Box sx={{ p: 4 }}>
      <form className={`${formPrefix}form`} onSubmit={e => e.preventDefault()}>
        <Stack spacing={4}>
          <Heading level={1}>{trans.__('Create Job')}</Heading>
          {createError && <Alert severity="error">{createError}</Alert>}
          <TextField
            label={trans.__('Job name')}
            variant="outlined"
            onChange={e => {
              // Validate name
              setErrors({
                ...errors,
                jobName: NameError(e.target.value, trans)
              });
              handleInputChange(e as ChangeEvent<HTMLInputElement>);
            }}
            error={!!errors['jobName']}
            helperText={errors['jobName'] ?? ''}
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
              readOnly: true,
              startAdornment: homeAdornment
            }}
          />
          <EnvironmentPicker
            label={trans.__('Environment')}
            name={'environment'}
            id={`${formPrefix}environment`}
            onChange={handleSelectChange}
            environmentList={environmentList}
            value={props.model.environment}
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
          <Accordion
            defaultExpanded={false}
            expanded={advancedOptionsExpanded}
            onChange={(_: React.SyntheticEvent, expanded: boolean) =>
              setAdvancedOptionsExpanded(expanded)
            }
          >
            <AccordionSummary
              expandIcon={<caretDownIcon.react />}
              aria-controls="panel-content"
              id="panel-header"
            >
              <FormLabel component="legend">
                <Cluster>
                  {anyAdvancedErrors && (
                    <ErrorIcon color="error" aria-label="error">
                      {trans.__('There is an error in the advanced options')}
                    </ErrorIcon>
                  )}
                  {trans.__('Additional options')}
                </Cluster>
              </FormLabel>
            </AccordionSummary>
            <AccordionDetails id={`${formPrefix}create-panel-content`}>
              <props.advancedOptions
                jobsView={JobsView.CreateForm}
                model={props.model}
                handleModelChange={props.handleModelChange}
                errors={advancedOptionsErrors}
                handleErrorsChange={setAdvancedOptionsErrors}
              />
            </AccordionDetails>
          </Accordion>
          <CreateScheduleOptions
            label={trans.__('Schedule')}
            name={'createType'}
            id={`${formPrefix}createType`}
            model={props.model}
            handleModelChange={props.handleModelChange}
            errors={errors}
            handleErrorsChange={setErrors}
            utcOnly={utcOnly}
          />
          <Cluster gap={3} justifyContent="flex-end">
            {props.model.createInProgress || (
              <>
                <Button
                  variant="outlined"
                  onClick={e => props.showListView(JobsView.ListJobs)}
                >
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
              </>
            )}
            {props.model.createInProgress && (
              <>
                {props.model.createType === 'Job'
                  ? trans.__('Creating job …')
                  : trans.__('Creating job definition …')}
                <CircularProgress size="30px" />
              </>
            )}
          </Cluster>
        </Stack>
      </form>
    </Box>
  );
}
