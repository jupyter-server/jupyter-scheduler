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

type NotificationsConfigProps = {
  notificationEvents: string[];
  id: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
};

type NotificationEventsSelectProps = {
  id: string;
  availableEvents: string[];
  selectChange: (e: SelectChangeEvent<string>) => void;
  disabled: boolean;
};

type SelectedEventsChipsProps = {
  selectedEvents: string[];
  deleteSelectedEvent: (eventToDelete: string) => () => void;
  disabled: boolean;
};

export function NotificationsConfig(
  props: NotificationsConfigProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    props.model.notificationsSettings?.selectedEvents || []
  );
  const [enableNotification, setEnableNotification] = useState<boolean>(
    props.model.notificationsSettings?.enableNotification ?? true
  );
  const [sendToInput, setSendToInput] = useState<string>(
    props.model.notificationsSettings?.sendTo?.join(', ') || ''
  );
  const [includeOutput, setIncludeOutput] = useState<boolean>(
    props.model.notificationsSettings?.includeOutput || false
  );

  const enableNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedEnableNotification = e.target.checked;
    setEnableNotification(updatedEnableNotification);
    props.handleModelChange({
      ...props.model,
      notificationsSettings: {
        ...props.model.notificationsSettings,
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
        props.handleModelChange({
          ...props.model,
          notificationsSettings: {
            ...props.model.notificationsSettings,
            selectedEvents: updatedEvents
          }
        });
      }
    },
    [selectedEvents, props.model, props.handleModelChange]
  );

  const sendToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSendToInput(e.target.value);
  }, []);

  const blur = useCallback(() => {
    const emailArray = sendToInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
    const updatedNotification = {
      ...props.model.notificationsSettings,
      sendTo: emailArray
    };
    props.handleModelChange({
      ...props.model,
      notificationsSettings: updatedNotification
    });
  }, [sendToInput, props.model, props.handleModelChange]);

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
    props.handleModelChange({
      ...props.model,
      notificationsSettings: {
        ...props.model.notificationsSettings,
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
      props.handleModelChange({
        ...props.model,
        notifications: {
          ...props.model.notificationsSettings,
          selectedEvents: updatedEvents
        }
      });
    },
    [selectedEvents, props.model, props.handleModelChange]
  );

  if (!props.notificationEvents.length) {
    return null;
  }

  return (
    <Stack size={2}>
      <InputLabel>{trans.__('Notifications Settings')}</InputLabel>
      <FormControlLabel
        control={
          <Switch
            checked={enableNotification}
            onChange={enableNotificationChange}
          />
        }
        label={trans.__('Enable notifications')}
      />
      <TextField
        label={trans.__('Send to')}
        value={sendToInput}
        name="sendTo"
        variant="outlined"
        onChange={sendToChange}
        onBlur={blur}
        onKeyDown={keyDown}
        disabled={!enableNotification}
      />
      <NotificationEventsSelect
        id={props.id}
        availableEvents={props.notificationEvents.filter(
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
        label={trans.__('Include output')}
      />
    </Stack>
  );
}

function NotificationEventsSelect(props: NotificationEventsSelectProps) {
  const trans = useTranslator('jupyterlab');
  const label = trans.__('Notification Events');
  const labelId = `${props.id}-label`;

  return (
    <FormControl>
      <InputLabel id={labelId} disabled={props.disabled}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={props.id}
        label={label}
        onChange={props.selectChange}
        disabled={props.disabled}
      >
        {props.availableEvents.map(e => (
          <MenuItem key={e} value={e}>
            {e}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function SelectedEventsChips(props: SelectedEventsChipsProps) {
  return (
    <Cluster gap={3} justifyContent="flex-start">
      {props.selectedEvents.map(e => (
        <Chip
          key={e}
          label={e}
          variant="outlined"
          onDelete={props.deleteSelectedEvent(e)}
          disabled={props.disabled}
        />
      ))}
    </Cluster>
  );
}
