import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';

import DownloadIcon from '@mui/icons-material/Download';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { outputFormatsForEnvironment } from './output-format-picker';
import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';
import {
  IJobParameter,
  ICreateJobModel,
  InitialScheduleOptions
} from '../model';
import { CommandIDs } from '..';
import { ConfirmDeleteIcon } from './confirm-delete-icon';
import TableRow from '@mui/material/TableRow';
import { TableCell } from '@mui/material';

function get_file_from_path(path: string): string {
  return PathExt.basename(path);
}

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

function RefillButton(props: {
  job: Scheduler.IDescribeJob;
  environmentList: Scheduler.IRuntimeEnvironment[];
  showCreateJob: (newModel: ICreateJobModel) => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const buttonTitle = props.job.name
    ? trans.__('Rerun "%1" …', props.job.name)
    : trans.__('Rerun job …');

  // Retrieve the key from the parameters list or return a parameter with a null value
  function getParam(key: string) {
    return {
      name: key,
      value: props.job.parameters?.[key]
    };
  }

  // Convert the hash of parameters to an array.
  const jobParameters: IJobParameter[] | undefined =
    props.job.parameters !== undefined
      ? Object.keys(props.job.parameters).map(key => getParam(key))
      : undefined;

  const clickHandler = (): void => {
    const newModel: ICreateJobModel = {
      inputFile: props.job.input_uri,
      jobName: props.job.name ?? '',
      outputPath: props.job.output_prefix,
      environment: props.job.runtime_environment_name,
      runtimeEnvironmentParameters: props.job.runtime_environment_parameters,
      parameters: jobParameters,
      createType: 'Job',
      ...InitialScheduleOptions
    };

    // Convert the list of output formats, if any, into a list for the initial state
    const jobOutputFormats = props.job.output_formats;
    const outputFormats = outputFormatsForEnvironment(
      props.environmentList,
      props.job.runtime_environment_name
    );
    if (jobOutputFormats && outputFormats) {
      newModel.outputFormats = outputFormats
        .filter(of => jobOutputFormats.some(jof => of.name === jof))
        .map(of => of.name);
    }

    // Switch the view to the form.
    props.showCreateJob(newModel);
  };

  return (
    <IconButton onClick={clickHandler} title={buttonTitle}>
      <ReplayIcon fontSize="small" />
    </IconButton>
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

function OutputFiles(props: {
  job: Scheduler.IDescribeJob;
  openOnClick: (e: any, output_uri: string) => void;
}): JSX.Element | null {
  if (props.job.status !== 'COMPLETED') {
    return null;
  }

  const trans = useTranslator('jupyterlab');

  return (
    <>
      {props.job.outputs.map(
        ({ output_format, display_name, output_path = null }) => {
          return (
            output_path && (
              <a
                key={output_format}
                href={`/lab/tree/${output_path}`}
                title={trans.__('Open "%1"', output_path)}
                onClick={e => props.openOnClick(e, output_path)}
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

type DownloadOutputsButtonProps = {
  app: JupyterFrontEnd;
  job: Scheduler.IDescribeJob;
  reload: () => void;
};

function DownloadOutputsButton(props: DownloadOutputsButtonProps) {
  const [downloading, setDownloading] = useState(false);

  return (
    <IconButton
      aria-label="download"
      title="Download Output Files"
      disabled={downloading}
      onClick={async () => {
        setDownloading(true);
        await props.app.commands.execute(CommandIDs.downloadOutputs, {
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
    get_file_from_path(job.input_uri),
    <>
      {!job.downloaded && job.status === 'COMPLETED' && (
        <DownloadOutputsButton app={app} job={job} reload={reload} />
      )}
      <OutputFiles
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
      <RefillButton
        job={job}
        environmentList={environmentList}
        showCreateJob={showCreateJob}
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
