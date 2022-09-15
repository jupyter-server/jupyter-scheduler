import React from 'react';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

export type JobDetailsProps = {
  job: Scheduler.IDescribeJob | null;
  isVisible: boolean;
};

const rowClass = 'jp-notebook-job-details-row';
const keyClass = 'jp-notebook-job-details-key';
const valueClass = 'jp-notebook-job-details-value';

function JobParameters(props: {
  job: Scheduler.IDescribeJob;
}): JSX.Element | null {
  if (props.job.parameters === undefined || props.job.parameters === null) {
    return null;
  }
  const trans = useTranslator('jupyterlab');
  const params = props.job.parameters;

  return (
    <div className={rowClass}>
      <div className={keyClass}>{trans.__('Parameters')}</div>
      <div className={valueClass}>
        {Object.keys(params).map((paramName, idx) => (
          <p className={'jp-notebook-job-parameter'} key={idx}>
            <span
              className={'jp-notebook-job-parameter-name'}
              style={{ fontWeight: 'bold' }}
            >
              {paramName}:{' '}
            </span>
            <span className={'jp-notebook-job-parameter-value'}>
              {params[paramName]}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function OutputFormats(props: {
  job: Scheduler.IDescribeJob;
}): JSX.Element | null {
  if (
    props.job.output_formats === undefined ||
    props.job.output_formats === null
  ) {
    return null;
  }

  const trans = useTranslator('jupyterlab');
  const outputFormats = props.job.output_formats;

  return (
    <div className={rowClass}>
      <div className={keyClass}>{trans.__('Output Formats')}</div>
      <div className={valueClass}>{outputFormats.join(', ')}</div>
    </div>
  );
}

export function JobDetails(props: JobDetailsProps): JSX.Element | null {
  if (props.job === null) {
    return null;
  }

  const trans = useTranslator('jupyterlab');

  const start_date: Date | null = props.job.start_time
    ? new Date(props.job.start_time)
    : null;
  const start_display_date: string | null = start_date
    ? start_date.toLocaleString()
    : null;
  const end_date: Date | null = props.job.end_time
    ? new Date(props.job.end_time)
    : null;
  const end_display_date: string | null = end_date
    ? end_date.toLocaleString()
    : null;

  if (!props.isVisible) {
    return <div className="jp-notebook-job-details details-hidden" />;
  }

  return (
    <div className="jp-notebook-job-details details-visible">
      <div className={'jp-notebook-job-details-grid'}>
        <div className={rowClass}>
          <div className={keyClass}>{trans.__('ID')}</div>
          <div className={valueClass}>{props.job.job_id}</div>
        </div>
      </div>
      <div className={'jp-notebook-job-details-grid'}>
        <div className={rowClass}>
          <div className={keyClass}>{trans.__('Start date')}</div>
          <div className={valueClass}>{start_display_date}</div>
        </div>
        <div className={rowClass}>
          <div className={keyClass}>{trans.__('End date')}</div>
          <div className={valueClass}>{end_display_date}</div>
        </div>
      </div>
      <div className={'jp-notebook-job-details-grid'}>
        <div className={rowClass}>
          <div className={keyClass}>{trans.__('Environment')}</div>
          <div className={valueClass}>{props.job.runtime_environment_name}</div>
        </div>
        <JobParameters job={props.job} />
        <OutputFormats job={props.job} />
      </div>
    </div>
  );
}
