import React, { useCallback, useState, FC } from 'react';
import { Stack } from '@mui/system';
import ReactFlow, { Background, BackgroundVariant } from 'reactflow';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import { useTranslator, useWorkflows } from '../hooks';
import { Scheduler } from '../handler';
import { CreateWorkflow } from './create-workflow';
import { emptyCreateJobDefinitionModel } from '../model';
import { StyledAlert, StyledDrawer } from '../components/styled/drawer';

export const CreateWorkflowView: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trans = useTranslator('jupyterlab');

  const { api } = useWorkflows();
  const [displayError, setDisplayError] = useState('');
  const [jobData, setJobData] = useState<any>({
    ...emptyCreateJobDefinitionModel(),
    tasks: location?.state?.task ? [location?.state?.task] : []
  });

  const handleCreateJobDefinition = useCallback(
    (jobDefinition: Scheduler.IJobDefinition) => {
      return api
        .createJobDefinition(jobDefinition)
        .then(data =>
          navigate(`/job-definitions/${data.job_definition_id}`, {
            state: null // clear the state so the create workflows won't showup again when the app is restored
          })
        )
        .catch(error => setDisplayError(error.message));
    },
    [navigate]
  );

  const ErrorBanner = (
    <StyledAlert severity="error" onClose={() => setDisplayError('')}>
      {displayError || 'Unknown error.'}
    </StyledAlert>
  );

  return (
    <>
      {displayError ? ErrorBanner : null}
      <Typography variant="h6" color="text.primary" p={3}>
        {trans.__('Untitled')}
      </Typography>
      <ReactFlow>
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
      <Stack
        direction="row"
        justifyContent="center"
        sx={{
          top: 0,
          left: '50%',
          height: '100%',
          position: 'absolute',
          transform: 'translateX(-50%)'
        }}
      >
        <Box width={450}>
          <StyledDrawer
            open
            anchor="bottom"
            variant="persistent"
            PaperProps={{ style: { transitionDelay: '500ms' } }}
          >
            <CreateWorkflow
              model={jobData}
              handleModelChange={setJobData}
              onCreateJob={handleCreateJobDefinition}
              onCancel={() => navigate('/job-definitions')}
            />
          </StyledDrawer>
        </Box>
      </Stack>
    </>
  );
};
