import React, { FC } from 'react';
import { Stack, SxProps, Theme } from '@mui/material';

type Props = {
  HeaderComponent: JSX.Element;
  ContentComponent: JSX.Element;
};

const style: SxProps<Theme> = {
  py: 4,
  px: 6,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between'
};

export const SidePanelTemplate: FC<Props> = ({
  HeaderComponent,
  ContentComponent
}) => {
  return (
    <Stack overflow="hidden" height="100%">
      <Stack sx={style}>{HeaderComponent}</Stack>
      <Stack
        className="scroll-shadow"
        sx={{ px: 6, flex: 1, overflow: 'scroll' }}
      >
        {ContentComponent}
      </Stack>
    </Stack>
  );
};
