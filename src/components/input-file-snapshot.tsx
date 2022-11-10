import React from 'react';
import { useTranslator } from '../hooks';

import {
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText
} from '@mui/material';

export const InputFileSnapshot = (props: { name: string }): JSX.Element => {
  const trans = useTranslator('jupyterlab');

  return (
    <FormControl sx={{ border: 'undefined' }}>
      <InputLabel htmlFor="input-file-snapshot-id">
        Input file snapshot
      </InputLabel>
      <OutlinedInput
        id="input-file-snapshot-id"
        inputProps={{ className: 'input-file-snapshot' }}
        label={trans.__('Input file snapshot')}
        onChange={e =>
          alert(`Input file snapshot value changed to ${e.target.value}`)
        }
        value={props.name}
        aria-describedby="input-file-snapshot-helper-text"
      />
      <FormHelperText id="input-file-snapshot-helper-text">
        {trans.__(
          'Drag the file from file browser and drop it into this field to update input file snapshot'
        )}
      </FormHelperText>
    </FormControl>
  );
};
