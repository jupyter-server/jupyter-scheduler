import React, { ChangeEvent, useMemo, useState } from 'react';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';
import { ParametersPicker } from '../components/parameters-picker';
import { Scheduler, SchedulerService } from '../handler';
import { useTranslator } from '../hooks';
import { ICreateJobModel, IJobParameter, JobsView } from '../model';
import { Scheduler as SchedulerTokens } from '../tokens';

import { Alert, Button, CircularProgress } from '@mui/material';

import { Box, Stack } from '@mui/system';

import { LabeledValue } from '../components/labeled-value';

export interface ICreateJobFromDefinitionProps {
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

export function CreateJobFromDefinition(
  props: ICreateJobFromDefinitionProps
): JSX.Element {
  const trans = useTranslator('jupyterlab');

  // A mapping from input names to error messages.
  // If an error message is "truthy" (i.e., not null or ''), we should display the
  // input in an error state and block form submission.
  const [errors, setErrors] = useState<SchedulerTokens.ErrorsType>({});

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
        'User attempted to submit a submitCreateJobRequest request; button should have been disabled'
      );
      return;
    }

    if (!props.model.jobDefinitionId) {
      console.error(
        'User did not provide a job definition ID to submitCreateJobRequest request'
      );
      return;
    }

    const createJobFromDefinitionModel: Scheduler.ICreateJobFromDefinition = {};
    if (props.model.parameters !== undefined) {
      createJobFromDefinitionModel.parameters = serializeParameters(
        props.model.parameters
      );
    }

    props.handleModelChange({
      ...props.model,
      createError: undefined,
      createInProgress: true
    });

    api
      .createJobFromDefinition(
        props.model.jobDefinitionId,
        createJobFromDefinitionModel
      )
      .then(response => {
        // Switch to the list view with "Job List" active
        props.showListView(
          JobsView.ListJobs,
          response.job_id,
          props.model.jobName
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
                    submitCreateJobRequest(e);
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
