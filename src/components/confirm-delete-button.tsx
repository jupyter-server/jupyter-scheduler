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

export const ConfirmDeleteButton = (props: {
  handleDelete: () => Promise<void>;
  title: string;
  text?: string;
}): JSX.Element => {
  const [open, setOpen] = React.useState(false);

  const trans = useTranslator('jupyterlab');

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button variant="contained" color="error" onClick={_ => setOpen(true)}>
        {props.title}
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{props.title}</DialogTitle>
        {props.text && (
          <DialogContent>
            <DialogContentText>{props.text}</DialogContentText>
          </DialogContent>
        )}
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
              props.handleDelete();
            }}
          >
            {trans.__('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
