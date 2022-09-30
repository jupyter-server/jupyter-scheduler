import React from 'react';

import { addIcon, closeIcon } from '@jupyterlab/ui-components';
import { IconButton } from '@mui/material';

export interface IIconButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  title: string;
  addedStyle?: React.CSSProperties;
}

// Avoid extra vertical padding to force icon to be a square inside a circle
const zeroLineHeight = { lineHeight: 0 };

export function DeleteButton(props: IIconButtonProps): JSX.Element {
  return (
    <IconButton
      aria-label="delete"
      onClick={props.onClick}
      title={props.title}
      sx={{ ...zeroLineHeight, ...props.addedStyle }}
    >
      <closeIcon.react />
    </IconButton>
  );
}

export function AddButton(props: IIconButtonProps): JSX.Element {
  return (
    <IconButton
      onClick={props.onClick}
      title={props.title}
      sx={{ ...zeroLineHeight, ...props.addedStyle }}
    >
      <addIcon.react />
    </IconButton>
  );
}
