import React from 'react';

import { useTranslator } from '../hooks';
import { JobsView } from '../model';

import {
  NotebookJobsNavigationTab,
  tabClickProps
} from './notebook-jobs-navigation-tab';

export function NotebookJobsNavigationTabList(props: {
  onTabClick: tabClickProps;
  views: JobsView[];
  currentView: JobsView;
}): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const viewToTitle: { [key in JobsView]: string } = {
    ListJobs: trans.__('Jobs List'),
    CreateJob: trans.__('Create Job'),
    JobDetail: trans.__('Job Details')
  };

  return (
    <ul className="jp-notebook-job-navigation">
      {props.views.map(view => (
        <NotebookJobsNavigationTab
          key={view}
          id={view}
          onClick={event => props.onTabClick(event, view)}
          title={viewToTitle[view]}
          active={view === props.currentView}
        />
      ))}
    </ul>
  );
}
