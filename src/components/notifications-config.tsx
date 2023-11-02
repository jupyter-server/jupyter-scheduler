import React, { useState } from 'react';

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
import { NotificationsConfigModel } from '../model';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Stack } from './stack';
import { useTranslator } from '../hooks';

type NotificationsConfigProps = {
  notificationEvents: string[];
  id: string;
  notificationsConfig: NotificationsConfigModel;
  notificationsConfigChange: (
    newConfig: Partial<NotificationsConfigModel>
  ) => void;
};

export function NotificationsConfig(
  props: NotificationsConfigProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const [sendToInput, setSendToInput] = useState<string>(
    props.notificationsConfig.sendTo?.join(', ') ?? ''
  );

  function enableNotificationChange(e: React.ChangeEvent<HTMLInputElement>) {
    props.notificationsConfigChange({
      ...props.notificationsConfig,
      enableNotification: e.target.checked
    });
  }

  function selectChange(e: SelectChangeEvent<string>) {
    const newEvent = e.target.value;
    if (!props.notificationsConfig.selectedEvents?.includes(newEvent)) {
      const updatedEvents = [
        ...(props.notificationsConfig.selectedEvents ?? []),
        newEvent
      ];
      props.notificationsConfigChange({
        ...props.notificationsConfig,
        selectedEvents: updatedEvents
      });
    }
  }

  function sendToChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSendToInput(e.target.value);
  }

  function blur() {
    const sendToArray = sendToInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
    props.notificationsConfigChange({
      ...props.notificationsConfig,
      sendTo: sendToArray
    });
  }

  function keyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      blur();
    }
  }

  function includeOutputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const updatedValue = event.target.checked;
    props.notificationsConfigChange({
      ...props.notificationsConfig,
      includeOutput: updatedValue
    });
  }

  function deleteSelectedEvent(eventToDelete: string) {
    const updatedEvents = props.notificationsConfig.selectedEvents?.filter(
      event => event !== eventToDelete
    );

    props.notificationsConfigChange({
      ...props.notificationsConfig,
      selectedEvents: updatedEvents
    });
  }

  if (!props.notificationEvents.length) {
    return null;
  }

  return (
    <Stack size={2}>
      <InputLabel>{trans.__('Notifications Settings')}</InputLabel>
      <FormControlLabel
        control={
          <Switch
            checked={props.notificationsConfig.enableNotification ?? true}
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
        disabled={!props.notificationsConfig.enableNotification}
      />
      <NotificationEventsSelect
        id={props.id}
        value={props.notificationEvents.filter(
          e => !props.notificationsConfig.selectedEvents?.includes(e)
        )}
        onChange={selectChange}
        disabled={!props.notificationsConfig.enableNotification}
      />
      <SelectedEventsChips
        value={props.notificationsConfig.selectedEvents ?? []}
        onChange={deleteSelectedEvent}
        disabled={!props.notificationsConfig.enableNotification}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={props.notificationsConfig.includeOutput}
            onChange={includeOutputChange}
            disabled={!props.notificationsConfig.enableNotification}
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
  onChange: (eventToDelete: string) => void;
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
          onDelete={() => props.onChange(e)}
          disabled={props.disabled}
        />
      ))}
    </Cluster>
  );
}
