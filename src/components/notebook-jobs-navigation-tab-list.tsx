import React from 'react';

import { useTranslator } from '../hooks';
import { JobsPanelView } from '../notebook-jobs-panel';

import { NotebookJobsNavigationTab, tabClickProps } from './notebook-jobs-navigation-tab';

export function NotebookJobsNavigationTabList(props: {
  onTabClick: tabClickProps,
  views: JobsPanelView[],
  currentView: JobsPanelView
}) {

  const trans = useTranslator('jupyterlab');

  const viewToTitle: { [key in JobsPanelView]: string } = {
    'JobsList': trans.__('Jobs List'),
    'CreateJobForm': trans.__('Create Job')
  };

  return (
    <ul className='jp-notebook-job-navigation'>
      {props.views.map(view => <NotebookJobsNavigationTab
        key={view}
        id={view}
        onClick={event => props.onTabClick(event, view)}
        title={viewToTitle[view]}
        active={view === props.currentView} />
      )}
    </ul>
  )
};
