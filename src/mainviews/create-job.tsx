import React, { ChangeEvent } from 'react';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';
import { OutputFormatPicker, outputFormatsForEnvironment } from '../components/output-format-picker';
import { parameterNameMatch, ParametersPicker, parameterValueMatch } from '../components/parameters-picker';
import { Scheduler, SchedulerService } from '../handler';
import { useTranslator } from '../hooks';
import { ICreateJobModel, IOutputFormat } from '../model';

import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Stack from '@mui/system/Stack';
import TextField from '@mui/material/TextField';
import { EnvironmentPicker } from '../components/environment-picker';
import { SelectChangeEvent } from '@mui/material';

export type CreateJobFormProps = {
  initialState: CreateJobFormState;
  cancelClick: () => void;
  // Function to run after a create job request completes successfully
  postCreateJob: () => void;
  // Extension point: optional additional component
  customEnvironment?: React.ElementType;
};

export interface ICreateJobProps {
  model: ICreateJobModel;
  modelChanged: (model: ICreateJobModel) => void;
  toggleView: () => unknown;
}

export function CreateJob(props: ICreateJobProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  // Cache text inputs so that React can update their state immediately, preventing
  // a situation where the cursor jumps to the end of the text box after the user
  // enters a character mid-input.
  const [textInputs, setTextInputs] = React.useState<Record<string, string>>({});

  const handleInputChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;

    const parameterNameIdx = parameterNameMatch(target.name);
    const parameterValueIdx = parameterValueMatch(target.name);
    const newParams = props.model.parameters || [];

    if (parameterNameIdx !== null) {
      newParams[parameterNameIdx].name = target.value;
      props.modelChanged({ ...props.model, parameters: newParams });
    } else if (parameterValueIdx !== null) {
      newParams[parameterValueIdx].value = target.value;
      props.modelChanged({ ...props.model, parameters: newParams });
    } else {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      if (typeof value === 'string') {
        setTextInputs({ ...textInputs, [name]: value });
      }
      props.modelChanged({ ...props.model, [name]: value });
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const target = event.target as HTMLInputElement;

    props.modelChanged({ ...props.model, [target.name]: target.value });
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
        props.modelChanged({
          ...props.model,
          outputFormats: [...oldOutputFormats, newFormat]
        });
      }
    }
    // Go from checked to unchecked
    else if (!isChecked && wasChecked) {
      props.modelChanged({
        ...props.model,
        outputFormats: oldOutputFormats.filter(of => of.name !== formatName)
      });
    }

    // If no change in checkedness, don't do anything
  };

  const submitCreateJobRequest = async (event: React.MouseEvent) => {
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

    props.modelChanged({ ...props.model, parameters: newParams });
  };

  const addParameter = () => {
    const newParams = props.model.parameters || [];
    newParams.push({ name: '', value: '' });

    props.modelChanged({ ...props.model, parameters: newParams });
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
            >
              {trans.__('Run Job')}
            </Button>
          </Cluster>
        </Stack>
      </form>
    </Box>
  );
}
