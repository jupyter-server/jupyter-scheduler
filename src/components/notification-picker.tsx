import React, { useCallback, useState } from 'react';

import { Cluster } from './cluster';
import {
  Checkbox,
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
  const [sendToInput, setSendToInput] = useState<string>(
    model.notification?.sendTo?.join(', ') || ''
  );
  const [includeOutput, setIncludeOutput] = useState<boolean>(
    model.notification?.includeOutput || false
  );

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

  const sendToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSendToInput(e.target.value);
  }, []);

  const blur = useCallback(() => {
    const emailArray = sendToInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
    const updatedNotification = { ...model.notification, sendTo: emailArray };
    modelChange({ ...model, notification: updatedNotification });
  }, [sendToInput, model, modelChange]);

  const keyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        blur();
      }
    },
    [blur]
  );

  const includeOutputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = event.target.checked;
    setIncludeOutput(updatedValue);
    modelChange({
      ...model,
      notification: {
        ...model.notification,
        includeOutput: updatedValue
      }
    });
  };

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
      <InputLabel>{trans.__('Notification')}</InputLabel>
      <FormControlLabel
        control={
          <Switch
            checked={enableNotification}
            onChange={enableNotificationChange}
          />
        }
        label={trans.__('Enable Notification')}
      />
      <TextField
        label={trans.__('Send To')}
        value={sendToInput}
        name="sendTo"
        variant="outlined"
        onChange={sendToChange}
        onBlur={blur}
        onKeyDown={keyDown}
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
      <FormControlLabel
        control={
          <Checkbox
            checked={includeOutput}
            onChange={includeOutputChange}
            disabled={!enableNotification}
          />
        }
        label={trans.__('Include Output')}
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
