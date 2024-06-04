import React, { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { notebookIcon } from '@jupyterlab/ui-components';
import { Stack, Typography, Box, useTheme, Theme } from '@mui/material';
import { useWorkflowStore } from '../../hooks';
import RunStatusComponent from '../run-status';
import { AccessAlarmRounded } from '@mui/icons-material';
import { RunStatus } from '../../model';
import { getTitleCase, humanize } from '../../util';

const getTimeLapsed = (startTime: number, endTime: number) =>
  humanize(endTime - startTime);

const getStatusColor = (status: RunStatus, theme: Theme) => {
  switch (status) {
    case RunStatus.COMPLETED:
      return theme.palette.success.main;
    case RunStatus.FAILED:
      return theme.palette.error.main;
    case RunStatus.RUNNING:
      return theme.palette.info.main;
    case RunStatus.STOPPING:
      return theme.palette.warning.main;
    case RunStatus.NOT_STARTED:
      return theme.palette.grey[400];
    default:
      return null;
  }
};

export const TaskRunNode = memo(({ id }: NodeProps) => {
  const theme = useTheme();
  const useStore = useWorkflowStore();
  const taskData = useStore(state => state.getNodeData(id));
  const taskRunData = useStore(state => state.taskRunsById);
  const taskRun = taskRunData[taskData?.id as keyof typeof taskRunData];

  if (!taskData && !taskRun) {
    return null;
  }

  const { name, input_uri, input_filename } = taskData || {};

  const {
    end_time,
    start_time,
    run_count = 1,
    status = RunStatus.NOT_STARTED
  } = taskRun || {};

  const color = getStatusColor(status as any, theme);

  return (
    <Stack
      position="relative"
      className={`task-run-node wrapper ${color ? '' : 'pending'}`}
      style={{
        ...(color ? { borderTop: `4px solid ${color}` } : {})
      }}
    >
      <Box sx={{ pt: 3, pb: 4, px: 5 }}>
        <Stack spacing={2} maxWidth={200} overflow="hidden">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography noWrap variant="h6" flexBasis="90%">
              {name}
            </Typography>
            <RunStatusComponent status={status as any} />
          </Stack>
          <Typography
            noWrap
            color="text.secondary"
            style={{ marginBottom: '12px', marginTop: 0 }}
          >
            {getTitleCase(status || '')}
          </Typography>
          <Stack direction="row" alignItems="center" gap={2} mt={3}>
            <AccessAlarmRounded color="disabled" />
            <Typography color="text.secondary">
              {start_time && end_time
                ? getTimeLapsed(start_time, end_time)
                : 'N/A'}
            </Typography>
            {run_count > 1 ? (
              <Typography color="text.secondary">
                {' '}
                - {run_count}
                {' attempts'}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction="row" alignItems="center" gap={2} mt={1}>
            <notebookIcon.react width={20} height={20} display="flex" />
            <Typography noWrap color="text.secondary">
              {input_uri || input_filename}
            </Typography>
          </Stack>
        </Stack>
      </Box>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Stack>
  );
});
