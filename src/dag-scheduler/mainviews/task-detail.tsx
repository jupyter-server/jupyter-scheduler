import React, { useCallback, useMemo, useState, memo } from 'react';

import {
  Alert,
  Box,
  Chip,
  IconButton,
  Link,
  List,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

import { useTranslator, useWorkflowStore, useWorkflows } from '../hooks';
import { EMPTY_VALUE } from '../contants';
import {
  convertTaskTimeoutHoursToSeconds,
  convertTaskTimeoutSecondsToHours
} from '../util/task-timeout-validation';
import { UpdateTask } from './update-task';
import {
  AttachmentOutlined,
  CloudQueueOutlined,
  Delete,
  Edit,
  InfoOutlined,
  Close,
  UnfoldMore
} from '@mui/icons-material';
import { getTitleCase, timestampLocalize } from '../util';

import { TaskStatusBadge } from '../components/status-badge';
import { useReactFlow } from 'reactflow';
import { FilePreviewItem } from '../components/file-preview';
import { ViewParameters } from '../components/view-parameters';
import { ConfirmDialog } from '../components/confirmation-dialog';
import { Scheduler } from '../handler';
import { ListTemplate } from '../templates/list';
import { SidePanelTemplate } from '../templates/side-panel';
import ReactShowMoreText from 'react-show-more-text';

type Props = {
  onDelete: (task: Scheduler.ITask) => Promise<void>;
  onCreate: (task: Scheduler.ITask) => Promise<void>;
};

export const TaskDetail = memo(({ onDelete, onCreate }: Props) => {
  const { fitView } = useReactFlow();
  const useStore = useWorkflowStore();
  const { kernelSpecs } = useWorkflows();
  const trans = useTranslator('jupyterlab');

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const kernelSpecsById = useMemo(
    () => new Map(kernelSpecs.map(item => [item.value, item.label])),
    [kernelSpecs]
  );

  const tasksById = useStore(state => state.tasksById);
  const currentJob = useStore(state => state.currentJob);
  const model = useStore(state => state.getSelectedNode());

  const ErrorBanner = (
    <Alert
      severity="error"
      style={{
        boxShadow: 'none',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {model?.status_message || 'Unknown error.'}
    </Alert>
  );

  const handleNodeFocus = useCallback((nodeId: string) => {
    fitView({ nodes: [{ id: nodeId }], duration: 500 });
  }, []);

  const handleDelete = () => {
    if (model) {
      onDelete(model);
    }

    setIsDeleting(false);
  };

  const handleCancel = () => setIsDeleting(false);

  if (!model) {
    return <>{ErrorBanner}</>;
  }

  const inputFileName =
    model.input_filename || model.input_file_id || model.name;

  const hasProperties = Boolean(
    Object.keys(model.parameters || {}).length ||
      Object.keys(model.runtimeProperties || {}).length
  );

  const taskDetailFields = [
    {
      value: model.name,
      label: trans.__('Name'),
      icon: <InfoOutlined />
    },

    {
      value: model.create_time
        ? timestampLocalize(+model.create_time)
        : EMPTY_VALUE,
      label: trans.__('Created at')
    },

    {
      value: model.update_time
        ? timestampLocalize(+model.update_time)
        : EMPTY_VALUE,
      label: trans.__('Updated at')
    },

    {
      value: model.status ? (
        <Stack gap={2}>
          <Box>
            <TaskStatusBadge status={model.status as any} />
          </Box>
          {model.status_message ? (
            <Typography paragraph>
              <ReactShowMoreText
                lines={5}
                more={
                  <Link component="button" underline="none">
                    {trans.__('Show more')}
                  </Link>
                }
                less={
                  <Link component="button" underline="none">
                    {trans.__('Show less')}
                  </Link>
                }
                className="error-details-collapse"
              >
                {model.status_message}
              </ReactShowMoreText>
            </Typography>
          ) : null}
        </Stack>
      ) : (
        EMPTY_VALUE
      ),
      label: trans.__('Status')
    },

    {
      value: (
        <>
          {model.dependsOn?.length
            ? model.dependsOn
                .map(id => tasksById[id])
                .filter(Boolean)
                .map(v => (
                  <Chip
                    clickable
                    key={v.nodeId}
                    size="small"
                    label={v.name}
                    color="default"
                    onClick={() => handleNodeFocus(v.nodeId)}
                    sx={{
                      m: 1,
                      boxShadow: 'var(--jp-elevation-z1)',

                      '&.MuiChip-root:hover': {
                        boxShadow: 'var(--jp-elevation-z2)'
                      }
                    }}
                  />
                ))
            : EMPTY_VALUE}
        </>
      ),
      label: trans.__('Depends on')
    },

    {
      value: model.kernelSpecId
        ? kernelSpecsById.get(model.kernelSpecId)
        : EMPTY_VALUE,
      label: trans.__('Kernel'),
      icon: <CloudQueueOutlined />
    },

    {
      value: (
        <>
          {model.triggerRule ? (
            <Chip
              size="small"
              color="default"
              label={getTitleCase(model.triggerRule)}
            />
          ) : (
            EMPTY_VALUE
          )}
        </>
      ),
      label: trans.__('Trigger')
    },

    {
      value:
        convertTaskTimeoutSecondsToHours(
          model.taskTimeout || convertTaskTimeoutHoursToSeconds('4')
        ) + trans.__(' hours'),
      label: trans.__('Timeout')
    },

    {
      value: hasProperties ? (
        <ViewParameters
          values={[
            {
              label: 'Parameters',
              value: JSON.stringify(model.parameters || {}, null, 2)
            },
            {
              label: 'Runtime properties',
              value: JSON.stringify(model.runtimeProperties || {}, null, 2)
            }
          ]}
        />
      ) : (
        trans.__('No properties configured')
      ),
      label: trans.__('Properties'),
      icon: <UnfoldMore sx={{ transform: 'rotate(90deg)' }} />
    },

    {
      value: model.showOutputInEmail
        ? trans.__('ENABLED')
        : trans.__('DISABLED'),
      label: trans.__('Email preview')
    },

    {
      value: model.input_file_id ? (
        <List sx={{ p: 0 }}>
          <FilePreviewItem
            type="Input file"
            fileName={inputFileName}
            fileId={model.input_file_id}
          />
        </List>
      ) : (
        EMPTY_VALUE
      ),
      label: trans.__('Input file snapshot'),
      icon: <AttachmentOutlined />
    }
  ];

  // TODO: Move this to store
  const canEdit =
    !!currentJob?.job_definition_id && currentJob?.version === 'v2';

  const HeaderButtons = isEditing ? (
    <IconButton sx={{ ml: 'auto', mr: 1 }} onClick={() => setIsEditing(false)}>
      <Close fontSize="small" />
    </IconButton>
  ) : (
    <>
      <Tooltip
        title={
          <Typography variant="caption">{trans.__('Edit task')}</Typography>
        }
        placement="top"
      >
        <IconButton
          sx={{ ml: 'auto', mr: 1 }}
          onClick={() => setIsEditing(true)}
        >
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={
          <Typography variant="caption">{trans.__('Delete task')}</Typography>
        }
        placement="top"
      >
        <IconButton onClick={() => setIsDeleting(true)}>
          <Delete fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <>
      <SidePanelTemplate
        HeaderComponent={
          <>
            <Typography variant="h6">{trans.__('Task details')}</Typography>
            {canEdit ? HeaderButtons : null}
          </>
        }
        ContentComponent={
          isEditing ? (
            <UpdateTask
              model={model}
              onCreate={onCreate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ListTemplate items={taskDetailFields} />
          )
        }
      />

      {isDeleting ? (
        <ConfirmDialog
          title="Warning"
          color="error"
          dialogConfirmText="Delete task"
          dialogText={trans.__(
            'The task and all dependency links attached to it will be deleted from the workflow'
          )}
          onConfirm={handleDelete}
          onClose={handleCancel}
        />
      ) : null}
    </>
  );
});
