import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import DownloadIcon from '@mui/icons-material/Download';
import StopIcon from '@mui/icons-material/Stop';
import IconButton from '@mui/material/IconButton';
import { Stack, TableCell, TableRow } from '@mui/material';

import { ConfirmDeleteIcon } from './confirm-delete-icon';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import { CommandIDs } from '..';

function StopButton(props: {
  job: Scheduler.IDescribeJob;
  clickHandler: () => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const buttonTitle = props.job.name
    ? trans.__('Stop "%1"', props.job.name)
    : trans.__('Stop job');

  return (
    <div
      style={props.job.status !== 'IN_PROGRESS' ? { visibility: 'hidden' } : {}}
    >
      <IconButton onClick={props.clickHandler} title={buttonTitle}>
        <StopIcon fontSize="small" />
      </IconButton>
    </div>
  );
}

function Timestamp(props: { job: Scheduler.IDescribeJob }): JSX.Element | null {
  const create_date: Date | null = props.job.create_time
    ? new Date(props.job.create_time)
    : null;
  const create_display_date: string | null = create_date
    ? create_date.toLocaleString()
    : null;

  return <>{create_display_date}</>;
}

function JobFiles(props: {
  job: Scheduler.IDescribeJob;
  openOnClick: (e: any, output_uri: string) => void;
}): JSX.Element | null {
  if (props.job.status !== 'COMPLETED') {
    return null;
  }

  const trans = useTranslator('jupyterlab');

  return (
    <>
      {props.job.job_files.map(
        ({ file_format, display_name, file_path = null }) => {
          return (
            file_path && (
              <a
                key={file_format}
                href={`/lab/tree/${file_path}`}
                title={trans.__('Open "%1"', file_path)}
                onClick={e => props.openOnClick(e, file_path)}
                style={{ paddingRight: '1em' }}
              >
                {display_name}
              </a>
            )
          );
        }
      )}
    </>
  );
}

type DownloadFilesButtonProps = {
  app: JupyterFrontEnd;
  job: Scheduler.IDescribeJob;
  reload: () => void;
};

function DownloadFilesButton(props: DownloadFilesButtonProps) {
  const [downloading, setDownloading] = useState(false);

  return (
    <IconButton
      aria-label="download"
      title="Download Job Files"
      disabled={downloading}
      onClick={async () => {
        setDownloading(true);
        await props.app.commands.execute(CommandIDs.downloadFiles, {
          id: props.job.job_id,
          redownload: false
        });
        await new Promise(res => setTimeout(res, 500));
        setDownloading(false);
        props.reload();
      }}
    >
      <DownloadIcon />
    </IconButton>
  );
}

export function buildJobRow(
  job: Scheduler.IDescribeJob,
  environmentList: Scheduler.IRuntimeEnvironment[],
  app: JupyterFrontEnd,
  showCreateJob: (newModel: ICreateJobModel) => void,
  deleteRow: (id: Scheduler.IDescribeJob['job_id']) => void,
  translateStatus: (status: Scheduler.Status) => string,
  showDetailView: (jobId: string) => void,
  reload: () => void
): JSX.Element {
  const cellContents: React.ReactNode[] = [
    <a onClick={() => showDetailView(job.job_id)}>{job.name}</a>,
    job.input_filename,
    <>
      {!job.downloaded && job.status === 'COMPLETED' && (
        <DownloadFilesButton app={app} job={job} reload={reload} />
      )}
      <JobFiles
        job={job}
        openOnClick={(e: Event, output_uri: string) => {
          e.preventDefault();
          app.commands.execute('docmanager:open', { path: output_uri });
        }}
      />
    </>,
    <Timestamp job={job} />,
    translateStatus(job.status),
    <Stack spacing={1} direction="row">
      <StopButton
        job={job}
        clickHandler={() =>
          app.commands.execute(CommandIDs.stopJob, {
            id: job.job_id
          })
        }
      />
      <ConfirmDeleteIcon
        name={job.name}
        clickHandler={() => {
          // optimistic delete for now, no verification on whether the delete
          // succeeded
          app.commands.execute(CommandIDs.deleteJob, {
            id: job.job_id
          });
          deleteRow(job.job_id);
        }}
      />
    </Stack>
  ];

  return (
    <TableRow key={job.job_id}>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={`${job.job_id}-${idx}`}>{cellContent}</TableCell>
      ))}
    </TableRow>
  );
}
