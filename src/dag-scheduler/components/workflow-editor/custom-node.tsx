import React, { memo, useMemo, useState } from 'react';
import {
  Handle,
  NodeProps,
  NodeToolbar,
  Position,
  ReactFlowState,
  useStore as useReactflowStore
} from 'reactflow';
import { Cloud, Delete, Edit } from '@mui/icons-material';
import { notebookIcon } from '@jupyterlab/ui-components';
import { Stack, Typography, Box, IconButton } from '@mui/material';
import { useWorkflowStore, useWorkflows } from '../../hooks';
import TaskStatusComponent from '../task-status';

const connectionNodeIdSelector = (state: ReactFlowState) =>
  state.connectionNodeId;

const connectionStatusSelector = (state: ReactFlowState) =>
  state.connectionStatus;

const connectionEndHandleSelector = (state: ReactFlowState) =>
  state.connectionEndHandle;

export const CustomNode = memo(({ id, isConnectable }: NodeProps) => {
  const useStore = useWorkflowStore();
  const [hovered, setHovered] = useState(false);
  const taskData = useStore(state => state.getNodeData(id));
  // const isValidConnection = useStore(state => state.isValidConnection);
  const { kernelSpecs } = useWorkflows();

  const connectionNodeId = useReactflowStore(connectionNodeIdSelector);
  const connectionStatus = useReactflowStore(connectionStatusSelector);
  const connectionEndHandle = useReactflowStore(connectionEndHandleSelector);
  const isConnecting = !!connectionNodeId;
  const isTarget = connectionNodeId && connectionNodeId !== id;
  const shouldAddClass = connectionEndHandle?.nodeId === id;

  // TODO: Find an optimized way to do this as currently this causes lag in UI
  // const isValid = useMemo(
  //   () =>
  //     isConnecting &&
  //     isTarget &&
  //     isValidConnection({
  //       source: connectionNodeId,
  //       target: id,
  //       sourceHandle: null,
  //       targetHandle: null
  //     }),
  //   [id, connectionNodeId, isConnecting]
  // );

  const kernelSpecsById = useMemo(
    () => new Map(kernelSpecs.map(item => [item.value, [item.label]])),
    [kernelSpecs]
  );

  if (!taskData) {
    return null;
  }

  return (
    <Box
      position="relative"
      width="100%"
      height="100%"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Stack position="relative" className="task-node wrapper">
        <Box className="inner" bgcolor="error">
          <Stack spacing={2} maxWidth={200} overflow="hidden">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              style={{
                marginBottom: '12px',
                pointerEvents: 'all'
              }}
            >
              <Typography noWrap variant="h6" flexBasis="90%">
                {taskData.name}
              </Typography>
              <TaskStatusComponent
                status={taskData.status}
                message={taskData.status_message}
              />
            </Stack>
            <Stack direction="row" alignItems="center" gap={2} mt={1}>
              <notebookIcon.react width={20} height={20} display="flex" />
              <Typography noWrap color="text.secondary">
                {taskData.input_uri || taskData.input_filename}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={2}>
              <Cloud color="disabled" />
              <Typography noWrap color="text.secondary">
                {kernelSpecsById.get(taskData.kernelSpecId)?.[0] ||
                  taskData.kernelSpecId}
              </Typography>
            </Stack>
          </Stack>
        </Box>
        {isConnectable ? (
          <>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
          </>
        ) : null}
        <NodeToolbar
          align="start"
          // TODO: Enable this later
          isVisible={false}
          position={Position.Top}
        >
          <Stack gap={2} direction="row" className="toolbar-btn-container">
            <IconButton>
              <Edit />
            </IconButton>
            <IconButton>
              <Delete />
            </IconButton>
          </Stack>
        </NodeToolbar>
      </Stack>

      {isConnecting && isTarget ? (
        <div className={`show-hint ${shouldAddClass ? connectionStatus : ''}`}>
          +
        </div>
      ) : null}
      {isConnectable && hovered && !isTarget ? (
        <div className="source show-hint">+</div>
      ) : null}
    </Box>
  );
});
