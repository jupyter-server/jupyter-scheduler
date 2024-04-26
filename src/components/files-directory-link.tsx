import React from 'react';
import { Scheduler } from '../handler';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { useTranslator } from '../hooks';
import { Link } from '@mui/material';

export function FilesDirectoryLink(props: {
  jobFile: Scheduler.IJobFile;
  app: JupyterFrontEnd;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  return (
    <Link
      href={`/lab/tree/${props.jobFile.file_path}`}
      title={trans.__('Open output folder in file browser')}
      onClick={e => {
        e.preventDefault();
        props.app.commands.execute('filebrowser:open-path', {
          path: props.jobFile.file_path
        });
      }}
    >
      {trans.__('Files')}
    </Link>
  );
}
