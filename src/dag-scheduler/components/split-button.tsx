import React, { FC, useState, useRef } from 'react';
import { ArrowDropDown } from '@mui/icons-material';

import {
  MenuList,
  Popper,
  Paper,
  Grow,
  ButtonGroup,
  ClickAwayListener,
  Button,
  useTheme
} from '@mui/material';

type SplitButtonProps = {
  defaultAction: JSX.Element;
  children: JSX.Element[];
};

export const SplitButton: FC<SplitButtonProps> = props => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const anchorRef = useRef<HTMLDivElement>(null);

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
      <ButtonGroup size="small" ref={anchorRef}>
        {props.defaultAction}
        <Button variant="contained" aria-haspopup="menu" onClick={handleToggle}>
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: theme.zIndex.drawer + 1
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        placement="bottom-end"
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
                  {props.children}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};
