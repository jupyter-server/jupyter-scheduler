import { Box, Button, Chip, IconButton, SvgIconTypeMap } from '@mui/material';
import React, { useState } from 'react';
import { useTranslator } from '../hooks';
import CloseIcon from '@mui/icons-material/Close';
import { OverridableComponent } from '@mui/material/OverridableComponent';

export function ConfirmButton(props: {
  onConfirm: () => void;
  confirmationText: string;
  icon:
    | JSX.Element
    | (OverridableComponent<SvgIconTypeMap<unknown, 'svg'>> & {
        muiName: string;
      });
  name?: string | undefined;
  remainAfterConfirmation?: boolean;
  remainText?: string;
}): JSX.Element | null {
  const [clicked, setClicked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Box sx={{ width: '6em' }}>
      {clicked ? (
        props.remainAfterConfirmation && confirmed ? (
          <Chip label={props.remainText} />
        ) : (
          <Button
            variant="contained"
            color="error"
            title={props.name}
            onClick={_ => {
              props.onConfirm();
              if (props.remainAfterConfirmation) {
                setConfirmed(true);
              }
            }}
            onBlur={_ => setClicked(false)}
            style={{ visibility: clicked ? 'visible' : 'hidden' }}
            autoFocus
          >
            {props.confirmationText}
          </Button>
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
  clickHandler: () => void;
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
