import React, { useMemo, useState, memo } from 'react';

import {
  Box,
  Link,
  Stack,
  Tooltip,
  IconButton,
  Typography,
  Chip,
  Avatar
} from '@mui/material';

import { useTranslator, useWorkflowStore, useWorkflows } from '../hooks';
import { EMPTY_VALUE } from '../contants';
import {
  Edit,
  InfoOutlined,
  LinkRounded,
  NotificationsOutlined,
  ScheduleRounded,
  UnfoldMore,
  Close
} from '@mui/icons-material';
import { UpdateWorkflow } from './update-workflow';
import { formatCronString, getTitleCase, timestampLocalize } from '../util';
import { ScheduleSummary } from '../components/schedule-summary';
import { WorkflowStatusBadge } from '../components/status-badge';
import { darken, lighten, useTheme } from '@mui/system';
import { ViewParameters } from '../components/view-parameters';
import { ListTemplate } from '../templates/list';
import { SidePanelTemplate } from '../templates/side-panel';
import ReactShowMoreText from 'react-show-more-text';

const State = (color: string, mode: 'light' | 'dark') => {
  const contrastFunc = mode === 'light' ? lighten : darken;

  return (
    <Stack
      width={12}
      height={12}
      borderRadius={12}
      alignItems="center"
      justifyContent="center"
      style={{
        background: contrastFunc(color, 0.7)
      }}
    >
      <Box
        width={6}
        height={6}
        borderRadius={6}
        style={{
          background: contrastFunc(color, 0.4)
        }}
      />
    </Stack>
  );
};

export const JobDefinition = memo(() => {
  const theme = useTheme();
  const useStore = useWorkflowStore();
  const { namespaces } = useWorkflows();
  const trans = useTranslator('jupyterlab');

  const [isEditing, setIsEditing] = useState(false);

  const model = useStore(state => state.currentJob);
  const updateJobDefinition = useStore(state => state.updateJobDefinition);

  const namespaceName = useMemo(() => {
    const { cluster, name } =
      namespaces.find(n => n.id === model?.namespaceId) || {};
    const clustName = cluster ? `(${cluster})` : '';

    return `${name} ${clustName}`;
  }, [model?.namespaceId, namespaces]);

  if (model === null) {
    // TODO: Display error page
    return <></>;
  }

  // TODO: Move this to store
  const canEdit = !!model?.job_definition_id && model?.version === 'v2';

  const jobDefinitionFields = [
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
      value: model.deploy_time
        ? timestampLocalize(+model.deploy_time)
        : EMPTY_VALUE,
      label: trans.__('Last deployed')
    },

    {
      value: namespaceName || model.namespaceId,
      label: trans.__('Namespace')
    },

    {
      value: model.active ? (
        <Stack
          gap={1}
          fontSize={11}
          direction="row"
          alignItems="center"
          color={theme.palette.success.light}
        >
          {State(theme.palette.success.main, theme.palette.mode)}
          {trans.__('ACTIVE')}
        </Stack>
      ) : (
        <Stack
          gap={1}
          fontSize={11}
          direction="row"
          alignItems="center"
          color={
            theme.palette.mode === 'light'
              ? theme.palette.grey[700]
              : theme.palette.grey[200]
          }
        >
          {State(
            theme.palette.mode === 'light'
              ? theme.palette.grey[700]
              : theme.palette.grey[200],
            theme.palette.mode
          )}
          {trans.__('PAUSED')}
        </Stack>
      ),
      label: trans.__('Status')
    },

    {
      value: (
        <Stack gap={2}>
          <Box>
            <WorkflowStatusBadge status={model.status as any} />
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
      label: trans.__('Deployment status')
    },

    {
      value: Object.keys(model.parameters || {}).length ? (
        <ViewParameters
          values={[
            {
              label: 'Parameters',
              value: JSON.stringify(model.parameters, null, 2)
            }
          ]}
        />
      ) : (
        trans.__('No Parameters configured')
      ),
      label: trans.__('Parameters'),
      icon: <UnfoldMore sx={{ transform: 'rotate(90deg)' }} />
    },

    {
      value: model.schedule ? (
        <ScheduleSummary schedule={model.schedule} />
      ) : (
        EMPTY_VALUE
      ),
      helperText: formatCronString(model) ?? '',
      label: trans.__('Schedule'),
      icon: <ScheduleRounded />
    },

    {
      value: model.scheduleStartDate ?? '',
      label: trans.__('Start date')
    },

    {
      value: model.timezone ?? '',
      label: trans.__('Time zone')
    },

    {
      value: (
        <>
          {model.notificationEvents?.length
            ? model.notificationEvents?.map(v => (
                <Chip
                  size="small"
                  sx={{ m: 1 }}
                  color="default"
                  label={getTitleCase(v)}
                />
              ))
            : EMPTY_VALUE}
        </>
      ),
      label: trans.__('Notification events'),
      icon: <NotificationsOutlined />
    },

    {
      value: (
        <>
          {model.notificationEmails?.length
            ? model.notificationEmails.map((v: any) => (
                <Chip
                  key={v}
                  avatar={<Avatar>{v[0].toUpperCase()}</Avatar>}
                  size="small"
                  sx={{ m: 1 }}
                  label={v}
                  color="default"
                />
              ))
            : EMPTY_VALUE}
        </>
      ),
      label: trans.__('Notification emails')
    },

    {
      value: model.slackChannel ?? '',
      label: trans.__('Slack channel')
    },

    {
      value: model.externalLinks?.length ? (
        <Stack spacing={2} style={{ margin: 0 }}>
          {model.externalLinks?.map(link => (
            <Link
              key={link.label}
              href={link.url}
              target="_blank"
              title={link.description}
              style={{ paddingRight: '1em' }}
            >
              {link.label}
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

  const HeaderButtons = isEditing ? (
    <IconButton onClick={() => setIsEditing(false)}>
      <Close fontSize="small" />
    </IconButton>
  ) : (
    <Tooltip
      title={
        <Typography variant="caption">{trans.__('Edit workflow')}</Typography>
      }
      placement="top"
    >
      <IconButton onClick={() => setIsEditing(true)}>
        <Edit fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <SidePanelTemplate
      HeaderComponent={
        <>
          <Typography variant="h6">{trans.__('Workflow details')}</Typography>
          {canEdit ? HeaderButtons : null}
        </>
      }
      ContentComponent={
        isEditing ? (
          <UpdateWorkflow
            model={model as any}
            onUpdate={updateJobDefinition}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ListTemplate items={jobDefinitionFields} />
        )
      }
    />
  );
});
