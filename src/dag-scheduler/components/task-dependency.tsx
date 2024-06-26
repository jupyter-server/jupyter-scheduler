import React, { FC, useCallback, useMemo } from 'react';
import {
  Chip,
  MenuItem,
  FormControl,
  OutlinedInput,
  SelectChangeEvent,
  FormLabel
} from '@mui/material';
import { Box } from '@mui/system';

import { Edge } from 'reactflow';
import { useWorkflowStore } from '../hooks';
import { Close } from '@mui/icons-material';
// TODO: tree-shake
import { uniqBy } from 'lodash';
import { CustomSelect } from './styled';

const getDiff = (previous: string[], current: string[]) => {
  const added = current
    .filter(item => !previous.includes(item))
    .map(item => ({ id: item, type: 'add' }));

  const removed = previous
    .filter(item => !current.includes(item))
    .map(item => ({ id: item, type: 'remove' }));

  return { added, removed };
};

const TaskDependency: FC = () => {
  const useStore = useWorkflowStore();

  const tasksById = useStore(state => state.tasksById);
  const onCreateEdge = useStore(state => state.onCreateEdge);
  const onEdgesDelete = useStore(state => state.onEdgesDelete);
  const edges = useStore(state => state.edges);

  const model = useStore(state => state.getSelectedNode());
  const allTasks = useStore(state => state.getAllTasks());

  const otherTasks = useMemo(
    () =>
      uniqBy(
        allTasks.filter(
          t =>
            t.nodeId !== model?.nodeId &&
            model?.nodeId &&
            !t.dependsOn?.includes(model?.nodeId)
        ),
        'nodeId'
      ),
    [allTasks, model?.nodeId]
  );

  const currentSources = useMemo((): string[] => {
    return edges
      .filter(e => e.target === model?.nodeId && !e.data?.deleting)
      .map(e => e.source)
      .filter(Boolean);
  }, [edges, model?.nodeId]);

  const handleRemove = useCallback(
    (removed: { id: string; type: 'remove' }[]) => {
      const depsToUpdate: Edge[] = removed.map(({ id }) => ({
        id: `${id}-${model?.nodeId as any}`,
        source: id,
        target: (model?.nodeId as any) || ''
      }));

      onEdgesDelete(depsToUpdate);
    },
    [model]
  );

  const handleChange = useCallback(
    (event: SelectChangeEvent<any>) => {
      const { value } = event.target;

      const { added, removed } = getDiff(currentSources || [], value);

      added.forEach(({ id }) => {
        onCreateEdge({
          source: id,
          target: (model?.nodeId as any) || '',
          sourceHandle: null,
          targetHandle: null
        });
      });

      const depsToUpdate: Edge[] = removed.map(({ id }) => ({
        id: `${id}-${model?.nodeId as any}`,
        source: id,
        target: (model?.nodeId as any) || ''
      }));

      onEdgesDelete(depsToUpdate);
    },
    [model, currentSources]
  );

  return (
    <FormControl fullWidth>
      <FormLabel component="legend" focused={false} sx={{ mb: 2 }}>
        Depends On
      </FormLabel>
      <CustomSelect
        multiple
        onChange={handleChange}
        value={currentSources}
        input={<OutlinedInput label="Depends On" />}
        renderValue={(selected: string[]) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map(value =>
              tasksById[value as any] ? (
                <Chip
                  key={value}
                  clickable
                  label={tasksById[value as any].name}
                  onDelete={() => handleRemove([{ id: value, type: 'remove' }])}
                  sx={{
                    border: '1px solid var(--jp-border-color1)',
                    background: 'var(--jp-input-active-background)',
                    '&:hover': {
                      background: 'var(--jp-border-color1)'
                    }
                  }}
                  deleteIcon={
                    <Close
                      sx={{
                        '&:hover': {
                          borderRadius: '50%',
                          background: 'var(--jp-border-color2)'
                        }
                      }}
                      style={{ fontSize: 12, padding: '1px' }}
                      onMouseDown={e => e.stopPropagation()}
                    />
                  }
                />
              ) : null
            )}
          </Box>
        )}
      >
        {otherTasks.map((task: any) => (
          <MenuItem key={task.nodeId as string} value={task.nodeId}>
            {task.name}
          </MenuItem>
        ))}
      </CustomSelect>
    </FormControl>
  );
};

export default TaskDependency;
