import React, { ChangeEvent } from 'react';

import { Box, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

export function PackageInputFolderControl(props: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputFile: string;
}): JSX.Element {
  const inputFilePath = props.inputFile.split('/');
  inputFilePath.pop();
  const inputFolder = inputFilePath.join('/');
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox onChange={props.onChange} name={'packageInputFolder'} />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            <span>Include all files under</span>
            <FolderIcon fontSize="small" sx={{ color: 'action.active' }} />
            <span>/</span>
            <span>{inputFolder}</span>
          </Box>
        }
      />
    </FormGroup>
  );
}
