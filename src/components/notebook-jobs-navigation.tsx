import React from 'react';

import { Signal } from '@lumino/signaling';
import { NotebookJobsNavigationTabList } from './notebook-jobs-navigation-tab-list';
import { ICreateJobModel, JobsView } from '../model';

export function NotebookJobsNavigation(props: {
  currentView: JobsView;
  toggleSignal: Signal<any, ICreateJobModel>;
  toggleFunction: () => void;
}): JSX.Element {
  const views: JobsView[] = ['ListJobs', 'CreateJob'];

  const setView = (event: React.MouseEvent, view: JobsView): void => {
    if (view === 'ListJobs') {
      const initialState: ICreateJobModel = {
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
