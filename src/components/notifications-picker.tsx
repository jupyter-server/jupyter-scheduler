import React, { useState } from 'react';

import { FormControl, InputLabel, MenuItem } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from './stack';

export type NotificationsPickerProps = {
  notificationEvents: string[];
  id: string;
};

export function NotificationsPicker(
  props: NotificationsPickerProps
): JSX.Element | null {
  if (!props.notificationEvents.length) {
    return null;
  }
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const { notificationEvents, id } = props;
  const labelId = `${id}-label`;
  const label = 'Notification Events';

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedEvent(event.target.value as string);
  };

  return (
    <Stack size={2}>
      <InputLabel>{'Notifications'}</InputLabel>

      <FormControl>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          id={id}
          value={selectedEvent}
          label={label}
          onChange={handleSelectChange}
        >
          {notificationEvents.map(event => (
            <MenuItem key={event} value={event}>
              {event}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
