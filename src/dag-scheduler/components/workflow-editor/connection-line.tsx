import React, { FC } from 'react';
import {
  ConnectionLineComponentProps,
  EdgeLabelRenderer,
  getBezierPath,
  useStoreApi
} from 'reactflow';
import { useWorkflowStore } from '../../hooks';
import { TaskStatus } from '../../model';

export const ConnectionLine: FC<ConnectionLineComponentProps> = props => {
  const { toX, toY, connectionStatus, fromX, fromY, fromPosition, toPosition } =
    props;

  const { getState } = useStoreApi();
  const useStore = useWorkflowStore();
  const edges = useStore(state => state.edges);
  const getNodeData = useStore(state => state.getNodeData);
  const { connectionEndHandle, connectionNodeId } = getState();
  const isValid = connectionStatus === 'valid';
  const showLabel = !isValid && connectionEndHandle?.nodeId;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition
  });

  const getErrorMessage = () => {
    if (!connectionNodeId || !connectionEndHandle?.nodeId) {
      return;
    }

    if (connectionNodeId === connectionEndHandle.nodeId) {
      return 'Source & Target cannot be same';
    }

    const sourceStatus = getNodeData(connectionNodeId)?.status;
    const targetStatus = getNodeData(connectionEndHandle.nodeId)?.status;

    const isInValidStatus = [
      TaskStatus.FAILED_TO_CREATE,
      TaskStatus.CREATING
    ].some(
      s =>
        !sourceStatus ||
        !targetStatus ||
        s === sourceStatus ||
        s === targetStatus
    );

    if (isInValidStatus) {
      return 'Invalid source or target task status';
    }

    const exists = edges.find(
      edge =>
        edge.source === connectionNodeId &&
        edge.target === connectionEndHandle.nodeId
    );

    if (exists) {
      return 'Duplicate connection not allowed';
    }

    return 'Cyclic dependency not allowed';
  };

  return (
    <>
      <g>
        <path
          fill="none"
          d={edgePath}
          strokeWidth={2}
          className={'animated'}
          stroke={isValid ? 'url(#edge-gradient)' : 'url(#edge-gradient-error)'}
        />
        <circle
          r={3}
          cx={toX}
          cy={toY}
          fill="#fff"
          strokeWidth={3}
          stroke={isValid ? 'url(#edge-gradient)' : 'url(#edge-gradient-error)'}
        />
      </g>
      {showLabel ? (
        <EdgeLabelRenderer>
          <div
            style={{
              padding: 10,
              fontSize: 11,
              zIndex: 10000,
              borderRadius: 5,
              fontWeight: 700,
              position: 'absolute',
              background: '#ffcc00',
              color: '#333',
              transform: `translate(-50%, -50%) translate(${labelX}px,${
                labelY + 50
              }px)`
            }}
            className="nodrag nopan"
          >
            {getErrorMessage()}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
};
