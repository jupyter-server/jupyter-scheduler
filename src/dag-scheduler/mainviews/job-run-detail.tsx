import React, { useState, memo } from 'react';

import {
  Box,
  Link,
  Stack,
  Alert,
  Typography,
  Chip,
  Avatar
} from '@mui/material';

import { useTranslator, useWorkflowStore } from '../hooks';
import { EMPTY_VALUE } from '../contants';

import { timestampLocalize } from '../util';
import { JobStatusBadge } from '../components/status-badge';
import {
  InfoOutlined,
  LinkRounded,
  NotificationsOutlined,
  UnfoldMore
} from '@mui/icons-material';
import { ViewParameters } from '../components/view-parameters';
import { ListTemplate } from '../templates/list';
import { SidePanelTemplate } from '../templates/side-panel';
import ReactShowMoreText from 'react-show-more-text';

export const JobRunDetail = memo((): JSX.Element => {
  const useStore = useWorkflowStore();
  const trans = useTranslator('jupyterlab');
  const [displayError] = useState<string | null>(null);
  const model = useStore(state => state.currentJob);

  const ErrorBanner = displayError && (
    <Alert severity="error">{displayError}</Alert>
  );

  if (model === null) {
    return <>{ErrorBanner}</>;
  }

  const jobRunFields = [
    {
      icon: <InfoOutlined />,
      value: model.runId,
      label: trans.__('Run Id')
    },

    {
      value: model.name,
      label: trans.__('Name')
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
      value: (
        <Stack gap={2}>
          <Box>
            <JobStatusBadge status={model.status as any} />
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
      value: (
        <>
          {model.notificationEvents?.length
            ? model.notificationEvents?.map(v => (
                <Chip
                  key={v}
                  size="small"
                  label={v}
                  sx={{ m: 1 }}
                  color="default"
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
            ? model.notificationEmails
                ?.map(c => c.email)
                .map(v => (
                  <Chip
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

  return (
    <SidePanelTemplate
      HeaderComponent={
        <Typography variant="h6">{trans.__('Job Run Details')}</Typography>
      }
      ContentComponent={<ListTemplate items={jobRunFields} />}
    />
  );
});
