import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useTranslator } from '../hooks';

export const ConfirmButton = (props: {
  handleConfirm: () => Promise<void>;
  title: string;
  dialogText: string;
  dialogConfirmText: string;
  variant?: 'text' | 'contained' | 'outlined';
  errorColor?: boolean;
}): JSX.Element => {
  const [open, setOpen] = useState(false);

  const trans = useTranslator('jupyterlab');

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={props.variant ?? 'contained'}
        color={props.errorColor ? 'error' : 'primary'}
        onClick={_ => setOpen(true)}
      >
        {props.title}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{props.title}</DialogTitle>

        <DialogContent>
          <DialogContentText>{props.dialogText}</DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            //hex of var(--md-grey-600)
            sx={{ backgroundColor: '#757575' }}
            onClick={handleClose}
            autoFocus
          >
            {trans.__('Cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={_ => {
              handleClose();
              props.handleConfirm();
            }}
          >
            {props.dialogConfirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const ConfirmDeleteButton = (props: {
  handleDelete: () => Promise<void>;
  title: string;
  dialogText: string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');
  return (
    <ConfirmButton
      handleConfirm={props.handleDelete}
      title={props.title}
      dialogText={props.dialogText}
      dialogConfirmText={trans.__('Delete')}
      errorColor
    />
  );
};

export const ConfirmStopButton = (props: {
  handleStop: () => Promise<void>;
  title: string;
  dialogText: string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');
  return (
    <ConfirmButton
      handleConfirm={props.handleStop}
      title={props.title}
      dialogText={props.dialogText}
      dialogConfirmText={trans.__('Stop')}
      variant="outlined"
    />
  );
};
