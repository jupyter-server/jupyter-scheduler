import { Box, Chip, IconButton } from '@mui/material';
import React, { useState } from 'react';
import { useTranslator } from '../hooks';
import CloseIcon from '@mui/icons-material/Close';
import { AsyncButton } from './async-button';

export function ConfirmButton(props: {
  onConfirm: () => Promise<void>;
  confirmationText: string;
  icon: JSX.Element;
  name?: string | undefined;
  remainAfterConfirmation?: boolean;
  remainText?: string;
}): JSX.Element | null {
  const [clicked, setClicked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = async () => {
    try {
      if (props.remainAfterConfirmation) {
        setConfirmed(true);
      }

      await props.onConfirm();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Box sx={{ width: '6em' }}>
      {clicked ? (
        props.remainAfterConfirmation && confirmed ? (
          <Chip label={props.remainText} />
        ) : (
          <AsyncButton
            variant="contained"
            color="error"
            title={props.name}
            onClick={handleClick}
            onBlur={_ => setClicked(false)}
            style={{ visibility: clicked ? 'visible' : 'hidden' }}
          >
            {props.confirmationText}
          </AsyncButton>
        )
      ) : (
        <IconButton title={props.name} onClick={_ => setClicked(true)}>
          {props.icon}
        </IconButton>
      )}
    </Box>
  );
}

export function ConfirmDeleteButton(props: {
  clickHandler: () => Promise<void>;
  name?: string;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  const buttonTitle = props.name
    ? trans.__('Delete "%1"', props.name)
    : trans.__('Delete job');

  return (
    <ConfirmButton
      name={buttonTitle}
      onConfirm={props.clickHandler}
      confirmationText={trans.__('Delete')}
      icon={<CloseIcon fontSize="small" />}
    />
  );
}
