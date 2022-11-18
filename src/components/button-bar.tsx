import React from 'react';

import { Stack } from '@mui/material';

export interface IButtonBarProps {
  children?: React.ReactNode;
}

export function ButtonBar(props: IButtonBarProps): JSX.Element {
  return (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      {props.children}
    </Stack>
  );
}
