import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ConfirmDeleteButton, ConfirmButton } from './confirm-buttons';
import { JobFileLink } from './job-file-link';
import { CommandIDs } from '..';
import { Scheduler } from '../handler';
import { useEventLogger, useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import DownloadIcon from '@mui/icons-material/Download';
import StopIcon from '@mui/icons-material/Stop';
import { IconButton, Stack, Link, TableCell, TableRow } from '@mui/material';
import { getErrorMessage } from '../util/errors';

function StopButton(props: {
  job: Scheduler.IDescribeJob;
  clickHandler: () => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const log = useEventLogger();
  const buttonTitle = props.job.name
    ? trans.__('Stop "%1"', props.job.name)
    : trans.__('Stop job');

  return (
    <div
      style={props.job.status !== 'IN_PROGRESS' ? { visibility: 'hidden' } : {}}
    >
      <ConfirmButton
        name={buttonTitle}
        onConfirm={() => {
          log('job-list.stop-confirm');
          props.clickHandler();
        }}
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
          <JobFileLink
            jobFile={jobFile}
            app={props.app}
            parentComponentName="jobs-list"
          />
        ))}
    </>
  );
}

function FilesDirectoryLink(props: {
  job: Scheduler.IDescribeJob;
  app: JupyterFrontEnd;
}): JSX.Element | null {
  if (!props.job.package_input_folder || !props.job.output_folder) {
    return null;
  }
  const trans = useTranslator('jupyterlab');
  return (
    <Link
      href={`/lab/tree/${props.job.output_folder}`}
      title={trans.__(
        'Open output directory with files for "%1"',
        props.job.name
      )}
      onClick={e => {
        e.preventDefault();
        props.app.commands.execute('filebrowser:open-path', {
          path: props.job.output_folder
        });
      }}
    >
      {trans.__('Files')}
    </Link>
  );
}

type DownloadFilesButtonProps = {
  app: JupyterFrontEnd;
  job: Scheduler.IDescribeJob;
  reload: () => void;
  setDisplayError: (message: React.ReactNode) => void;
};

function DownloadFilesButton(props: DownloadFilesButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const trans = useTranslator('jupyterlab');
  const log = useEventLogger();

  return (
    <IconButton
      aria-label="download"
      title={trans.__('Download output files for "%1"', props.job.name)}
      disabled={downloading}
      onClick={async () => {
        setDownloading(true);
        log('jobs-list.download');
        props.app.commands
          .execute(CommandIDs.downloadFiles, {
            id: props.job.job_id,
            redownload: false
          })
          .then(_ =>
            new Promise(res => setTimeout(res, 5000)).then(_ => {
              log('jobs-list.download');
              setDownloading(false);
              props.reload();
            })
          )
          .catch((e: unknown) => {
            const message = getErrorMessage(e);
            props.setDisplayError(message);
          });
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
  reload: () => void,
  setDisplayError: (message: React.ReactNode) => void
): JSX.Element {
  const inputFile = job.job_files.find(
    jobFile => jobFile.file_format === 'input' && jobFile.file_path
  );
  const trans = useTranslator('jupyterlab');
  const log = useEventLogger();

  const cellContents: React.ReactNode[] = [
    <Link
      onClick={() => {
        log('jobs-list.open-detail');
        showDetailView(job.job_id);
      }}
      title={trans.__('Open detail view for "%1"', job.name)}
    >
      {job.name}
    </Link>,
    inputFile ? (
      <JobFileLink
        app={app}
        jobFile={inputFile}
        parentComponentName="jobs-list"
      >
        {job.input_filename}
      </JobFileLink>
    ) : (
      job.input_filename
    ),
    <>
      {!job.downloaded &&
        (job.status === 'COMPLETED' || job.status === 'FAILED') && (
          <DownloadFilesButton
            app={app}
            job={job}
            reload={reload}
            setDisplayError={setDisplayError}
          />
        )}
      <JobFiles job={job} app={app} />
      {(job.status === 'COMPLETED' || job.status === 'FAILED') && (
        <FilesDirectoryLink job={job} app={app} />
      )}
    </>,
    <Timestamp job={job} />,
    translateStatus(job.status),
    <Stack spacing={1} direction="row">
      <ConfirmDeleteButton
        name={job.name}
        clickHandler={() => {
          log('jobs-list.delete');
          app.commands
            .execute(CommandIDs.deleteJob, {
              id: job.job_id
            })
            .then(_ => deleteRow(job.job_id))
            .catch((e: unknown) => {
              const message = getErrorMessage(e);
              setDisplayError(message);
            });
        }}
      />
      <StopButton
        job={job}
        clickHandler={() => {
          log('jobs-list.stop');
          app.commands
            .execute(CommandIDs.stopJob, {
              id: job.job_id
            })
            .catch((e: unknown) => {
              const message = getErrorMessage(e);
              setDisplayError(message);
            });
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
