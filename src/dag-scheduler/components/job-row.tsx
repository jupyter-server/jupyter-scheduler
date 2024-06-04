import React from 'react';
import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';
import { Link, TableCell, TableRow } from '@mui/material';
import { ExternalLinks } from './external-links';
import { JobStatusBadge } from './status-badge';

function Timestamp(props: { job: Scheduler.IDescribeJob }): JSX.Element | null {
  const create_date: Date | null = props.job.create_time
    ? new Date(props.job.create_time)
    : null;

  const create_display_date: string | null = create_date
    ? create_date.toLocaleString()
    : null;

  return <>{create_display_date}</>;
}

export function buildJobRow(
  model: Scheduler.IDescribeJob,
  translateStatus: (status: Scheduler.Status) => string,
  showDetailView: (jobId: string) => void
): JSX.Element {
  const trans = useTranslator('jupyterlab');
  // TODO: Fix the typings
  const job = model as any;

  const cellContents: React.ReactNode[] = [
    <Link
      underline="hover"
      onClick={() => showDetailView(job.job_id)}
      title={trans.__('Open detail view for "%1"', job.name)}
      style={{ minWidth: '150px', maxWidth: '250px' }}
    >
      {job.runId || 'Unknow run'}
    </Link>,
    <span title={job.runId} className="jp-cell-truncate">
      {job.job_id}
    </span>,
    <JobStatusBadge status={job.status} />,
    <Timestamp job={job} />,
    <ExternalLinks label="External Links" options={job.externalLinks || []} />
  ];

  return (
    <TableRow key={job.job_id} sx={{ cursor: 'pointer' }} hover>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={`${job.job_id}-${idx}`}>{cellContent}</TableCell>
      ))}
    </TableRow>
  );
}
