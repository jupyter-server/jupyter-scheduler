import React, { FC, useState, useRef } from 'react';
import { Close, MoreHoriz } from '@mui/icons-material';

import {
  Popper,
  Paper,
  Grow,
  IconButton,
  ClickAwayListener,
  Box,
  Stack,
  Tooltip,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { JsonEditor } from './json-editor';

type ViewParametersProps = {
  values: { label: string; value: string }[];
};

const arrowStyle = {
  position: 'absolute',
  height: '1em',
  width: '0.71em',
  boxSizing: 'border-box',
  right: 0,
  top: '-2px !important',
  marginRight: '-0.71em',
  overflow: 'hidden',
  color: 'var(--jp-layout-color0)',

  '&::before': {
    content: '""',
    margin: 'auto',
    display: 'block',
    width: '100%',
    height: '100%',
    transformOrigin: '0 0',
    transform: 'rotate(45deg)',
    boxShadow: 'var(--jp-elevation-z2)',
    backgroundColor: 'currentColor'
  }
};

export const ViewParameters: FC<ViewParametersProps> = props => {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [arrowRef, setArrowRef] = useState<HTMLElement | null>(null);
  const [size] = useState({ width: 500, height: 300 });

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
    <Box position="relative">
      <Tooltip title="Click to open Parameters" placement="right">
        <IconButton aria-haspopup="menu" onClick={handleToggle} ref={anchorRef}>
          <MoreHoriz />
        </IconButton>
      </Tooltip>
      <Popper
        open={open}
        transition
        role={undefined}
        placement="left-end"
        disablePortal={false}
        anchorEl={anchorRef.current}
        modifiers={[
          {
            name: 'flip',
            enabled: true,
            options: {
              altBoundary: true,
              rootBoundary: 'document',
              padding: 8
            }
          },
          {
            name: 'preventOverflow',
            enabled: false,
            options: {
              altAxis: true,
              altBoundary: false,
              tether: true,
              rootBoundary: 'viewport',
              padding: 8
            }
          },
          {
            name: 'arrow',
            options: {
              enabled: true,
              element: arrowRef
            }
          }
        ]}
        sx={{ zIndex: theme.zIndex.drawer + 1 }}
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
                <Paper
                  className="properties-viewer"
                  style={{ overflow: 'auto' }}
                >
                  <Box component="span" sx={arrowStyle} ref={setArrowRef} />
                  <Box sx={{ pb: 3, px: 3 }}>
                    <Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Tabs value={index} sx={{ mb: '1px' }}>
                          {props.values.map((v, i) => (
                            <Tab
                              value={i}
                              key={v.label}
                              label={v.label}
                              onClick={() => setIndex(i)}
                            />
                          ))}
                        </Tabs>
                        <IconButton
                          size="small"
                          onClick={handleToggle}
                          sx={{ alignSelf: 'center' }}
                        >
                          <Close />
                        </IconButton>
                      </Stack>
                      <JsonEditor
                        readOnly
                        key={index}
                        width={size.width}
                        height={size.height}
                        initialValue={props.values[index]?.value || ''}
                      />
                    </Stack>
                  </Box>
                </Paper>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};
