import React, { FC, useState, useRef } from 'react';
import { ArrowOutward } from '@mui/icons-material';

import {
  MenuList,
  MenuItem,
  Popper,
  Paper,
  Grow,
  ClickAwayListener,
  ListItemText,
  IconButton
} from '@mui/material';

type ExternalLinksProps<
  T = { label: string; url: string; description: string }
> = {
  label: string;
  options: T[];
};

export const ExternalLinks: FC<ExternalLinksProps> = ({ options }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<any>(null);

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle}>
        <ArrowOutward fontSize="small" />
      </IconButton>
      <Popper
        sx={{
          zIndex: 1
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom'
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList component="div" onClick={() => setOpen(false)}>
                  {options.map(option => (
                    <MenuItem
                      key={option.label}
                      component="a"
                      href={option.url}
                      target="_blank"
                      title={option.description}
                    >
                      <ListItemText
                        primary={option.label}
                        style={{ padding: '0 1em' }}
                      />
                      <ArrowOutward />
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
