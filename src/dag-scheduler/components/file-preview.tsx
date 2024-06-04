import React, { FC, useState } from 'react';
import { Description, Share, Visibility, Download } from '@mui/icons-material';

import {
  ListItemText,
  IconButton,
  ListItem,
  ListItemIcon
} from '@mui/material';

import { useWorkflows } from '../hooks';

type ItemProps = {
  type: string;
  fileId: string;
  fileName: string;
};

export const FilePreviewItem: FC<ItemProps> = ({ fileId, type, fileName }) => {
  const { app, api } = useWorkflows();
  const [hover, setHover] = useState(false);

  const handleOpenPreview = () => {
    if (!fileId) {
      return;
    }

    app.commands.execute('publishing:download', {
      id: fileId,
      title: fileName
    });
  };

  const handleShare = async () => {
    if (!fileId) {
      return;
    }

    const metadata = await api.getPublishedFileMeta(fileId);

    app.commands.execute('publishing:share', metadata as any);
  };

  const handleDownload = async () => {
    if (!fileId) {
      return;
    }

    app.commands.execute('workflows:saveFile', { fileId, fileName });
  };

  return (
    <ListItem
      sx={{
        px: 2,
        '&:hover': {
          borderRadius: '2px',
          backgroundColor: 'var(--jp-border-color2)'
        }
      }}
      disablePadding
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        <Description fontSize="medium" />
      </ListItemIcon>
      <ListItemText
        primary={fileName}
        secondary={type}
        primaryTypographyProps={{
          variant: 'subtitle2',
          style: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }}
      />
      {hover ? (
        <>
          <IconButton title="Preview" onClick={handleOpenPreview}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton title="Share" onClick={handleShare}>
            <Share fontSize="small" />
          </IconButton>
          <IconButton title="Download" onClick={handleDownload}>
            <Download fontSize="small" />
          </IconButton>
        </>
      ) : null}
    </ListItem>
  );
};
