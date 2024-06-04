import React, { FC } from 'react';
import { Box, Stack, SxProps, Theme } from '@mui/material';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

type Props = {
  LeftPanel: JSX.Element;
  RightPanel: JSX.Element;
  panelWidth: number;
  showRightPanel?: boolean;
};

const style: SxProps<Theme> = {
  margin: 0,
  height: '100%',
  padding: '0 12px',
  overflow: 'hidden',
  position: 'relative'
};

export const SplitViewTemplate: FC<Props> = ({
  LeftPanel,
  RightPanel,
  panelWidth = 0
}) => {
  return (
    <Stack sx={{ pb: 4, height: '100%', overflow: 'scroll' }}>
      <Box sx={style}>
        <Stack direction="row" spacing={2} height="100%" overflow="hidden">
          <PanelGroup direction="horizontal" key={panelWidth}>
            <Panel minSize={65} defaultSize={65}>
              {LeftPanel}
            </Panel>
            <PanelResizeHandle style={{ display: 'flex' }}>
              <Box
                style={{
                  width: '4px',
                  height: '40px',
                  margin: 'auto 8px',
                  borderRadius: '12px',
                  background: 'var(--jp-border-color2)'
                }}
              />
            </PanelResizeHandle>
            <Panel
              collapsible
              minSize={15}
              maxSize={35}
              collapsedSize={0}
              defaultSize={panelWidth}
              style={{ position: 'relative' }}
            >
              {RightPanel}
            </Panel>
          </PanelGroup>
        </Stack>
      </Box>
    </Stack>
  );
};
