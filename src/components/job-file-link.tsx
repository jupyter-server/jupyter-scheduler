import React from 'react';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Link } from '@mui/material';

export interface IJobFileLinkProps {
  jobFile: Scheduler.IJobFile;
  app: JupyterFrontEnd;
}

export function JobFileLink(props: IJobFileLinkProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  return (
    <Link
      key={props.jobFile.file_format}
      href={`/lab/tree/${props.jobFile.file_path}`}
      title={trans.__('Open "%1"', props.jobFile.file_path)}
      onClick={(
        e:
          | React.MouseEvent<HTMLSpanElement, MouseEvent>
          | React.MouseEvent<HTMLAnchorElement, MouseEvent>
      ) => {
        e.preventDefault();
        props.app.commands.execute('docmanager:open', {
          path: props.jobFile.file_path
        });
      }}
      style={{ paddingRight: '1em' }}
    >
      {props.jobFile.display_name}
    </Link>
  );
}
