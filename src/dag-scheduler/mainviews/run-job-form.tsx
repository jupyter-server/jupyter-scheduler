import React, { memo, useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import { Stack } from '@mui/system';

import { Workflows as SchedulerTokens } from '../tokens';
import { ParametersPicker } from '../components/parameters-picker';
import { useTranslator, useWorkflowStore } from '../hooks';
import { IJobParameter, convertParameters } from '../model';

export interface ICreateJobFromDefinitionProps {
  onClose: () => void;
  jobDefinitionId: string;
  onSubmit: (data: any) => Promise<void>;
}

export const RunJobForm = memo(
  (props: ICreateJobFromDefinitionProps): JSX.Element => {
    const trans = useTranslator('jupyterlab');
    const useStore = useWorkflowStore();
    const currentJob = useStore(state => state.currentJob);
    const [parameters, setParameters] = useState<IJobParameter[]>(() =>
      convertParameters(currentJob?.notebookParameters || {})
    );

    // A mapping from input names to error messages.
    // If an error message is "truthy" (i.e., not null or ''), we should display the
    // input in an error state and block form submission.
    const [errors, setErrors] = useState<SchedulerTokens.ErrorsType>({});

    // Advanced options are not editable; do not block submission on them
    const anyErrors = Object.keys(errors).some(key => !!errors[key]);

    const handleParametersChange = useCallback((value: IJobParameter[]) => {
      setParameters(value =>
        value.map((v, index) => ({
          ...v,
          ...value[index]
        }))
      );
    }, []);

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

    const handleSubmit = async (event: React.MouseEvent) => {
      if (anyErrors) {
        console.error(
          'User attempted to submit a submitCreateJobRequest request; button should have been disabled'
        );
        return;
      }

      if (!props.jobDefinitionId) {
        console.error(
          'User did not provide a Workflow ID to submitCreateJobRequest request'
        );
        return;
      }

      const createJobFromDefinitionModel: any = {};

      createJobFromDefinitionModel.parameters = serializeParameters(parameters);

      return props.onSubmit(createJobFromDefinitionModel);
    };

    return (
      <Dialog open fullWidth maxWidth="sm" onClose={props.onClose}>
        <DialogTitle>{trans.__('Run Now')}</DialogTitle>
        <DialogContent>
          <Stack spacing={4}>
            <Typography variant="body1">
              This action will run the workflow - {currentJob?.name}
            </Typography>
            <ParametersPicker
              errors={errors}
              value={parameters}
              name={'parameters'}
              label={trans.__('Parameters')}
              id={'parameters'}
              handleErrorsChange={setErrors}
              onChange={handleParametersChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={props.onClose}>{trans.__('Cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {trans.__('Submit')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);
