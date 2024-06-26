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
import ReactShowMoreText from 'react-show-more-text';

import { useTranslator, useWorkflowStore, useWorkflows } from '../hooks';
import { EMPTY_VALUE } from '../contants';
import {
  convertTaskTimeoutHoursToSeconds,
  convertTaskTimeoutSecondsToHours
} from '../util/task-timeout-validation';
import { formatTime, timestampLocalize } from '../util';
import { TaskRunStatusBadge } from '../components/status-badge';
import { RunStatus } from '../model';
import { useReactFlow } from 'reactflow';
import { FilePreviewItem } from '../components/file-preview';
import { UpdateTask } from './update-task';
import {
  ArrowOutward,
  AttachmentOutlined,
  CloudQueueOutlined,
  Edit,
  InfoOutlined,
  LinkRounded,
  Close
} from '@mui/icons-material';
import { Scheduler } from '../handler';
import { ViewParameters } from '../components/view-parameters';
import { ListTemplate } from '../templates/list';
import { SidePanelTemplate } from '../templates/side-panel';

export interface ITaskRunProps {
  taskId: string;
  onUpdate: (payload: Scheduler.ITask) => any;
}

export const TaskRunDetail = memo((props: ITaskRunProps): JSX.Element => {
  const { fitView } = useReactFlow();
  const useStore = useWorkflowStore();
  const { kernelSpecs, currentWorkflow } = useWorkflows();
  const trans = useTranslator('jupyterlab');
  const [isEditing, setIsEditing] = useState(false);
  const tasksById = useStore(state => state.tasksById);
  const taskRunsById = useStore(state => state.taskRunsById);
  const currentJob = useStore(state => state.currentJob);

  const kernelSpecsById = useMemo(
    () => new Map(kernelSpecs.map(item => [item.value, item.label])),
    [kernelSpecs]
  );

  const taskData = useMemo(() => {
    return tasksById[props.taskId];
  }, [tasksById, props.taskId]);

  const model = useMemo(() => {
    if (!taskData) {
      return undefined;
    }

    const taskRun = taskRunsById[taskData.id as keyof typeof taskRunsById];

    // This is to handle cases when task run is not available for a given task
    // The dependsOn field from task should be used always as the nodeId is only available in task
    return (taskRun
      ? {
          ...taskRun,
          name: taskData.name,
          dependsOn: taskData.dependsOn,
          slackChannel: taskData.slackChannel,
          kernelSpecsById: taskData.kernelSpecId,
          notificationEmails: taskData.notificationEmails,
          notificationEvents: taskData.notificationEvents
        }
      : {
          ...taskData,
          status: RunStatus.NOT_STARTED
        }) as unknown as Scheduler.ITaskRun;
  }, [taskRunsById, taskData]);

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

  if (!model) {
    return <>{ErrorBanner}</>;
  }

  const inputFileName =
    model.input_filename || model.input_file_id || model.name;

  const hasProperties = Boolean(
    Object.keys(model.parameters || {}).length ||
      Object.keys(model.runtimeProperties || {}).length
  );

  const exectime = formatTime(model.create_time);

  const handleNodeFocus = useCallback((nodeId: string) => {
    fitView({ nodes: [{ id: nodeId }], duration: 500 });
  }, []);

  const taskDetailFields = [
    { value: model.name, label: trans.__('Name'), icon: <InfoOutlined /> },

    {
      value: model.start_time
        ? timestampLocalize(+model.start_time)
        : EMPTY_VALUE,
      label: trans.__('Start time')
    },

    {
      value: model.end_time ? timestampLocalize(+model.end_time) : EMPTY_VALUE,
      label: trans.__('End time')
    },

    {
      value: (
        <Stack gap={2}>
          <Box>
            <TaskRunStatusBadge status={model.status as any} />
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
      ),
      label: trans.__('Status')
    },

    {
      value: (
        <>
          {model.dependsOn?.length
            ? model.dependsOn
                .map(id => tasksById[id as keyof typeof tasksById])
                .filter(Boolean)
                .map(v => (
                  <Chip
                    clickable
                    size="small"
                    key={v.nodeId}
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
      value:
        model.input_file_id || model.output_file_id ? (
          <List sx={{ p: 0 }}>
            {model.input_file_id ? (
              <FilePreviewItem
                type="Input file"
                fileName={inputFileName}
                fileId={model.input_file_id}
              />
            ) : null}
            {model?.output_file_id ? (
              <FilePreviewItem
                type="Output file"
                fileId={model.output_file_id}
                fileName={`${inputFileName.replace(
                  '.ipynb',
                  ''
                )}-${exectime}.ipynb`}
              />
            ) : null}
          </List>
        ) : (
          EMPTY_VALUE
        ),
      label: trans.__('Artifacts'),
      icon: <AttachmentOutlined />
    },

    {
      value: model.kernelSpecId
        ? kernelSpecsById.get(model.kernelSpecId)
        : EMPTY_VALUE,
      label: trans.__('Kernel'),
      icon: <CloudQueueOutlined />
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
              label: 'Runtime Properties',
              value: JSON.stringify(model.runtimeProperties || {}, null, 2)
            }
          ]}
        />
      ) : (
        trans.__('No properties configured')
      ),
      label: trans.__('Properties')
    },

    {
      value:
        convertTaskTimeoutSecondsToHours(
          model.taskTimeout || convertTaskTimeoutHoursToSeconds('4')
        ) + trans.__(' hours'),
      label: trans.__('Timeout')
    },

    {
      value: model.externalLinks?.length ? (
        <Stack spacing={2} style={{ margin: 0 }}>
          {model.externalLinks?.map(link => (
            <Link
              underline="hover"
              key={link.label}
              href={link.url}
              target="_blank"
              title={link.description}
              style={{
                display: 'flex',
                gap: '4px',
                paddingRight: '1em',
                alignItems: 'center'
              }}
            >
              {link.label} <ArrowOutward fontSize="small" />
            </Link>
          ))}
        </Stack>
      ) : (
        EMPTY_VALUE
      ),
      label: trans.__('External links'),
      icon: <LinkRounded />
    }
  ];

  const didTaskFail = (model.status as any) === RunStatus.FAILED;

  const title = isEditing
    ? trans.__('Task details')
    : trans.__('Task Run details');

  const canEdit =
    !!currentJob?.job_definition_id && currentWorkflow?.version === 'v2';

  const HeaderButtons = isEditing ? (
    <IconButton
      sx={{ ml: 'auto', mr: 1 }}
      onClick={() => {
        setIsEditing(false);
      }}
    >
      <Close fontSize="small" />
    </IconButton>
  ) : (
    <>
      <Tooltip
        title={
          <Typography variant="caption">{trans.__('Edit Task')}</Typography>
        }
        placement="top"
      >
        <IconButton
          sx={{ ml: 'auto', mr: 1 }}
          onClick={() => {
            didTaskFail && setIsEditing(true);
          }}
        >
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <SidePanelTemplate
      HeaderComponent={
        <>
          <Typography variant="h6">{title}</Typography>
          {didTaskFail && canEdit ? HeaderButtons : null}
        </>
      }
      ContentComponent={
        didTaskFail && isEditing ? (
          <UpdateTask
            model={taskData}
            onCreate={props.onUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ListTemplate items={taskDetailFields} />
        )
      }
    />
  );
});
