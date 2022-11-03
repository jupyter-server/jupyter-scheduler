import React from 'react';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Link } from '@mui/material';

export interface IJobFileLinkProps {
  jobFile: Scheduler.IJobFile;
  app: JupyterFrontEnd;
  children?: React.ReactNode;
}

export function JobFileLink(props: IJobFileLinkProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  if (!props.jobFile.file_path) {
    return null;
  }

  const fileBaseName = props.jobFile.file_path.split('/').pop();

  const title =
    props.jobFile.file_format === 'input'
      ? trans.__('Open input file "%1"', fileBaseName)
      : trans.__('Open output file "%1"', fileBaseName);

  return (
    <Link
      key={props.jobFile.file_format}
      href={`/lab/tree/${props.jobFile.file_path}`}
      title={title}
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
      {props.children || props.jobFile.display_name}
    </Link>
  );
}
