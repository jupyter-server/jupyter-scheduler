import React, { useState, useCallback } from 'react';

import { Cluster } from './cluster';
import {
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Chip
} from '@mui/material';
import { ICreateJobModel } from '../model';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from './stack';
import { useTranslator } from '../hooks';

interface INotificationPickerProps {
  notificationEvents: string[];
  id: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
}

export function NotificationPicker({
  notificationEvents,
  id,
  model,
  handleModelChange: modelChange
}: INotificationPickerProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    model.notification?.selectedEvents || []
  );

  const selectChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const newEvent = e.target.value;
      if (!selectedEvents.includes(newEvent)) {
        const updatedEvents = [...selectedEvents, newEvent];
        setSelectedEvents(updatedEvents);
        modelChange({
          ...model,
          notification: {
            ...model.notification,
            selectedEvents: updatedEvents
          }
        });
      }
    },
    [selectedEvents, model, modelChange]
  );

  const sendToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const updatedNotification = { ...model.notification, [name]: value };
      modelChange({ ...model, notification: updatedNotification });
    },
    [model, modelChange]
  );

  const deleteSelectedEvent = useCallback(
    (eventToDelete: string) => () => {
      const updatedEvents = selectedEvents.filter(
        event => event !== eventToDelete
      );
      setSelectedEvents(updatedEvents);
      modelChange({
        ...model,
        notifications: { ...model.notification, selectedEvents: updatedEvents }
      });
    },
    [selectedEvents, model, modelChange]
  );

  if (!notificationEvents.length) {
    return null;
  }

  return (
    <Stack size={2}>
      <InputLabel>{trans.__('Notifications')}</InputLabel>
      <TextField
        label={trans.__('Send To')}
        value={model.notification?.sendTo || ''}
        name="sendTo"
        variant="outlined"
        onChange={sendToChange}
      />
      <NotificationEventsSelect
        id={id}
        availableEvents={notificationEvents.filter(
          e => !selectedEvents.includes(e)
        )}
        selectChange={selectChange}
      />
      <SelectedEventsChips
        selectedEvents={selectedEvents}
        deleteSelectedEvent={deleteSelectedEvent}
      />
    </Stack>
  );
}

const NotificationEventsSelect: React.FC<{
  id: string;
  availableEvents: string[];
  selectChange: (e: SelectChangeEvent<string>) => void;
}> = ({ id, availableEvents, selectChange: handleSelectChange }) => {
  const trans = useTranslator('jupyterlab');
  const label = trans.__('Notification Events');
  const labelId = `${id}-label`;

  return (
    <FormControl>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={id}
        label={label}
        onChange={handleSelectChange}
      >
        {availableEvents.map(e => (
          <MenuItem key={e} value={e}>
            {e}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const SelectedEventsChips: React.FC<{
  selectedEvents: string[];
  deleteSelectedEvent: (eventToDelete: string) => () => void;
}> = ({ selectedEvents, deleteSelectedEvent }) => (
  <Cluster gap={3} justifyContent="flex-start">
    {selectedEvents.map(e => (
      <Chip
        key={e}
        label={e}
        variant="outlined"
        onDelete={deleteSelectedEvent(e)}
      />
    ))}
  </Cluster>
);
