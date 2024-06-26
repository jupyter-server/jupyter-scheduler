import React, { FC } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, UseControllerProps } from 'react-hook-form';
import { FormControl, FormLabel, Typography } from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

type FormInputProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
} & UseControllerProps;

export const FormInputDate: FC<FormInputProps> = ({
  name,
  control,
  label,
  placeholder,
  ...rest
}) => {
  const isRequired = rest.rules?.required || rest.rules?.validate;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={'en-us'}>
      <FormControl
        component="fieldset"
        variant="standard"
        style={{ margin: 0 }}
      >
        <FormLabel component="legend" sx={{ mb: 1 }}>
          {label}{' '}
          {isRequired ? null : (
            <Typography variant="caption">- Optional</Typography>
          )}
        </FormLabel>
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label={placeholder}
              value={value}
              disablePast
              onChange={onChange}
              sx={{
                '& fieldset': { top: 0 },
                '& legend': { display: 'none' },
                '& .MuiInputLabel-shrink': { opacity: 0 },
                '& .MuiInputLabel-root': { color: 'var(--jp-border-color0)' }
              }}
            />
          )}
        />
      </FormControl>
    </LocalizationProvider>
  );
};
