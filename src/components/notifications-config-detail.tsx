import React from 'react';

import { Card, CardContent, Stack, FormLabel } from '@mui/material';
import { useTranslator } from '../hooks';
import { Scheduler } from '../handler';
import { LabeledValue } from './labeled-value';

type INotificationsConfigDetailProps = {
  notificationsConfig: Scheduler.INotificationsConfig;
};

export function NotificationsConfigDetail(
  props: INotificationsConfigDetailProps
): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const sendTo = props.notificationsConfig.send_to.join(', ');
  const events = props.notificationsConfig.events.join(', ');

  return (
    <Card>
      <CardContent>
        <FormLabel component="legend" sx={{ mb: 2 }}>
          {trans.__('Notifications Settings')}
        </FormLabel>
        <Stack spacing={2}>
          <LabeledValue
            label={trans.__('Send to')}
            value={sendTo}
            style={{ flex: '1 1 100%' }}
          />
          <LabeledValue
            label={trans.__('Notification events')}
            value={events}
            style={{ flex: '1 1 100%' }}
          />
          <LabeledValue
            label={trans.__('Include output')}
            value={props.notificationsConfig.include_output ? 'True' : 'False'}
            style={{ flex: '1 1 100%' }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
