import React, { ChangeEvent } from 'react';

import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

export function PackageInputFolderControl(props: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}): JSX.Element {
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox onChange={props.onChange} name={'packageInputFolder'} />
        }
        label="Package input folder"
      />
    </FormGroup>
  );
}
