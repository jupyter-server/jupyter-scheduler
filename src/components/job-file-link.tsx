import React from 'react';

import { Scheduler } from '../handler';
import { useEventLogger, useTranslator } from '../hooks';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Link } from '@mui/material';
import { FilesDirectoryLink } from './files-directory-link';

export interface IJobFileLinkProps {
  jobFile: Scheduler.IJobFile;
  app: JupyterFrontEnd;
  children?: React.ReactNode;
  parentComponentName?: string;
}

export function JobFileLink(props: IJobFileLinkProps): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  if (!props.jobFile.file_path) {
    return null;
  }

  const log = useEventLogger();

  const fileBaseName = props.jobFile.file_path.split('/').pop();

  const title =
    props.jobFile.file_format === 'input'
      ? trans.__('Open input file "%1"', fileBaseName)
      : trans.__('Open output file "%1"', fileBaseName);

  if (props.jobFile.file_format === 'files') {
    return <FilesDirectoryLink jobFile={props.jobFile} app={props.app} />;
  }
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
        if (props.parentComponentName) {
          log(
            `${props.parentComponentName}.${
              props.jobFile.file_format === 'input'
                ? 'open-input-file'
                : 'open-output-file'
            }`
          );
        }
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
