import React from 'react';

import { addIcon, closeIcon } from '@jupyterlab/ui-components';
import { IconButton } from '@mui/material';

export interface IDeleteButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  title: string;
}

// Avoid extra vertical padding to force icon to be a square inside a circle
const zeroLineHeight = { lineHeight: 0 };

export function DeleteButton(props: IDeleteButtonProps): JSX.Element {
  return (
    <IconButton
      aria-label="delete"
      onClick={props.onClick}
      title={props.title}
      sx={zeroLineHeight}
    >
      <closeIcon.react />
    </IconButton>
  );
}

export function AddButton(props: IDeleteButtonProps): JSX.Element {
  return (
    <IconButton onClick={props.onClick} title={props.title} sx={zeroLineHeight}>
      <addIcon.react />
    </IconButton>
  );
}
