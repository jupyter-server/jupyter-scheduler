import { Box, Button, IconButton } from '@mui/material';
import React, { useState } from 'react';
import { useTranslator } from '../hooks';
import CloseIcon from '@mui/icons-material/Close';

export function DeleteWithConfirmationIcon(props: {
  name: string | undefined;
  clickHandler: () => void;
}): JSX.Element | null {
  const [clicked, setClicked] = useState(false);

  const trans = useTranslator('jupyterlab');

  const buttonTitle = props.name
    ? trans.__('Delete "%1"', props.name)
    : trans.__('Delete job');

  return (
    <Box sx={{ width: '6em' }}>
      {clicked ? (
        <Button
          variant="contained"
          color="error"
          title={buttonTitle}
          onClick={props.clickHandler}
          onBlur={_ => setClicked(false)}
          style={{ visibility: clicked ? 'visible' : 'hidden' }}
          autoFocus
        >
          {trans.__('Delete')}
        </Button>
      ) : (
        <IconButton title={buttonTitle} onClick={_ => setClicked(true)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
