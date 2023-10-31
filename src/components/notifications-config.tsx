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

export function NotificationsConfig(
  props: NotificationsConfigProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    props.model.notificationsConfig?.selectedEvents || []
  );
  const [enableNotification, setEnableNotification] = useState<boolean>(
    props.model.notificationsConfig?.enableNotification ?? true
  );
  const [sendToInput, setSendToInput] = useState<string>(
    props.model.notificationsConfig?.sendTo?.join(', ') || ''
  );
  const [includeOutput, setIncludeOutput] = useState<boolean>(
    props.model.notificationsConfig?.includeOutput || false
  );

  const enableNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedEnableNotification = e.target.checked;
    setEnableNotification(updatedEnableNotification);
    props.handleModelChange({
      ...props.model,
      notificationsConfig: {
        ...props.model.notificationsConfig,
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
          notificationsConfig: {
            ...props.model.notificationsConfig,
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
      ...props.model.notificationsConfig,
      sendTo: emailArray
    };
    props.handleModelChange({
      ...props.model,
      notificationsConfig: updatedNotification
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
      notificationsConfig: {
        ...props.model.notificationsConfig,
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
          ...props.model.notificationsConfig,
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
        value={props.notificationEvents.filter(
          e => !selectedEvents.includes(e)
        )}
        onChange={selectChange}
        disabled={!enableNotification}
      />
      <SelectedEventsChips
        value={selectedEvents}
        onChange={deleteSelectedEvent}
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

type NotificationEventsSelectProps = {
  id: string;
  value: string[];
  onChange: (e: SelectChangeEvent<string>) => void;
  disabled: boolean;
};

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
        onChange={props.onChange}
        disabled={props.disabled}
      >
        {props.value.map(e => (
          <MenuItem key={e} value={e}>
            {e}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

type SelectedEventsChipsProps = {
  value: string[];
  onChange: (eventToDelete: string) => () => void;
  disabled: boolean;
};

function SelectedEventsChips(props: SelectedEventsChipsProps) {
  return (
    <Cluster gap={3} justifyContent="flex-start">
      {props.value.map(e => (
        <Chip
          key={e}
          label={e}
          variant="outlined"
          onDelete={props.onChange(e)}
          disabled={props.disabled}
        />
      ))}
    </Cluster>
  );
}