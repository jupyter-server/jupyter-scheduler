import React, { FC } from 'react';

import { Chip, ChipProps, Theme } from '@mui/material';

import { darken, lighten, useTheme } from '@mui/system';

type ColorProps = Exclude<ChipProps['color'], undefined>;

type BadgeChipProps = {
  label: string;
  color: ColorProps;
};

export const BadgeChip: FC<BadgeChipProps> = ({ label, color }) => {
  const theme: Theme = useTheme();
  const contrastFunc = theme.palette.mode === 'light' ? lighten : darken;

  const colotMap: Record<ColorProps, string> = {
    info: theme.palette.info.light,
    success: theme.palette.success.light,
    warning: theme.palette.warning.light,
    error: theme.palette.error.light,
    default: theme.palette.grey[400],
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.light
  };

  return (
    <Chip
      size="small"
      sx={{
        '&.MuiChip-root': {
          height: 20
        },
        fontSize: 10,
        fontWeight: 500,
        borderRadius: 2,
        textTransform: 'uppercase',
        borderColor: contrastFunc(colotMap[color], 0.6),
        backgroundColor: contrastFunc(colotMap[color], 0.9)
      }}
      label={label}
      color={color}
      variant="outlined"
    />
  );
};
