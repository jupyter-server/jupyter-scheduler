import React from 'react';

import { Card, CardContent, Stack, FormLabel } from '@mui/material';
import { useTranslator } from '../hooks';
import { Scheduler } from '../handler';
import { LabeledValue } from '../components/labeled-value';

type INotificationsSettingsItemProps = {
  label: string;
  value: string | boolean;
};

type INotificationsSettingsDetailsProps = {
  notificationsSettings: Scheduler.INotificationsSettings;
};

function NotificationsSettingsItem(props: INotificationsSettingsItemProps) {
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

export function NotificationsSettingsDetails(
  props: INotificationsSettingsDetailsProps
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
          {props.notificationsSettings.send_to.map((email, idx) => (
            <NotificationsSettingsItem
              key={idx}
              label={trans.__(`Send to ${idx + 1}`)}
              value={email}
            />
          ))}
          <FormLabel component="legend">
            {trans.__('Notification Events')}
          </FormLabel>
          {props.notificationsSettings.events.map((event, idx) => (
            <NotificationsSettingsItem
              key={idx}
              label={trans.__(`Event ${idx + 1}`)}
              value={event}
            />
          ))}
          <NotificationsSettingsItem
            label={trans.__('Include output')}
            value={props.notificationsSettings.include_output}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
