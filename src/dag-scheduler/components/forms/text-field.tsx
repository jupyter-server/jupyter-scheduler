import React, { FC } from 'react';
import { Controller, UseControllerProps } from 'react-hook-form';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { FormControl, FormLabel, Typography, styled } from '@mui/material';

type FormInputProps = TextFieldProps & UseControllerProps;

const CustomTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
  '& fieldset': { top: 0 },
  '& legend': {
    display: 'none',
    color: theme.palette.grey,
    marginBottom: theme.spacing(2)
  }
}));

// TODO: Split the props into 2 groups (one for hook-form and one for mui)
export const FormInputText: FC<FormInputProps> = ({
  name,
  label,
  control,
  required,
  helperText,
  disabled,
  placeholder,
  ...rest
}) => {
  const isRequired = rest.rules?.required || rest.rules?.validate;

  return (
    <Controller
      {...rest}
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl
          component="fieldset"
          variant="standard"
          style={{ margin: 0 }}
          disabled={disabled}
          fullWidth={rest.fullWidth}
        >
          <FormLabel component="legend" sx={{ mb: 1 }}>
            {label}{' '}
            {isRequired ? null : (
              <Typography variant="caption">- Optional</Typography>
            )}
          </FormLabel>
          <CustomTextField
            required={required}
            autoFocus
            placeholder={placeholder}
            variant="outlined"
            onChange={onChange}
            error={!!error}
            value={value}
            name={name}
            disabled={disabled}
            helperText={error?.message ?? helperText}
            {...rest}
          />
        </FormControl>
      )}
    />
  );
};
