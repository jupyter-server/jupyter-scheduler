import React, { useCallback, useState } from 'react';

import {
  Alert,
  Button,
  Card,
  CardContent,
  FormLabel,
  Stack,
  TextField,
  TextFieldProps
} from '@mui/material';
import { ButtonBar } from '../../components/button-bar';
import { CommandIDs } from '../..';
import {
  ConfirmDialogDeleteButton,
  ConfirmDialogStopButton
} from '../../components/confirm-dialog-buttons';
import { ICreateJobModel, IJobDetailModel, JobsView } from '../../model';
import {
  ILabeledValueProps,
  LabeledValue
} from '../../components/labeled-value';
import { JobFileLink } from '../../components/job-file-link';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { NotificationsConfigDetail } from '../../components/notifications-config-detail';
import { Scheduler, SchedulerService } from '../../handler';
import { Scheduler as SchedulerTokens } from '../../tokens';
import { useEventLogger, useTranslator } from '../../hooks';

export const TextFieldStyled = (props: TextFieldProps): JSX.Element => (
  <TextField
    {...props}
    variant="outlined"
    InputProps={{ ...props.InputProps, readOnly: true }}
    FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }}
  />
);

export interface IJobDetailProps {
  app: JupyterFrontEnd;
  model: IJobDetailModel | null;
  handleModelChange: () => Promise<void>;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setJobsView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
  reload: () => void;
}

