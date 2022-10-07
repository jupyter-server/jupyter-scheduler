import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { Scheduler } from '../handler';

export function buildJobDefinitionRow(
  jobDef: Scheduler.IDescribeJobDefinition,
  app: JupyterFrontEnd,
  openJobDefinitionDetail: (jobDefId: string) => unknown
) {
  const cellContents: React.ReactNode[] = [
    // name
    <a onClick={() => openJobDefinitionDetail(jobDef.job_definition_id)}>
      {jobDef.name}
    </a>
  ];

  return (
    <TableRow>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={idx}>{cellContent}</TableCell>
      ))}
    </TableRow>
  );
}
