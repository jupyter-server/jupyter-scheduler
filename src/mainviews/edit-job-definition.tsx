import React, { useState, useMemo } from 'react';
import {
  Button,
  Box,
  Breadcrumbs,
  Stack,
  Link,
  Typography,
  InputLabel,
  CircularProgress
} from '@mui/material';

import { Heading } from '../components/heading';
import { Cluster } from '../components/cluster';
import { ScheduleInputs } from '../components/schedule-inputs';
import { IUpdateJobDefinitionModel, JobsView } from '../model';
import { useTranslator } from '../hooks';
import { SchedulerService } from '../handler';
import { Scheduler } from '../tokens';

export type EditJobDefinitionProps = {
  model: IUpdateJobDefinitionModel;
  handleModelChange: (model: IUpdateJobDefinitionModel) => void;
  showListView: (view: JobsView.ListJobDefinitions) => void;
  showJobDefinitionDetail: (jobDefId: string) => void;
};

function EditJobDefinitionBody(props: EditJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const ss = useMemo(() => new SchedulerService({}), []);
  const [loading, setLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Scheduler.ErrorsType>({});
  const hasErrors = Object.keys(fieldErrors).some(key => !!fieldErrors[key]);

  const handleSubmit = async () => {
    if (hasErrors) {
      return;
    }

    setLoading(true);
    try {
      await ss.updateJobDefinition(props.model.definitionId, {
        schedule: props.model.schedule,
        timezone: props.model.timezone
      });
      props.showJobDefinitionDetail(props.model.definitionId);
    } catch (e) {
      // TODO: catch any errors from backend and display them to user.
      setLoading(false);
    }
  };

  return (
    <Stack spacing={4} maxWidth={500}>
      <InputLabel>{trans.__('Schedule')}</InputLabel>
      <ScheduleInputs
        idPrefix=""
        model={props.model}
        handleModelChange={props.handleModelChange}
        errors={fieldErrors}
        handleErrorsChange={newErrors => setFieldErrors(newErrors)}
      />
      <Cluster gap={3} justifyContent="flex-end">
        {loading ? (
          <>
            {trans.__('Saving changes...')}
            <CircularProgress size={30} />
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() =>
                props.showJobDefinitionDetail(props.model.definitionId)
              }
            >
              {trans.__('Cancel')}
            </Button>
            <Button
              color="primary"
              variant="contained"
              onClick={handleSubmit}
              disabled={hasErrors}
            >
              {trans.__('Save changes')}
            </Button>
          </>
        )}
      </Cluster>
    </Stack>
  );
}

export function EditJobDefinition(props: EditJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            onClick={(): void => {
              props.showListView(JobsView.ListJobDefinitions);
            }}
          >
            {trans.__('Job Definitions')}
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={(): void => {
              props.showJobDefinitionDetail(props.model.definitionId);
            }}
          >
            {props.model.name}
          </Link>
          <Typography color="text.primary">{trans.__('Edit')}</Typography>
        </Breadcrumbs>
        <Heading level={1}>{trans.__('Edit Job Definition')}</Heading>
        <EditJobDefinitionBody {...props} />
      </Stack>
    </Box>
  );
}
