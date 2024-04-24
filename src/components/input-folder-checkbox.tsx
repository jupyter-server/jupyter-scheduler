import React, { ChangeEvent } from 'react';
import { useTranslator } from '../hooks';

import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText
} from '@mui/material';

export function PackageInputFolderControl(props: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputFile: string;
}): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const inputFilePath = props.inputFile.split('/');
  inputFilePath.pop();

  let helperText: string;
  if (inputFilePath.length) {
    const inputFolder = `/${inputFilePath.join('/')}`;
    helperText = trans.__(
      'Make all files under %1 available to input file when this job runs',
      inputFolder
    );
  } else {
    helperText = trans.__(
      'Make all files under input file’s folder available to input file when this job runs'
    );
  }

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox onChange={props.onChange} name={'packageInputFolder'} />
        }
        label={trans.__('Package input folder')}
        aria-describedby="jp-package-input-folder-helper-text"
      />
      <FormHelperText id="jp-package-input-folder-helper-text">
        {helperText}
      </FormHelperText>
    </FormGroup>
  );
}
