import { Button } from '@jupyterlab/ui-components';
import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  ICreateJobFormEnvironmentField,
  ICreateJobFormField,
  CreateJobFormInputs,
  ICreateJobFormOutputFormatsField,
  ICreateJobFormParametersField
} from './components/create-job-form-inputs';

import {
  OutputFormatOption,
  outputFormatsForEnvironment
} from './components/output-format-picker';

import { Scheduler, SchedulerService } from './handler';
import { useTranslator } from './hooks';

export type CreateJobFormProps = {
  initialState: CreateJobFormState;
  cancelClick: () => void;
  // Function to run after a create job request completes successfully
  postCreateJob: () => void;
};

export type JobParameter = {
  name: string;
  value: string;
};

// This type is based on ICreateJobInputModel, but parameters is ordered
// for use in the form's display.
export type CreateJobFormState = {
  jobName: string;
  inputFile: string;
  outputPath: string;
  environment: string;
  parameters?: JobParameter[];
  outputFormats?: OutputFormatOption[];
};

export function CreateJobForm(props: CreateJobFormProps) {
  const trans = useTranslator('jupyterlab');

  const [state, setState] = useState<CreateJobFormState>({
    jobName: '',
    inputFile: '',
    outputPath: '',
    environment: '',
    parameters: [],
    outputFormats: []
  });

  useEffect(() => {
    if (props.initialState) {
      setState(prevState => ({ ...props.initialState }));
    }
  }, [props.initialState]);

  const handleInputChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;

    const parameterNameMatch = target.name.match(/^parameter-(\d+)-name$/);
    const parameterValueMatch = target.name.match(/^parameter-(\d+)-value$/);
    if (parameterNameMatch !== null) {
      const idx = parseInt(parameterNameMatch[1]);
      // Update the parameters
      const newParams = state.parameters || [];
      newParams[idx].name = target.value;
      setState({ ...state, parameters: newParams });
    } else if (parameterValueMatch !== null) {
      const idx = parseInt(parameterValueMatch[1]);
      // Update the parameters
      const newParams = state.parameters || [];
      newParams[idx].value = target.value;
      setState(prevState => ({ ...prevState, parameters: newParams }));
    } else {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      setState(prevState => ({ ...prevState, [name]: value }));
    }
  };

  const handleOutputFormatsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const outputFormatsList = outputFormatsForEnvironment(state.environment);
    if (outputFormatsList === null) {
      return; // No data about output formats; give up
    }

    const formatName = event.target.value;
    const isChecked = event.target.checked;

    const wasChecked: boolean = state.outputFormats
      ? state.outputFormats.some(of => of.name === formatName)
      : false;

    const oldOutputFormats: OutputFormatOption[] = state.outputFormats || [];

    // Go from unchecked to checked
    if (isChecked && !wasChecked) {
      // Get the output format matching the given name
      const newFormat = outputFormatsList.find(of => of.name === formatName);
      if (newFormat) {
        setState({ ...state, outputFormats: [...oldOutputFormats, newFormat] });
      }
    }
    // Go from checked to unchecked
    else if (!isChecked && wasChecked) {
      setState({
        ...state,
        outputFormats: oldOutputFormats.filter(of => of.name !== formatName)
      });
    }

    // If no change in checkedness, don't do anything
  };

  const submitCreateJobRequest = async (event: React.MouseEvent) => {
    const api = new SchedulerService({});

    // Serialize parameters as an object.
    const jobOptions: Scheduler.ICreateJob = {
      name: state.jobName,
      input_uri: state.inputFile,
      output_prefix: state.outputPath,
      runtime_environment_name: state.environment
    };

    if (state.parameters !== undefined) {
      const jobParameters: { [key: string]: any } = {};

      state.parameters.forEach(param => {
        const { name, value } = param;
        if (jobParameters.hasOwnProperty(name)) {
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

    if (state.outputFormats !== undefined) {
      jobOptions.output_formats = state.outputFormats.map(entry => entry.name);
    }

    api.createJob(jobOptions).then(response => {
      props.postCreateJob();
    });
  };

  const removeParameter = (idx: number) => {
    const newParams = state.parameters || [];
    newParams.splice(idx, 1);

    setState({ ...state, parameters: newParams });
  };

  const addParameter = () => {
    const newParams = state.parameters || [];
    newParams.push({ name: '', value: '' });

    setState({ ...state, parameters: newParams });
  };

  const api = new SchedulerService({});
  const environmentsPromise = async () => {
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
  const formRow = `${formPrefix}row`;
  const formLabel = `${formPrefix}label`;
  const formInput = `${formPrefix}input`;

  const formFields: ICreateJobFormField[] = [
    {
      label: trans.__('Job name'),
      inputName: 'jobName',
      inputType: 'text',
      value: state.jobName,
      onChange: handleInputChange
    },
    {
      label: trans.__('Input file'),
      inputName: 'inputFile',
      inputType: 'text',
      value: state.inputFile,
      onChange: handleInputChange
    },
    {
      label: trans.__('Output prefix'),
      inputName: 'outputPath',
      inputType: 'text',
      value: state.outputPath,
      onChange: handleInputChange
    },
    {
      label: trans.__('Environment'),
      inputName: 'environment',
      inputType: 'environment',
      value: state.environment,
      environmentsPromise: environmentsPromise,
      onChange: handleInputChange
    } as ICreateJobFormEnvironmentField,
    {
      label: trans.__('Output formats'),
      inputName: 'outputFormat',
      inputType: 'outputFormats',
      value: state.outputFormats || [],
      environment: state.environment,
      onChange: handleOutputFormatsChange
    } as ICreateJobFormOutputFormatsField,
    {
      label: trans.__('Parameters'),
      inputName: 'parameters',
      inputType: 'parameters',
      value: state.parameters || [],
      onChange: handleInputChange,
      addParameter: addParameter,
      removeParameter: removeParameter
    } as ICreateJobFormParametersField
  ];

  return (
    <div className={`${formPrefix}form-container`}>
      <form className={`${formPrefix}form`} onSubmit={e => e.preventDefault()}>
        <CreateJobFormInputs
          formRow={formRow}
          formLabel={formLabel}
          formPrefix={formPrefix}
          formInput={formInput}
          fields={formFields}
        />
        <div className={formRow}>
          <div className={formLabel}>&nbsp;</div>
          <div className={`${formInput} ${formPrefix}submit-container`}>
            <Button
              type="button"
              className="jp-Dialog-button jp-mod-styled"
              onClick={props.cancelClick}
            >
              {trans.__('Cancel')}
            </Button>
            <Button
              type="submit"
              className="jp-Dialog-button jp-mod-accept jp-mod-styled"
              onClick={(e: React.MouseEvent) => {
                submitCreateJobRequest(e);
                return false;
              }}
            >
              {trans.__('Run Job')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
