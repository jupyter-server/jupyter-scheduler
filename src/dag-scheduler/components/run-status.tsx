import React, { FC } from 'react';
import { RunStatus } from '../model';
import {
  BlockRounded,
  CheckCircleOutlineRounded,
  ErrorOutlineRounded,
  LoopRounded,
  StopCircleRounded
} from '@mui/icons-material';

type Props = {
  status?: RunStatus;
};

const TaskStatusComponent: FC<Props> = ({ status = RunStatus.RUNNING }) => {
  switch (status) {
    case RunStatus.COMPLETED:
      return <CheckCircleOutlineRounded color="success" />;
    case RunStatus.FAILED:
      return <ErrorOutlineRounded color="error" />;
    case RunStatus.STOPPING:
      return <StopCircleRounded color="warning" />;
    case RunStatus.IN_PROGRESS:
    case RunStatus.RUNNING:
      return <LoopRounded color="info" />;
    default:
      return <BlockRounded color="disabled" />;
  }
};

export default TaskStatusComponent;
