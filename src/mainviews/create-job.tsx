import React, { ChangeEvent } from 'react';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';
import { OutputFormatPicker, outputFormatsForEnvironment } from '../components/output-format-picker';
import { ParametersPicker } from '../components/parameters-picker';
import { Scheduler, SchedulerService } from '../handler';
import SchedulerTokens from '../tokens';
import { useTranslator } from '../hooks';
import { ICreateJobModel, IOutputFormat } from '../model';

import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Stack from '@mui/system/Stack';
import TextField from '@mui/material/TextField';
import { EnvironmentPicker } from '../components/environment-picker';
import { SelectChangeEvent } from '@mui/material';

export interface ICreateJobProps {
  model: ICreateJobModel;
  handleModelChanged: (model: ICreateJobModel) => void;
  toggleView: () => unknown;
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

  // Cache text inputs so that React can update their state immediately, preventing
  // a situation where the cursor jumps to the end of the text box after the user
  // enters a character mid-input.
  const [textInputs, setTextInputs] = React.useState<Record<string, string>>({});

  // A mapping from input names to error messages.
  // If an error message is "truthy" (i.e., not null or ''), we should display the
  // input in an error state and block form submission.
  const [errors, setErrors] = React.useState<SchedulerTokens.ErrorsType>({});

  // If any error message is "truthy" (not null or empty), the form should not be submitted.
  const anyErrors = Object.keys(errors).some(key => !!errors[key]);

  const handleInputChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;

    const parameterNameIdx = parameterNameMatch(target.name);
    const parameterValueIdx = parameterValueMatch(target.name);
    const newParams = props.model.parameters || [];

    if (parameterNameIdx !== null) {
      newParams[parameterNameIdx].name = target.value;
      props.handleModelChanged({ ...props.model, parameters: newParams });
    } else if (parameterValueIdx !== null) {
      newParams[parameterValueIdx].value = target.value;
      props.handleModelChanged({ ...props.model, parameters: newParams });
    } else {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      if (typeof value === 'string') {
        setTextInputs({ ...textInputs, [name]: value });
      }
      props.handleModelChanged({ ...props.model, [name]: value });
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const target = event.target as HTMLInputElement;

    props.handleModelChanged({ ...props.model, [target.name]: target.value });
  };

  const handleOutputFormatsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const outputFormatsList = outputFormatsForEnvironment(
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
        props.handleModelChanged({
          ...props.model,
          outputFormats: [...oldOutputFormats, newFormat]
        });
      }
    }
    // Go from checked to unchecked
    else if (!isChecked && wasChecked) {
      props.handleModelChanged({
        ...props.model,
        outputFormats: oldOutputFormats.filter(of => of.name !== formatName)
      });
    }

    // If no change in checkedness, don't do anything
  };

  const submitCreateJobRequest = async (event: React.MouseEvent) => {
    if (anyErrors) {
      console.error('User attempted to submit a createJob request; button should have been disabled');
      return;
    }

    const api = new SchedulerService({});

    // Serialize parameters as an object.
    const jobOptions: Scheduler.ICreateJob = {
      name: props.model.jobName,
      input_uri: props.model.inputFile,
      output_prefix: props.model.outputPath,
      runtime_environment_name: props.model.environment
    };

    if (props.model.parameters !== undefined) {
      const jobParameters: { [key: string]: any } = {};

      props.model.parameters.forEach(param => {
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

      jobOptions.parameters = jobParameters;
    }

    if (props.model.outputFormats !== undefined) {
      jobOptions.output_formats = props.model.outputFormats.map(
        entry => entry.name
      );
    }

    api.createJob(jobOptions).then(response => {
      props.toggleView();
    });
  };

  const removeParameter = (idx: number) => {
    const newParams = props.model.parameters || [];
    newParams.splice(idx, 1);

    props.handleModelChanged({ ...props.model, parameters: newParams });
  };

  const addParameter = () => {
    const newParams = props.model.parameters || [];
    newParams.push({ name: '', value: '' });

    props.handleModelChanged({ ...props.model, parameters: newParams });
  };

  // If the text field is blank, record an error.
  const validateNonBlank = (e: EventTarget & (HTMLInputElement | HTMLTextAreaElement)) => {
    const inputName = e.name;
    const inputValue = e.value;

    if (inputValue === '') { // blank
      setErrors({ ...errors, [inputName]: trans.__('You must provide a value.') })
    }
    else {
      setErrors({ ...errors, [inputName]: '' });
    }
  };

  // Is there a truthy (non-empty) error for this field?
  const hasError = (inputName: string) => {
    return !!errors[inputName];
  };

  const api = new SchedulerService({});
  const environmentsPromise: () => Promise<Scheduler.IRuntimeEnvironment[]> = async () => {
    const environmentsCache = sessionStorage.getItem('environments');
    if (environmentsCache !== null) {
      return JSON.parse(environmentsCache);
    }

    return api.getRuntimeEnvironments().then(envs => {
      sessionStorage.setItem('environments', JSON.stringify(envs));
      return envs;
    });
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
            value={textInputs['jobName'] ?? props.model.jobName}
            id={`${formPrefix}jobName`}
            name='jobName'
          />
          <TextField
            label={trans.__('Input file')}
            variant="outlined"
            onChange={handleInputChange}
            value={textInputs['inputFile'] ?? props.model.inputFile}
            id={`${formPrefix}inputFile`}
            onBlur={(e) => validateNonBlank(e.target)}
            error={hasError('inputFile')}
            helperText={errors['inputFile'] ?? ''}
            name='inputFile'
          />
          <TextField
            label={trans.__('Output path')}
            variant="outlined"
            onChange={handleInputChange}
            value={textInputs['outputPath'] ?? props.model.outputPath}
            id={`${formPrefix}outputPath`}
            name='outputPath'
          />
          <EnvironmentPicker
            label={trans.__('Environment')}
            name={'environment'}
            id={`${formPrefix}environment`}
            onChange={handleSelectChange}
            environmentsPromise={environmentsPromise()}
            initialValue={props.model.environment}
          />
          <OutputFormatPicker
            label={trans.__('Output formats')}
            name='outputFormat'
            id={`${formPrefix}outputFormat`}
            onChange={handleOutputFormatsChange}
            environment={props.model.environment}
            value={props.model.outputFormats || []}
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
          />
          <props.advancedOptions
            jobsView={'CreateJob'}
            model={props.model}
            handleModelChanged={props.handleModelChanged}
            errors={errors}
            handleErrorsChanged={setErrors} />
          <Cluster gap={3} justifyContent="flex-end">
            <Button variant="outlined" onClick={props.toggleView}>
              {trans.__('Cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={(e: React.MouseEvent) => {
                submitCreateJobRequest(e);
                return false;
              }}
              disabled={anyErrors}
              title={anyErrors ? cantSubmit : trans.__('Run this job now')}
            >
              {trans.__('Run Job')}
            </Button>
          </Cluster>
        </Stack>
      </form>
    </Box>
  );
}
