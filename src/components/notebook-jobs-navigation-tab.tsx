import React from 'react';

import { JobsPanelView } from '../notebook-jobs-panel';

export interface tabClickProps {
  (event: React.MouseEvent<HTMLElement, MouseEvent>, view: JobsPanelView) : void,
}

export function NotebookJobsNavigationTab(props: {
  onClick: tabClickProps,
  id: JobsPanelView,
  title: string,
  active: boolean
}) {

  return (
    <li
      id={props.id}
      className={'jp-notebook-job-navigation-tab' + (props.active ? ' active' : '')}
      onClick={props.active ? () => { } : e => props.onClick(e, props.id)}>
      {props.title}
    </li>
  )
};
