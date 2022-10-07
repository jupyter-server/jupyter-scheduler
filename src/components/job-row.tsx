import React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ToolbarButtonComponent } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { closeIcon, stopIcon } from '@jupyterlab/ui-components';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';
import { IJobParameter, ICreateJobModel } from '../model';
import { CommandIDs } from '..';

import { replayIcon } from './icons';
import { outputFormatsForEnvironment } from './output-format-picker';

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
      <ToolbarButtonComponent
        onClick={props.clickHandler}
        tooltip={buttonTitle}
        icon={stopIcon}
      />
    </div>
  );
}

function DeleteButton(props: {
  job: Scheduler.IDescribeJob;
  clickHandler: () => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const buttonTitle = props.job.name
    ? trans.__('Delete "%1"', props.job.name)
    : trans.__('Delete job');

  return (
    <ToolbarButtonComponent
      onClick={props.clickHandler}
      tooltip={buttonTitle}
      icon={closeIcon}
    />
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
      parameters: jobParameters,
      createType: 'Job'
    };

    // Convert the list of output formats, if any, into a list for the initial state
    const jobOutputFormats = props.job.output_formats;
    const outputFormats = outputFormatsForEnvironment(
      props.environmentList,
      props.job.runtime_environment_name
    );
    if (jobOutputFormats && outputFormats) {
      newModel.outputFormats = outputFormats.filter(of =>
        jobOutputFormats.some(jof => of.name === jof)
      );
    }

    // Switch the view to the form.
    props.showCreateJob(newModel);
  };

  return (
    <ToolbarButtonComponent
      onClick={clickHandler}
      tooltip={buttonTitle}
      icon={replayIcon}
    />
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

  // Get all output files.
  const outputTypes = props.job.output_formats || ['ipynb'];
  return (
    <>
      {outputTypes.map(outputType => {
        // Compose a specific link.
        const outputName = props.job.output_uri.replace(/ipynb$/, outputType);
        return (
          <a
            key={outputType}
            href={`/lab/tree/${outputName}`}
            title={trans.__('Open "%1"', outputName)}
            onClick={e => props.openOnClick(e, outputName)}
            style={{ paddingRight: '1em' }}
          >
            {outputType}
          </a>
        );
      })}
    </>
  );
}

export function buildJobRow(
  job: Scheduler.IDescribeJob,
  environmentList: Scheduler.IRuntimeEnvironment[],
  app: JupyterFrontEnd,
  showCreateJob: (newModel: ICreateJobModel) => void,
  deleteRow: (id: Scheduler.IDescribeJob['job_id']) => void,
  translateStatus: (status: Scheduler.Status) => string,
  showDetailView: (jobId: string) => void
): JSX.Element {
  const cellContents: React.ReactNode[] = [
    <a onClick={() => showDetailView(job.job_id)}>{job.name}</a>,
    get_file_from_path(job.input_uri),
    <OutputFiles
      job={job}
      openOnClick={(e: Event, output_uri: string) => {
        e.preventDefault();
        app.commands.execute('docmanager:open', { path: output_uri });
      }}
    />,
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
      <DeleteButton
        job={job}
        clickHandler={() => {
          // optimistic delete for now, no verification on whether the delete
          // succeeded
          app.commands.execute(CommandIDs.deleteJob, {
            id: job.job_id
          });
          deleteRow(job.job_id);
        }}
      />
      <RefillButton
        job={job}
        environmentList={environmentList}
        showCreateJob={showCreateJob}
      />
    </Stack>
  ];

  return (
    <TableRow>
      {cellContents.map((cellContent, idx) => (
        <TableCell key={idx}>{cellContent}</TableCell>
      ))}
    </TableRow>
  );
}
