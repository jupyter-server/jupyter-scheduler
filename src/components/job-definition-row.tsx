import React from 'react';

import cronstrue from 'cronstrue';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { Scheduler } from '../handler';

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

export function buildJobDefinitionRow(
  jobDef: Scheduler.IDescribeJobDefinition,
  app: JupyterFrontEnd,
  openJobDefinitionDetail: (jobDefId: string) => unknown
): JSX.Element {
  const cellContents: React.ReactNode[] = [
    // name
    <a onClick={() => openJobDefinitionDetail(jobDef.job_definition_id)}>
      {jobDef.name}
    </a>,
    PathExt.basename(jobDef.input_uri),
    <CreatedAt job={jobDef} />,
    <ScheduleSummary schedule={jobDef.schedule} />
  ];

  return (
    <TableRow>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={idx}>{cellContent}</TableCell>
      ))}
    </TableRow>
  );
}
