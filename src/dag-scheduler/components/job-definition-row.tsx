import React, { useState } from 'react';

import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { CircularProgress, IconButton, Link } from '@mui/material';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { Scheduler } from '../handler';
import { useWorkflows, useTranslator } from '../hooks';
import { ConfirmDeleteButton } from './confirm-buttons';
import { ExternalLinks } from './external-links';
import { DeploymentStatus } from '../contants';
import { ScheduleSummary } from './schedule-summary';
import { WorkflowStatusBadge } from './status-badge';

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

// TODO: Refactor Pause/Resume buttons to remove duplicates
function PauseButton(props: {
  jobDef: Scheduler.IDescribeJobDefinition;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const { api } = useWorkflows();
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);

    api
      .pauseJobDefinition(props.jobDef.job_definition_id)
      .then(() => {
        setLoading(false);
        props.onSuccess();
      })
      .catch(e => {
        setLoading(false);
        props.onFailure(e.message);
      });
  };

  if (!props.jobDef.active) {
    return null;
  }

  const buttonTitle = props.jobDef.name
    ? trans.__('Pause "%1"', props.jobDef.name)
    : trans.__('Pause workflow');

  const isJobDeployed = props.jobDef.status === DeploymentStatus.DEPLOYED;

  return (
    <IconButton
      disabled={loading || !isJobDeployed}
      onClick={handleClick}
      title={buttonTitle}
    >
      {loading ? (
        <CircularProgress size="17px" />
      ) : (
        <PauseIcon fontSize="small" />
      )}
    </IconButton>
  );
}

function ResumeButton(props: {
  jobDef: Scheduler.IDescribeJobDefinition;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const { api } = useWorkflows();
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);

    api
      .resumeJobDefinition(props.jobDef.job_definition_id)
      .then(() => {
        setLoading(false);
        props.onSuccess();
      })
      .catch(e => {
        setLoading(false);
        props.onFailure(e.message);
      });
  };

  if (props.jobDef.active) {
    return null;
  }

  const buttonTitle = props.jobDef.name
    ? trans.__('Resume "%1"', props.jobDef.name)
    : trans.__('Resume workflow');

  return (
    <IconButton disabled={loading} onClick={handleClick} title={buttonTitle}>
      {loading ? (
        <CircularProgress size="17px" />
      ) : (
        <PlayArrowIcon fontSize="small" />
      )}
    </IconButton>
  );
}

export function buildJobDefinitionRow(
  jobDef: Scheduler.IDescribeJobDefinition,
  openJobDefinitionDetail: (jobDefId: string) => unknown,
  onDelete: (id: string) => Promise<void>,
  onSuccess: () => void,
  onFailure: (error: string) => void
): JSX.Element {
  const cellContents: React.ReactNode[] = [
    // name
    <Link
      onClick={() => openJobDefinitionDetail(jobDef.job_definition_id)}
      title={`Open detail view for "${jobDef.name}"`}
      underline="hover"
      style={{ minWidth: '150px', maxWidth: '250px' }}
      className="jp-cell-truncate"
    >
      {jobDef.name}
    </Link>,
    <span title={jobDef.job_definition_id} className="jp-cell-truncate">
      {jobDef.job_definition_id}
    </span>,
    <WorkflowStatusBadge status={jobDef.status} />,
    <CreatedAt job={jobDef} />,
    <ScheduleSummary schedule={jobDef.schedule} />,
    <ExternalLinks
      label="External Links"
      options={jobDef.externalLinks || []}
    />,
    <Stack spacing={1} direction="row">
      <PauseButton
        jobDef={jobDef}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
      <ResumeButton
        jobDef={jobDef}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
      <ConfirmDeleteButton
        name={jobDef.name}
        clickHandler={() => onDelete(jobDef.job_definition_id)}
      />
    </Stack>
  ];

  return (
    <TableRow key={jobDef.job_definition_id} sx={{ cursor: 'pointer' }} hover>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={`${jobDef.job_definition_id}-${idx}`}>
          {cellContent}
        </TableCell>
      ))}
    </TableRow>
  );
}
