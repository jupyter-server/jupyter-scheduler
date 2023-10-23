import React from 'react';

import { Card, CardContent, Stack, FormLabel } from '@mui/material';
import { useTranslator } from '../hooks';
import { Scheduler } from '../handler';
import { LabeledValue } from '../components/labeled-value';

interface INotificationItemProps {
  label: string;
  value: string | boolean;
}

interface INotificationDetailsProps {
  notification: Scheduler.INotification;
}

const NotificationItem: React.FC<INotificationItemProps> = ({
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

export const NotificationDetails: React.FC<INotificationDetailsProps> = ({
  notification
}) => {
  const trans = useTranslator('jupyterlab');

  return (
    <Card>
      <CardContent>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          {trans.__('Notification')}
        </FormLabel>
        <Stack spacing={2}>
          <FormLabel component="legend">{trans.__('Send To')}</FormLabel>
          {notification.send_to.map((email, idx) => (
            <NotificationItem
              key={idx}
              label={trans.__(`Send To ${idx}`)}
              value={email}
            />
          ))}
          <FormLabel component="legend">{trans.__('Events')}</FormLabel>
          {notification.events.map((event, idx) => (
            <NotificationItem
              key={idx}
              label={trans.__(`Event ${idx}`)}
              value={event}
            />
          ))}
          <NotificationItem
            label={trans.__('Include Output')}
            value={notification.include_output}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
