import React, { FC } from 'react';
import { getTitleCase } from '../util';
import { BadgeChip } from './badge-chip';

import { JobStatus, DeploymentStatus } from '../contants';
import { RunStatus, TaskStatus } from '../model';

export const WorkflowStatusBadge: FC<{
  status?: DeploymentStatus;
}> = ({ status = DeploymentStatus.CREATING }) => {
  // TODO: Refactor this to use a color map instead of switch case
  switch (status) {
    case DeploymentStatus.CREATING:
    case DeploymentStatus.CREATED:
      return <BadgeChip label={getTitleCase(status)} color="info" />;

    case DeploymentStatus.UPDATED:
      return <BadgeChip label={getTitleCase(status)} color="secondary" />;

    case DeploymentStatus.DEPLOYING:
      return <BadgeChip label={getTitleCase(status)} color="warning" />;

    case DeploymentStatus.DEPLOYED:
      return <BadgeChip label={getTitleCase(status)} color="success" />;

    case DeploymentStatus.FAILED_TO_CREATE:
    case DeploymentStatus.FAILED_TO_DEPLOY:
      return <BadgeChip color="error" label={getTitleCase(status)} />;

    default:
      return (
        <BadgeChip
          label={getTitleCase(DeploymentStatus.UNKNOWN)}
          color="default"
        />
      );
  }
};

export const JobStatusBadge: FC<{ status: JobStatus }> = ({ status }) => {
  // TODO: Refactor this to use a color map instead of switch case
  switch (status) {
    case JobStatus.RUNNING:
    case JobStatus.IN_PROGRESS:
      return <BadgeChip label={getTitleCase(status)} color="info" />;

    case JobStatus.QUEUED:
      return <BadgeChip label={getTitleCase(status)} color="warning" />;

    case JobStatus.COMPLETED:
      return <BadgeChip label={getTitleCase(status)} color="success" />;

    case JobStatus.FAILED:
      return <BadgeChip label={getTitleCase(status)} color="error" />;

    default:
      return (
        <BadgeChip label={getTitleCase(JobStatus.UNKNOWN)} color="default" />
      );
  }
};

export const TaskStatusBadge: FC<{ status: TaskStatus }> = ({
  status = TaskStatus.CREATING
}) => {
  switch (status) {
    case TaskStatus.FAILED_TO_UPDATE:
    case TaskStatus.FAILED_TO_CREATE:
      return <BadgeChip label={getTitleCase(status)} color="error" />;

    case TaskStatus.CREATING:
    case TaskStatus.CREATED:
      return <BadgeChip label={getTitleCase(status)} color="info" />;
    case TaskStatus.UPDATED:
      return <BadgeChip label={getTitleCase(status)} color="primary" />;
    default:
      return <BadgeChip label={getTitleCase(status)} color="default" />;
  }
};

export const TaskRunStatusBadge: FC<{ status: RunStatus }> = ({
  status = RunStatus.NOT_STARTED
}) => {
  switch (status) {
    case RunStatus.FAILED:
      return <BadgeChip label={getTitleCase(status)} color="error" />;
    case RunStatus.STOPPING:
      return <BadgeChip label={getTitleCase(status)} color="warning" />;
    case RunStatus.RUNNING:
    case RunStatus.IN_PROGRESS:
      return <BadgeChip label={getTitleCase(status)} color="info" />;
    case RunStatus.COMPLETED:
      return <BadgeChip label={getTitleCase(status)} color="success" />;
    default:
      return <BadgeChip label={getTitleCase(status)} color="default" />;
  }
};
