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
      'The scheduled job will have access to all files under %1',
      inputFolder
    );
  } else {
    helperText = trans.__(
      "The scheduled job will have access to all files under input file's folder"
    );
  }

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox onChange={props.onChange} name={'packageInputFolder'} />
        }
        label={trans.__('Run job with input folder')}
        aria-describedby="jp-package-input-folder-helper-text"
      />
      <FormHelperText id="jp-package-input-folder-helper-text">
        {helperText}
      </FormHelperText>
    </FormGroup>
  );
}
