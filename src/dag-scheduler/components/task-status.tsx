import React, { FC } from 'react';
import { TaskStatus } from '../model';
import { ErrorOutlineRounded, WarningAmberOutlined } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

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
      return <WarningAmberOutlined color="warning" />;
    case TaskStatus.FAILED_TO_CREATE:
      return <ErrorOutlineRounded color="error" />;
    case TaskStatus.CREATING:
      return <CircularProgress size={16} />;
    default:
      return null;
  }
};

export default TaskStatusComponent;
