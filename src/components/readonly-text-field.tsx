import { TextField, TextFieldProps } from '@mui/material';
import React from 'react';

export const ReadonlyTextField = (props: TextFieldProps): JSX.Element => (
  <TextField
    {...props}
    variant="standard"
    InputProps={{ readOnly: true }}
    FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }}
  />
);
