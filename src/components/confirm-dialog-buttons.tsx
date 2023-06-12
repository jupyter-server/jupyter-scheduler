import React, { useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  SvgIconTypeMap,
  IconButton
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

import { useTranslator } from '../hooks';

export const ConfirmDialogButton = (props: {
  onConfirm: () => Promise<void>;
  title: string;
  dialogText: string;
  dialogConfirmText: string;
  icon?:
    | JSX.Element
    | (OverridableComponent<SvgIconTypeMap<unknown, 'svg'>> & {
        muiName: string;
      });

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

  // Trigger with either an icon or a button.
  const trigger = props.icon ? (
    <IconButton title={props.title} onClick={_ => setOpen(true)}>
      {props.icon}
    </IconButton>
  ) : (
    <Button
      variant={props.variant ?? 'contained'}
      color={props.errorColor ? 'error' : 'primary'}
      onClick={_ => setOpen(true)}
    >
      {props.title}
    </Button>
  );

  return (
    <>
      {trigger}
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

export const ConfirmDialogDeleteIconButton = (props: {
  handleDelete: () => Promise<void>;
  title: string;
  dialogText: string;
}): JSX.Element => {
  const trans = useTranslator('jupyterlab');
  return (
    <ConfirmDialogButton
      onConfirm={props.handleDelete}
      icon={<CloseIcon fontSize="small" />}
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
