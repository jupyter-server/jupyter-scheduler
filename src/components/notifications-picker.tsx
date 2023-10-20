import React from 'react';

import { InputLabel } from '@mui/material';
import { Stack } from './stack';

export type NotificationsPickerProps = {
  notificationEvents: string[];
};

export function NotificationsPicker(
  props: NotificationsPickerProps
): JSX.Element | null {
  const { notificationEvents } = props;

  if (!notificationEvents.length) {
    return null;
  }
  return (
    <Stack size={2}>
      <InputLabel>{'Notifications'}</InputLabel>
    </Stack>
  );
}
