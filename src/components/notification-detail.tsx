import React from 'react';

import { Card, CardContent, Stack, FormLabel } from '@mui/material';
import { useTranslator } from '../hooks';
import { Scheduler } from '../handler';
import { LabeledValue } from '../components/labeled-value';

interface INotificationsSettingsItemProps {
  label: string;
  value: string | boolean;
}

interface INotificationsSettingsDetailsProps {
  notification: Scheduler.INotificationsSettings;
}

const NotificationsSettingsItem: React.FC<INotificationsSettingsItemProps> = ({
  label,
  value
}) => {
  const displayValue =
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

  return (
    <LabeledValue
      label={label}
      value={displayValue}
      style={{ flex: '1 1 100%' }}
    />
  );
};

export const NotificationsSettingsDetails: React.FC<
  INotificationsSettingsDetailsProps
> = ({ notification }) => {
  const trans = useTranslator('jupyterlab');

  return (
    <Card>
      <CardContent>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          {trans.__('Notifications Settings')}
        </FormLabel>
        <Stack spacing={2}>
          <FormLabel component="legend">{trans.__('Send To')}</FormLabel>
          {notification.send_to.map((email, idx) => (
            <NotificationsSettingsItem
              key={idx}
              label={trans.__(`Send To ${idx + 1}`)}
              value={email}
            />
          ))}
          <FormLabel component="legend">
            {trans.__('Notification Events')}
          </FormLabel>
          {notification.events.map((event, idx) => (
            <NotificationsSettingsItem
              key={idx}
              label={trans.__(`Event ${idx + 1}`)}
              value={event}
            />
          ))}
          <NotificationsSettingsItem
            label={trans.__('Include Output')}
            value={notification.include_output}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
