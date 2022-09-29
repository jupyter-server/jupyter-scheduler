import React from 'react';

import { addIcon, closeIcon } from '@jupyterlab/ui-components';
import { IconButton } from '@mui/material';

export interface IDeleteButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  title: string;
}

// Exaggerate horizontal padding to make the button circular, not oblate
const extraHorizontalPadding = { px: '12.5px', py: '8px' };

export function DeleteButton(props: IDeleteButtonProps): JSX.Element {
  return (
    <IconButton
      aria-label="delete"
      onClick={props.onClick}
      title={props.title}
      sx={extraHorizontalPadding}
    >
      <closeIcon.react />
    </IconButton>
  );
}

export function AddButton(props: IDeleteButtonProps): JSX.Element {
  return (
    <IconButton
      onClick={props.onClick}
      title={props.title}
      sx={extraHorizontalPadding}
    >
      <addIcon.react />
    </IconButton>
  );
}
