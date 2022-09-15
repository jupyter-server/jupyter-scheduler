import React from 'react';

import { UseSignal } from '@jupyterlab/apputils';
import { GroupItem, interactiveItem, TextItem } from '@jupyterlab/statusbar';

import { calendarMonthIcon } from './icons';

import { useTranslator } from '../hooks';
import { NotebookJobsListingModel } from '../model';

import { LabIcon } from '@jupyterlab/ui-components';

export type RunningJobsIndicatorComponentProps = {
  /**
   * A click handler for the component. By default this is used
   * to activate the scheduled jobs side panel.
   */
  handleClick: () => void;

  runningJobs: number | undefined;
};

export function RunningJobsIndicatorComponent(
  props: RunningJobsIndicatorComponentProps
): JSX.Element | null {
  const runningJobs = props.runningJobs;

  // Don't display a status bar indicator if there are no running jobs (0 or undefined).
  if (!runningJobs) {
    return null;
  }

  const trans = useTranslator('jupyterlab');

  const itemTitle =
    runningJobs > 1
      ? trans.__('%1 jobs running', runningJobs)
      : trans.__('%1 job running', runningJobs);

  return (
    <div
      className={interactiveItem}
      style={{ paddingLeft: '4px', paddingRight: '4px' }}
    >
      <GroupItem spacing={4} title={itemTitle} onClick={props.handleClick}>
        <TextItem source={`${runningJobs}`} />
        <LabIcon.resolveReact icon={calendarMonthIcon} tag="span" />
      </GroupItem>
    </div>
  );
}

export type RunningJobsIndicatorProps = {
  /**
   * A click handler for the item. By default this is used
   * to activate the scheduled jobs side panel.
   */
  onClick: () => void;

  /**
   * The model representing a listing of scheduled jobs.
   */
  model: NotebookJobsListingModel;
};

export function RunningJobsIndicator(
  props: RunningJobsIndicatorProps
): JSX.Element {
  return (
    <UseSignal signal={props.model.inProgressJobCountChanged}>
      {(_, newCount) => (
        <RunningJobsIndicatorComponent
          handleClick={props.onClick}
          runningJobs={newCount}
        />
      )}
    </UseSignal>
  );
}
