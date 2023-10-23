import React, { useState, useCallback } from 'react';

import { Cluster } from './cluster';
import {
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Switch,
  TextField
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
  const [enableNotification, setEnableNotification] = useState<boolean>(
    model.notification?.enableNotification ?? true
  );
  const sendToString = model.notification?.sendTo?.join(', ') || '';

  const enableNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedEnableNotification = e.target.checked;
    setEnableNotification(updatedEnableNotification);
    modelChange({
      ...model,
      notification: {
        ...model.notification,
        enableNotification: updatedEnableNotification
      }
    });
  };

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
      const { value } = e.target;
      const sendToArray = value.split(',').map(sendToStr => sendToStr.trim());
      const updatedNotification = {
        ...model.notification,
        sendTo: sendToArray
      };
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
      <FormControlLabel
        control={
          <Switch
            checked={enableNotification}
            onChange={enableNotificationChange}
          />
        }
        label={trans.__('Enable Notifications')}
      />

      <TextField
        label={trans.__('Send To')}
        value={sendToString}
        name="sendTo"
        variant="outlined"
        onChange={sendToChange}
        disabled={!enableNotification}
      />
      <NotificationEventsSelect
        id={id}
        availableEvents={notificationEvents.filter(
          e => !selectedEvents.includes(e)
        )}
        selectChange={selectChange}
        disabled={!enableNotification}
      />
      <SelectedEventsChips
        selectedEvents={selectedEvents}
        deleteSelectedEvent={deleteSelectedEvent}
        disabled={!enableNotification}
      />
    </Stack>
  );
}

const NotificationEventsSelect: React.FC<{
  id: string;
  availableEvents: string[];
  selectChange: (e: SelectChangeEvent<string>) => void;
  disabled: boolean;
}> = ({ id, availableEvents, selectChange, disabled }) => {
  const trans = useTranslator('jupyterlab');
  const label = trans.__('Notification Events');
  const labelId = `${id}-label`;

  return (
    <FormControl>
      <InputLabel id={labelId} disabled={disabled}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        label={label}
        onChange={selectChange}
        disabled={disabled}
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
  disabled: boolean;
}> = ({ selectedEvents, deleteSelectedEvent, disabled }) => (
  <Cluster gap={3} justifyContent="flex-start">
    {selectedEvents.map(e => (
      <Chip
        key={e}
        label={e}
        variant="outlined"
        onDelete={deleteSelectedEvent(e)}
        disabled={disabled}
      />
    ))}
  </Cluster>
);
