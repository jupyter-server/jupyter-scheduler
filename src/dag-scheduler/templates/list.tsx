import React, { FC, ReactNode } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SxProps,
  Theme,
  Typography
} from '@mui/material';

type Props = {
  items: { label: string; icon?: ReactNode; value: ReactNode }[];
};

const textStyle: SxProps<Theme> = {
  textOverflow: 'ellipsis',
  color: 'text.primary',
  variant: 'body1',
  component: 'div'
};

export const ListTemplate: FC<Props> = ({ items: itemProps }) => {
  return (
    <List disablePadding>
      {itemProps.map(field => (
        <ListItem
          key={field.label}
          alignItems="flex-start"
          sx={{ py: 1, px: 0, mt: field.icon ? 4 : 0 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {field.icon ? field.icon : null}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                color="text.secondary"
                marginBottom={1}
                variant="body2"
              >
                {field.label}
              </Typography>
            }
            secondary={field.value || '-'}
            secondaryTypographyProps={textStyle}
          />
        </ListItem>
      ))}
    </List>
  );
};
