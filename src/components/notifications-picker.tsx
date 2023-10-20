import React, { useState } from 'react';

import { FormControl, InputLabel, MenuItem, TextField } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { ICreateJobModel } from '../model';
import { Stack } from './stack';
import { useTranslator } from '../hooks';

export type NotificationsPickerProps = {
  notificationEvents: string[];
  id: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
};

export function NotificationsPicker(
  props: NotificationsPickerProps
): JSX.Element | null {
  if (!props.notificationEvents.length) {
    return null;
  }

  const [selectValue, setSelectValue] = useState<string>('');

  const { notificationEvents, id } = props;
  const trans = useTranslator('jupyterlab');
  const labelId = `${id}-label`;
  const label = trans.__('Notification Events');

  const handleSendToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    props.handleModelChange({ ...props.model, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    setSelectValue(e.target.value as string);
  };

  return (
    <Stack size={2}>
      <InputLabel>{trans.__('Notifications')}</InputLabel>

      <TextField
        label={trans.__('Send To')}
        value={props.model.sendTo}
        name="sendTo"
        variant="outlined"
        onChange={handleSendToChange}
      />

      <FormControl>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          id={id}
          value={selectValue}
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
