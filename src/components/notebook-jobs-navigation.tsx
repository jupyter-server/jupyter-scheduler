import React from 'react';

import { CreateJobFormState } from '../create-job-form';
import { Signal } from '@lumino/signaling';
import { NotebookJobsNavigationTabList } from './notebook-jobs-navigation-tab-list';
import { JobsPanelView } from '../notebook-jobs-panel';

export function NotebookJobsNavigation(props: {
  currentView: JobsPanelView;
  toggleSignal: Signal<any, CreateJobFormState>;
  toggleFunction: () => void;
}) {
  const views: JobsPanelView[] = ['JobsList', 'CreateJobForm'];

  const setView = (event: React.MouseEvent, view: JobsPanelView): void => {
    if (view === 'JobsList') {
      let initialState: CreateJobFormState = {
        inputFile: '',
        jobName: '',
        outputPath: '',
        environment: '',
        parameters: undefined
      };

      props.toggleSignal.emit(initialState);
    }

    props.toggleFunction();
  };

  return (
    <NotebookJobsNavigationTabList
      onTabClick={setView}
      views={views}
      currentView={props.currentView}
    />
  );
}
