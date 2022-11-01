import React, { useState } from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme
} from '@mui/material';
import { useTranslator } from '../hooks';

export const ConfirmDialogButton = (props: {
  onConfirm: () => Promise<void>;
  title: string;
  dialogText: string;
  dialogConfirmText: string;
  variant?: 'text' | 'contained' | 'outlined';
  errorColor?: boolean;
  pendingConfirmText?: string;
}): JSX.Element => {
  const [open, setOpen] = useState(false);

  const trans = useTranslator('jupyterlab');
  const theme = useTheme();

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
            sx={{ backgroundColor: theme.palette.grey[600] }}
            onClick={handleClose}
            autoFocus
          >
            {trans.__('Cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async _ => {
              handleClose();
              await props.onConfirm();
            }}
          >
            {props.dialogConfirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const ConfirmDialogDeleteButton = (props: {
  handleDelete: () => Promise<void>;
  title: string;
  dialogText: string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');
  return (
    <ConfirmDialogButton
      onConfirm={props.handleDelete}
      title={props.title}
      dialogText={props.dialogText}
      dialogConfirmText={trans.__('Delete')}
      pendingConfirmText={trans.__('Deleting')}
      errorColor
    />
  );
};

export const ConfirmDialogStopButton = (props: {
  handleStop: () => Promise<void>;
  title: string;
  dialogText: string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');
  return (
    <ConfirmDialogButton
      onConfirm={props.handleStop}
      title={props.title}
      dialogText={props.dialogText}
      dialogConfirmText={trans.__('Stop')}
      pendingConfirmText={trans.__('Stopping')}
      variant="outlined"
    />
  );
};
