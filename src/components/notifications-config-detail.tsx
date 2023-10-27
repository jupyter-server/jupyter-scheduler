import React from 'react';

import { Card, CardContent, Stack, FormLabel } from '@mui/material';
import { useTranslator } from '../hooks';
import { Scheduler } from '../handler';
import { LabeledValue } from './labeled-value';

type INotificationsConfigItemProps = {
  label: string;
  value: string | boolean;
};

type INotificationsConfigDetailProps = {
  notificationsConfig: Scheduler.INotificationsConfig;
};

function NotificationsConfigItem(props: INotificationsConfigItemProps) {
  const displayValue =
    typeof props.value === 'boolean'
      ? props.value
        ? 'Yes'
        : 'No'
      : props.value;

  return (
    <LabeledValue
      label={props.label}
      value={displayValue}
      style={{ flex: '1 1 100%' }}
    />
  );
}

export function NotificationsConfigDetail(
  props: INotificationsConfigDetailProps
): JSX.Element {
  const trans = useTranslator('jupyterlab');

  return (
    <Card>
      <CardContent>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          {trans.__('Notifications Settings')}
        </FormLabel>
        <Stack spacing={2}>
          <FormLabel component="legend">{trans.__('Send to')}</FormLabel>
          {props.notificationsConfig.send_to.map((email, idx) => (
            <NotificationsConfigItem
              key={idx}
              label={trans.__(`Send to ${idx + 1}`)}
              value={email}
            />
          ))}
          <FormLabel component="legend">
            {trans.__('Notification Events')}
          </FormLabel>
          {props.notificationsConfig.events.map((event, idx) => (
            <NotificationsConfigItem
              key={idx}
              label={trans.__(`Event ${idx + 1}`)}
              value={event}
            />
          ))}
          <NotificationsConfigItem
            label={trans.__('Include output')}
            value={props.notificationsConfig.include_output}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
