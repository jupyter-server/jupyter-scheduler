import 'reactflow/dist/base.css';
import React, { FC, useState } from 'react';
import {
  RouterProvider,
  createMemoryRouter,
  Route,
  createRoutesFromElements,
  Navigate,
  Outlet
} from 'react-router-dom';

import { JobDefinitionsList } from './job-definitions-list';
import TaskView from './task-view';
import { JobsView } from '../model';
import JobsRunView from './run-view';
import JobRunsList from './job-runs-list';
import { Scheduler } from '../handler';
import { ErrorBoundary } from '../components/error-boundary';
import { useTranslator } from '../hooks';
import { Breadcrumbs } from '../components/breadcrumbs';
import { Stack, useTheme } from '@mui/material';
import { CreateWorkflowView } from './create-workflow-view';

type IProps = {
  onRefresh: VoidFunction;
};

const ErrorBoundaryLayout: FC<IProps> = ({ onRefresh }) => {
  const trans = useTranslator('jupyterlab');
  const theme = useTheme();

  return (
    <ErrorBoundary
      alertTitle={trans.__('Internal error')}
      alertMessage={trans.__(
        'We encountered an internal error. Please try your command again.'
      )}
      detailTitle={trans.__('Error details')}
      onClose={onRefresh}
    >
      <Stack
        sx={{ height: '100%' }}
        className={`notebook-workflows ${theme.palette.mode}`}
      >
        <Breadcrumbs />
        <Outlet />
      </Stack>
    </ErrorBoundary>
  );
};

export const NotebookWorkflows: FC<{
  view?: JobsView;
  model: Scheduler.ITask;
}> = ({ view, model }) => {
  // Having this in state enables us to show list view instead of create screen when we catch any error
  const [currentView, setCurrentView] = useState(view);
  // This is to forceUpdate the component on Refresh from Error screen
  const [state, updateState] = React.useState(Date.now());
  const forceUpdate = React.useCallback(() => {
    updateState(Date.now());
    setCurrentView(JobsView.ListJobDefinitions);
  }, []);

  if (currentView === JobsView.CreateForm && !model.input_uri) {
    return null;
  }

  const routes = (
    <>
      <Route element={<ErrorBoundaryLayout onRefresh={forceUpdate} />}>
        <Route index path="/job-definitions" element={<JobDefinitionsList />} />
        <Route path="/job-definitions/new" element={<CreateWorkflowView />} />
        <Route path="/job-definitions/:jobId" element={<TaskView />} />
        <Route path="/job-definitions/:jobId/runs" element={<JobRunsList />} />
        <Route
          path="/job-definitions/:jobId/runs/:runId"
          element={<JobsRunView />}
        />
        <Route
          path="*"
          element={
            <Navigate
              state={{ task: model }}
              to={
                currentView === JobsView.CreateForm
                  ? '/job-definitions/new'
                  : '/job-definitions'
              }
            />
          }
        />
      </Route>
    </>
  );

  const router = createMemoryRouter(createRoutesFromElements(routes), {});

  return <RouterProvider key={state} router={router} />;
};
