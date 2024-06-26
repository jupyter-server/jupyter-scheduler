import React from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useTranslator } from '../hooks';

export const ConfirmDialog = (props: {
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  dialogText: JSX.Element | string;
  dialogConfirmText: string;
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'error' | 'primary';
  pendingConfirmText?: string;
  icon?: JSX.Element;
  dialogCancelText?: JSX.Element | string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');

  const handleClose = (_: unknown, reason: string) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }

    props.onClose();
  };

  return (
    <>
      <Dialog open onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{props.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{props.dialogText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={props.onClose}>
            {props.dialogCancelText || trans.__('Cancel')}
          </Button>
          <Button
            variant="contained"
            color={props.color ? props.color : 'primary'}
            onClick={props.onConfirm}
          >
            {props.dialogConfirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
