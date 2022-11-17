import React from 'react';
import { useTranslator } from '../hooks';

import {
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText
} from '@mui/material';

export const InputFileSnapshot = (props: {
  inputFileSnapshot: string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');

  return (
    <FormControl sx={{ border: 'undefined' }}>
      <InputLabel htmlFor="input-file-snapshot-id">
        {trans.__('Input file snapshot')}
      </InputLabel>
      <OutlinedInput
        id="input-file-snapshot-id"
        inputProps={{ className: 'input-file-snapshot' }}
        label={trans.__('Input file snapshot')}
        value={props.inputFileSnapshot}
        aria-describedby="input-file-snapshot-helper-text"
      />
      <FormHelperText id="input-file-snapshot-helper-text">
        {trans.__(
          'Drag a file from the file browser and drop it here to update the input file snapshot'
        )}
      </FormHelperText>
    </FormControl>
  );
};
