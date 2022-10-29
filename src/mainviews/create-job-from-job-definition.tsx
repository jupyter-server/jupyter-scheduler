import React, { ChangeEvent, useMemo, useState } from 'react';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';
import { ParametersPicker } from '../components/parameters-picker';
import { Scheduler, SchedulerService } from '../handler';
import { useTranslator } from '../hooks';
import { ICreateJobModel, IJobParameter, JobsView } from '../model';
import { Scheduler as SchedulerTokens } from '../tokens';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  CircularProgress,
  FormLabel
} from '@mui/material';

import { Box, Stack } from '@mui/system';

import { caretDownIcon } from '@jupyterlab/ui-components';

import { LabeledValue } from '../components/labeled-value';

export interface ICreateJobFromJobDefinitionProps {
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  showListView: (
    list: JobsView.ListJobs | JobsView.ListJobDefinitions
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

export function CreateJobFromJobDefinition(
  props: ICreateJobFromJobDefinitionProps
): JSX.Element {
  const trans = useTranslator('jupyterlab');

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

  // Advanced options are not editable; do not block submission on them
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

  const submitForm = async (event: React.MouseEvent) => {
    // Collapse the "Advanced Options" section so that users can see
    // errors at the top, if there are any.
    setAdvancedOptionsExpanded(false);

    // This form only supports creating a job, not a job definition.
    return submitCreateJobRequest(event);
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
      tags: props.model.tags,
      runtime_environment_parameters: props.model.runtimeEnvironmentParameters,
      job_definition_id: props.model.jobDefinitionId
    };

    if (props.model.parameters !== undefined) {
      jobOptions.parameters = serializeParameters(props.model.parameters);
    }

    props.handleModelChange({
      ...props.model,
      createError: undefined,
      createInProgress: true
    });

    // TODO: Call the "Create job from job definition ID" API
    api
      .createJob(jobOptions)
      .then(response => {
        // Switch to the list view with "Job List" active
        props.showListView(JobsView.ListJobs);
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

  return (
    <Box sx={{ p: 4 }}>
      <form className={`${formPrefix}form`} onSubmit={e => e.preventDefault()}>
        <Stack spacing={4}>
          <Heading level={1}>
            {trans.__('Create Job from Job Definition')}
          </Heading>
          {createError && <Alert severity="error">{createError}</Alert>}
          <LabeledValue
            label={trans.__('Job definition ID')}
            value={props.model.jobDefinitionId}
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
                {trans.__('Additional options')}
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
                {trans.__('Creating job …')}
                <CircularProgress size="30px" />
              </>
            )}
          </Cluster>
        </Stack>
      </form>
    </Box>
  );
}
