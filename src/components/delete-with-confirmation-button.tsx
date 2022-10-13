import React from 'react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

export const DeleteWithConfirmationButton = (props: {
  handleDelete: () => Promise<void>;
  title: string;
  text?: string;
}): JSX.Element => {
  const [open, setOpen] = React.useState(false);

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
            variant="outlined"
            onClick={_ => {
              handleClose();
              props.handleDelete();
            }}
          >
            Yes
          </Button>
          <Button variant="outlined" onClick={handleClose}>
            No
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