export const timestampLocalize = (time: number | ''): string => {
  if (time === '') {
    return '';
  } else {
    const display_date = new Date(time);
    const local_display_date = display_date
      ? display_date.toLocaleString()
      : '';
    return local_display_date;
  }
};

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const [downloading, setDownloading] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);

  const ss = new SchedulerService({});

  const translateStatus = useCallback(
    (status: Scheduler.Status | undefined) => {
      // This may look inefficient, but it's intended to call the `trans` function
      // with distinct, static values, so that code analyzers can pick up all the
      // needed source strings.
      switch (status) {
        case 'CREATED':
          return trans.__('Created');
        case 'QUEUED':
          return trans.__('Queued');
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
        default:
          return '';
      }
    },
    [trans]
  );

  const log = useEventLogger();

  const handleDeleteJob = async () => {
    log('job-detail.delete');
    setDisplayError(null);
    ss.deleteJob(props.model?.jobId ?? '')
      .then(_ => props.setJobsView(JobsView.ListJobs))
      .catch((e: Error) => setDisplayError(e.message));
  };

  const handleStopJob = async () => {
    log('job-detail.stop');
    setDisplayError(null);
    props.app.commands
      .execute('scheduling:stop-job', {
        id: props.model?.jobId
      })
      .then(_ => props.handleModelChange())
      .catch((e: Error) => setDisplayError(e.message));
  };

  const downloadFiles = async () => {
    log('job-detail.download');
    setDownloading(true);
    props.app.commands
      .execute(CommandIDs.downloadFiles, {
        id: props.model?.jobId,
        redownload: false
      })
      .then(() => {
        new Promise(res => setTimeout(res, 5000)).then(_ =>
          props.handleModelChange().then(_ => setDownloading(false))
        );
      })
      .catch((e: Error) => {
        setDisplayError(e.message);
        setDownloading(false);
      });
  };

  const JobButtonBar = (
    <ButtonBar>
      <Button
        variant="contained"
        onClick={e => {
          log('job-detail.reload');
          props.reload();
        }}
      >
        {trans.__('Reload Job')}
      </Button>
      {props.model !== null &&
        props.model.downloaded === false &&
        (props.model.status === 'COMPLETED' ||
          props.model.status === 'FAILED') && (
          <Button
            variant="outlined"
            onClick={downloadFiles}
            disabled={downloading}
          >
            {trans.__('Download Job Files')}
          </Button>
        )}
      {props.model !== null && props.model.status === 'IN_PROGRESS' && (
        <ConfirmDialogStopButton
          handleStop={handleStopJob}
          title={trans.__('Stop Job')}
          dialogText={trans.__('Are you sure that you want to stop this job?')}
        />
      )}
      {props.model !== null && (
        <ConfirmDialogDeleteButton
          handleDelete={handleDeleteJob}
          title={trans.__('Delete Job')}
          dialogText={trans.__(
            'Are you sure that you want to delete this job?'
          )}
        />
      )}
    </ButtonBar>
  );

  // If we don't have a set model, don't display anything else.
  if (props.model === null) {
    return (
      <>
        {displayError && <Alert severity="error">{displayError}</Alert>}
        {JobButtonBar}
      </>
    );
  }

  const inputJobFile = props.model.job_files.find(
    jobFile => jobFile.file_format === 'input' && jobFile.file_path
  );

  const coreOptionsFields: ILabeledValueProps[][] = [
    [
      { value: props.model.jobName, label: trans.__('Job name') },
      { value: props.model.jobId, label: trans.__('Job ID') }
    ],
    [
      {
        label: trans.__('Input file'),
        value: inputJobFile ? (
          <JobFileLink
            app={props.app}
            jobFile={inputJobFile}
            parentComponentName="job-detail"
          >
            {props.model.inputFile}
          </JobFileLink>
        ) : (
          props.model.inputFile
        )
      },
      {
        value: props.model.environment,
        label: trans.__('Environment')
      }
    ],
    [
      {
        value: translateStatus(props.model.status),
        label: trans.__('Status')
      },
      {
        value: timestampLocalize(props.model.createTime ?? ''),
        label: trans.__('Created at')
      }
    ],
    [
      {
        value: timestampLocalize(props.model.updateTime ?? ''),
        label: trans.__('Updated at')
      },
      {
        value: timestampLocalize(props.model.startTime ?? ''),
        label: trans.__('Start time')
      }
    ],
    [
      {
        value: timestampLocalize(props.model.endTime ?? ''),
        label: trans.__('End time')
      }
    ]
  ];

  const hasOutputs =
    (props.model.status === 'COMPLETED' || props.model.status === 'FAILED') &&
    props.model.job_files.some(
      jobFile => jobFile.file_format !== 'input' && jobFile.file_path
    );

  const CoreOptions = (
    <Card>
      <CardContent>
        <Stack spacing={4}>
          {coreOptionsFields.map(propsRow => (
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {propsRow.map(textProp => (
                <LabeledValue
                  {...textProp}
                  style={{
                    flex: '1 1 49%'
                  }}
                />
              ))}
            </Stack>
          ))}
          {hasOutputs && (
            <>
              <FormLabel component="legend">
                {trans.__('Output files')}
              </FormLabel>
              {props.model.job_files
                .filter(
                  jobFile =>
                    jobFile.file_format !== 'input' && jobFile.file_path
                )
                .map(jobFile => (
                  <JobFileLink
                    jobFile={jobFile}
                    app={props.app}
                    parentComponentName="job-detail"
                  />
                ))}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const Parameters = (
    <Card>
      <CardContent>
        <FormLabel sx={{ mb: 4 }} component="legend">
          {trans.__('Parameters')}
        </FormLabel>
        <Stack spacing={4}>
          {props.model.parameters &&
            props.model.parameters.map((parameter, idx) => (
              <Stack key={idx} direction={'row'} gap={2} flexWrap={'wrap'}>
                <LabeledValue
                  label={trans.__('Parameter name')}
                  value={parameter.name}
                  style={{
                    flex: '1 1 49%'
                  }}
                />
                <LabeledValue
                  label={trans.__('Parameter value')}
                  value={parameter.value}
                  style={{
                    flex: '1 1 49%'
                  }}
                />
              </Stack>
            ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const AdvancedOptions = (
    <Card>
      <CardContent>
        <Stack component="form" spacing={4}>
          <FormLabel component="legend">
            {trans.__('Advanced Options')}
          </FormLabel>
          <props.advancedOptions
            jobsView={JobsView.JobDetail}
            model={props.model}
            handleModelChange={(_: any) => {
              return;
            }}
            errors={{}}
            handleErrorsChange={(_: any) => {
              return;
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      {displayError && <Alert severity="error">{displayError}</Alert>}
      {props.model.statusMessage && (
        <Alert severity="error">{props.model.statusMessage}</Alert>
      )}
      {JobButtonBar}
      {CoreOptions}
      {Parameters}
      {props.model.notificationsConfig && (
        <NotificationsConfigDetail
          notificationsConfig={props.model.notificationsConfig}
        />
      )}
      {AdvancedOptions}
    </>
  );
}
