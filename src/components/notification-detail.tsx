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
> = ({ notificationsSettings }) => {
  const trans = useTranslator('jupyterlab');

  return (
    <Card>
      <CardContent>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          {trans.__('Notifications Settings')}
        </FormLabel>
        <Stack spacing={2}>
          <FormLabel component="legend">{trans.__('Send to')}</FormLabel>
          {notificationsSettings.send_to.map((email, idx) => (
            <NotificationsSettingsItem
              key={idx}
              label={trans.__(`Send to ${idx + 1}`)}
              value={email}
            />
          ))}
          <FormLabel component="legend">
            {trans.__('Notification Events')}
          </FormLabel>
          {notificationsSettings.events.map((event, idx) => (
            <NotificationsSettingsItem
              key={idx}
              label={trans.__(`Event ${idx + 1}`)}
              value={event}
            />
          ))}
          <NotificationsSettingsItem
            label={trans.__('Include output')}
            value={notificationsSettings.include_output}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
