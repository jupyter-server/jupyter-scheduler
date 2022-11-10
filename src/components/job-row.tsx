import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ConfirmDeleteButton, ConfirmButton } from './confirm-buttons';
import { JobFileLink } from './job-file-link';
import { CommandIDs } from '..';
import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import DownloadIcon from '@mui/icons-material/Download';
import StopIcon from '@mui/icons-material/Stop';
import { IconButton, Stack, Link, TableCell, TableRow } from '@mui/material';

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
      <ConfirmButton
        name={buttonTitle}
        onConfirm={props.clickHandler}
        confirmationText={trans.__('Stop')}
        icon={<StopIcon fontSize="small" />}
        remainAfterConfirmation
        remainText={trans.__('Stopping')}
      />
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
  app: JupyterFrontEnd;
}): JSX.Element | null {
  if (!(props.job.status === 'COMPLETED' || props.job.status === 'FAILED')) {
    return null;
  }

  return (
    <>
      {props.job.job_files
        .filter(jobFile => jobFile.file_format !== 'input' && jobFile.file_path)
        .map(jobFile => (
          <JobFileLink jobFile={jobFile} app={props.app} />
        ))}
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
  const trans = useTranslator('jupyterlab');

  return (
    <IconButton
      aria-label="download"
      title={trans.__('Download Job Files')}
      disabled={downloading}
      onClick={async () => {
        setDownloading(true);
        await props.app.commands.execute(CommandIDs.downloadFiles, {
          id: props.job.job_id,
          redownload: false
        });
        await new Promise(res => setTimeout(res, 5000));
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
  const inputFile = job.job_files.find(
    jobFile => jobFile.file_format === 'input' && jobFile.file_path
  );
  const trans = useTranslator('jupyterlab');

  const cellContents: React.ReactNode[] = [
    <Link
      onClick={() => showDetailView(job.job_id)}
      title={trans.__('Open detail view for "%1"', job.name)}
    >
      {job.name}
    </Link>,
    inputFile ? (
      <JobFileLink app={app} jobFile={inputFile}>
        {job.input_filename}
      </JobFileLink>
    ) : (
      job.input_filename
    ),
    <>
      {!job.downloaded &&
        (job.status === 'COMPLETED' || job.status === 'FAILED') && (
          <DownloadFilesButton app={app} job={job} reload={reload} />
        )}
      <JobFiles job={job} app={app} />
    </>,
    <Timestamp job={job} />,
    translateStatus(job.status),
    <Stack spacing={1} direction="row">
      <ConfirmDeleteButton
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
      <StopButton
        job={job}
        clickHandler={() =>
          app.commands.execute(CommandIDs.stopJob, {
            id: job.job_id
          })
        }
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
