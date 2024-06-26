import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { FC, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  ReactFlowState,
  getBezierPath,
  useStore as useReactflowStore
} from 'reactflow';
import { useWorkflowStore } from '../../hooks';

const animation = {
  strokeDasharray: 5,
  stroke: 'url(#edge-gradient)',
  animation: 'dashdraw 0.2s linear infinite'
};

const connectionNodeIdSelector = (state: ReactFlowState) =>
  state.connectionNodeId;

export const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd
}) => {
  const xEqual = sourceX === targetX;
  const yEqual = sourceY === targetY;
  const [hovered, setHovered] = useState(false);
  const useStore = useWorkflowStore();
  const edges = useStore(state => state.edges);
  const onEdgesDelete = useStore(state => state.onEdgesDelete);
  const connectionNodeId = useReactflowStore(connectionNodeIdSelector);
  const isConnecting = !!connectionNodeId;

  const [edgePath, labelX, labelY] = getBezierPath({
    // we need this little hack in order to display the gradient for a straight line
    sourceX: xEqual ? sourceX + 0.0001 : sourceX,
    sourceY: yEqual ? sourceY + 0.0001 : sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const handleDeleteEdge = () => {
    const currentEdge = edges.find(e => e.id === id);

    if (!currentEdge) {
      return;
    }

    const { source, target } = currentEdge;

    onEdgesDelete([
      {
        id,
        source,
        target,
        sourceHandle: null,
        targetHandle: null
      }
    ]);
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BaseEdge
        id={id}
        style={{
          strokeWidth: 2,
          strokeOpacity: 0.75,
          pointerEvents: 'all',
          ...(data?.pending || data?.deleting ? animation : {}),
          ...(selected ? { stroke: '#2a8af6', strokeWidth: 4 } : {}),
          ...(data?.deleting ? { stroke: 'url(#edge-gradient-error)' } : {}),
          ...style
        }}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={10}
      />
      {hovered && !isConnecting && !data?.hideBtn ? (
        <EdgeLabelRenderer>
          <div
            style={{
              zIndex: 10000,
              padding: '2px',
              color: '#333',
              position: 'absolute',
              borderRadius: '100%',
              pointerEvents: 'all',
              background: 'var(--jp-border-color2)',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`
            }}
            className="nodrag nopan"
          >
            <IconButton className="edgebutton" onClick={handleDeleteEdge}>
              <Close />
            </IconButton>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );
};
