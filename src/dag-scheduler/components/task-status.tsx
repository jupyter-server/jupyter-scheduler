import React, { FC } from 'react';
import { TaskStatus } from '../model';
import { ErrorOutlineRounded, WarningAmberOutlined } from '@mui/icons-material';
import { CircularProgress, Tooltip } from '@mui/material';

type Props = {
  status?: TaskStatus;
  message?: string;
};

const TaskStatusComponent: FC<Props> = ({
  status = TaskStatus.CREATING,
  message
}) => {
  switch (status) {
    case TaskStatus.FAILED_TO_UPDATE:
      return (
        <Tooltip title={message}>
          <WarningAmberOutlined color="warning" />
        </Tooltip>
      );
    case TaskStatus.FAILED_TO_CREATE:
      return (
        <Tooltip title={message}>
          <ErrorOutlineRounded color="error" />
        </Tooltip>
      );
    case TaskStatus.CREATING:
      return <CircularProgress size={16} />;
    default:
      return null;
  }
};

export default TaskStatusComponent;
