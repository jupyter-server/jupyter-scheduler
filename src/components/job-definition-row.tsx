import React from 'react';

import cronstrue from 'cronstrue';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';

import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { IconButton } from '@mui/material';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { Scheduler, SchedulerService } from '../handler';
import { useTranslator } from '../hooks';
import { TranslationBundle } from '@jupyterlab/translation';
import { ConfirmDeleteIcon } from './confirm-icons';

function CreatedAt(props: {
  job: Scheduler.IDescribeJobDefinition;
}): JSX.Element | null {
  const create_date: Date | null = props.job.create_time
    ? new Date(props.job.create_time)
    : null;
  const create_display_date: string | null = create_date
    ? create_date.toLocaleString()
    : null;

  return <>{create_display_date}</>;
}

function ScheduleSummary(props: {
  schedule: string | undefined;
}): JSX.Element | null {
  if (props.schedule === undefined) {
    return null;
  }

  return <>{cronstrue.toString(props.schedule)}</>;
}

function PauseButton(props: {
  jobDef: Scheduler.IDescribeJobDefinition;
  clickHandler: () => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  if (!props.jobDef.active) {
    return null;
  }

  const buttonTitle = props.jobDef.name
    ? trans.__('Pause "%1"', props.jobDef.name)
    : trans.__('Pause job definition');

  return (
    <IconButton onClick={props.clickHandler} title={buttonTitle}>
      <PauseIcon fontSize="small" />
    </IconButton>
  );
}

function ResumeButton(props: {
  jobDef: Scheduler.IDescribeJobDefinition;
  clickHandler: () => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  if (props.jobDef.active) {
    return null;
  }

  const buttonTitle = props.jobDef.name
    ? trans.__('Resume "%1"', props.jobDef.name)
    : trans.__('Resume job definition');

  return (
    <IconButton onClick={props.clickHandler} title={buttonTitle}>
      <PlayArrowIcon fontSize="small" />
    </IconButton>
  );
}

export function buildJobDefinitionRow(
  jobDef: Scheduler.IDescribeJobDefinition,
  app: JupyterFrontEnd,
  openJobDefinitionDetail: (jobDefId: string) => unknown,
  deleteRow: (
    id: Scheduler.IDescribeJobDefinition['job_definition_id']
  ) => void,
  forceReload: () => void,
  trans: TranslationBundle,
  ss: SchedulerService
): JSX.Element {
  const cellContents: React.ReactNode[] = [
    // name
    <a onClick={() => openJobDefinitionDetail(jobDef.job_definition_id)}>
      {jobDef.name}
    </a>,
    PathExt.basename(jobDef.input_filename),
    <CreatedAt job={jobDef} />,
    <ScheduleSummary schedule={jobDef.schedule} />,
    jobDef.active ? trans.__('Active') : trans.__('Paused'),
    <Stack spacing={1} direction="row">
      <PauseButton
        jobDef={jobDef}
        clickHandler={async () => {
          await ss.pauseJobDefinition(jobDef.job_definition_id);
          forceReload();
        }}
      />
      <ResumeButton
        jobDef={jobDef}
        clickHandler={async () => {
          await ss.resumeJobDefinition(jobDef.job_definition_id);
          forceReload();
        }}
      />
      <ConfirmDeleteIcon
        name={jobDef.name}
        clickHandler={async () => {
          await ss.deleteJobDefinition(jobDef.job_definition_id);

          deleteRow(jobDef.job_definition_id);
        }}
      />
    </Stack>
  ];

  return (
    <TableRow key={jobDef.job_definition_id}>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={`${jobDef.job_definition_id}-${idx}`}>
          {cellContent}
        </TableCell>
      ))}
    </TableRow>
  );
}
