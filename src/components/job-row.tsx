import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ToolbarButtonComponent } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { closeIcon, stopIcon } from '@jupyterlab/ui-components';

import { Signal } from '@lumino/signaling';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';
import { JobParameter, CreateJobFormState } from '../create-job-form';

import { replayIcon } from './icons';
import { JobDetails } from './job-details';
import { outputFormatsForEnvironment } from './output-format-picker';

function get_file_from_path(path: string): string {
  return PathExt.basename(path);
}

function StopButton(props: {
  job: Scheduler.IDescribeJob;
  clickHandler: () => void;
}): JSX.Element | null {
  if (props.job.status !== 'IN_PROGRESS') {
    return null;
  }

  const trans = useTranslator('jupyterlab');
  const buttonTitle = props.job.name
    ? trans.__('Stop "%1"', props.job.name)
    : trans.__('Stop job');

  return (
    <ToolbarButtonComponent
      onClick={props.clickHandler}
      tooltip={buttonTitle}
      icon={stopIcon}
    />
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
  signal: Signal<any, CreateJobFormState>;
  showCreateJob: () => void;
}): JSX.Element | null {
  const trans = useTranslator('jupyterlab');
  const buttonTitle = props.job.name
    ? trans.__('Rerun "%1" …', props.job.name)
    : trans.__('Rerun job …');

  // Convert the hash of parameters to an array.
  const jobParameters: JobParameter[] | undefined = props.job.parameters
    ? Object.keys(props.job.parameters).map(key => {
        return { name: key, value: props.job.parameters![key] };
      })
    : undefined;

  const clickHandler = (): void => {
    const initialState: CreateJobFormState = {
      inputFile: props.job.input_uri,
      jobName: props.job.name ?? '',
      outputPath: props.job.output_prefix,
      environment: props.job.runtime_environment_name,
      parameters: jobParameters
    };

    // Convert the list of output formats, if any, into a list for the initial state
    const jobOutputFormats = props.job.output_formats;
    const outputFormats = outputFormatsForEnvironment(
      props.job.runtime_environment_name
    );
    if (jobOutputFormats && outputFormats) {
      initialState.outputFormats = outputFormats.filter(of =>
        jobOutputFormats.some(jof => of.name == jof)
      );
    }

    // Switch the view to the form.
    props.showCreateJob();
    props.signal.emit(initialState);
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
  const start_date: Date | null = props.job.start_time
    ? new Date(props.job.start_time)
    : null;
  const start_display_date: string | null = start_date
    ? start_date.toLocaleString()
    : null;

  return <>{start_display_date}</>;
}

function OutputFiles(props: {
  job: Scheduler.IDescribeJob;
  openOnClick: (e: any, output_uri: string) => void;
  outputUri: string;
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

export type JobRowProps = {
  job: Scheduler.IDescribeJob;
  createJobFormSignal: Signal<any, CreateJobFormState>;
  rowClass: string;
  cellClass: string;
  app: JupyterFrontEnd;
  showCreateJob: () => void;
};

// Add a row for a job, with columns for each of its traits and a details view below.
export function JobRow(props: JobRowProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);

  const job = props.job;
  const rowClass = props.rowClass;
  const cellClass = props.cellClass;
  const detailsVisibleClass = 'details-visible';
  const trans = useTranslator('jupyterlab');

  const input_relative_uri = job.input_uri;
  const output_relative_uri = job.output_uri;
  // Truncate the path to its filename.
  const input_file = get_file_from_path(job.input_uri);

  const openFileClickHandler = (e: any, output_uri: string) => {
    e.preventDefault();
    props.app.commands.execute('docmanager:open', { path: output_uri });
  };

  const openDetailsClickHandler = () => {
    setDetailsVisible(!detailsVisible);
  };

  const translatedStatus = (status: Scheduler.Status) => {
    // This may look inefficient, but it's intended to call the `trans` function
    // with distinct, static values, so that code analyzers can pick up all the
    // needed source strings.
    switch (status) {
      case 'COMPLETED':
        return trans.__('Completed');
      case 'FAILED':
        return trans.__('Failed');
      case 'IN_PROGRESS':
        return trans.__('In progress');
      case 'STOPPED':
        return trans.__('Stopped');
      case 'STOPPING':
        return trans.__('Stopping');
    }
  };

  const viewJobDetailsTitle = job.name
    ? trans.__('View details for "%1"', job.name)
    : trans.__('View job details');

  return (
    <>
      <div
        className={rowClass + (detailsVisible ? ' ' + detailsVisibleClass : '')}
        id={`${rowClass}-${job.job_id}`}
        data-job-id={job.job_id}
      >
        <div className={cellClass}>
          <a
            className="jp-notebook-job-name"
            onClick={openDetailsClickHandler}
            title={viewJobDetailsTitle}
          >
            {job.name || <em>{trans.__('unnamed')}</em>}
          </a>
        </div>
        <div className={cellClass}>
          <a
            href={`/lab/tree/${input_relative_uri}`}
            title={trans.__('Open "%1"', input_relative_uri)}
            onClick={e => openFileClickHandler(e, input_relative_uri)}
          >
            {input_file}
          </a>
        </div>
        <div className={cellClass}>
          <OutputFiles
            job={job}
            openOnClick={openFileClickHandler}
            outputUri={output_relative_uri}
          />
        </div>
        <div className={cellClass}>
          <Timestamp job={job} />
        </div>
        <div className={cellClass}>{translatedStatus(job.status)}</div>
        <div className={cellClass}>
          <StopButton
            job={job}
            clickHandler={() =>
              props.app.commands.execute('scheduling:stop-job', {
                id: job.job_id
              })
            }
          />
          <DeleteButton
            job={job}
            clickHandler={() => {
              props.app.commands.execute('scheduling:delete-job', {
                id: job.job_id
              });
              const jobContainer = document.getElementById(
                `${rowClass}-${job.job_id}`
              );
              jobContainer?.classList.add(`${rowClass}-deleted`);
            }}
          />
          <RefillButton
            job={job}
            signal={props.createJobFormSignal}
            showCreateJob={props.showCreateJob}
          />
        </div>
      </div>
      <JobDetails job={job} isVisible={detailsVisible} />
    </>
  );
}
