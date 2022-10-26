import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { ConfirmDeleteButton } from '../../components/confirm-delete-button';
import { JobFileLink } from '../../components/job-file-link';
import { Scheduler, SchedulerService } from '../../handler';
import { useTranslator } from '../../hooks';
import {
  ICreateJobModel,
  IJobDetailModel,
  JobsView,
  ListJobsView
} from '../../model';
import { Scheduler as SchedulerTokens } from '../../tokens';

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
import { CommandIDs } from '../..';

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
  model: IJobDetailModel;
  handleModelChange: () => Promise<void>;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setJobsView: (view: JobsView) => void;
  setListJobsView: (view: ListJobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
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

  const ss = new SchedulerService({});

  const handleDeleteJob = async () => {
    await ss.deleteJob(props.model.jobId ?? '');
    props.setJobsView('ListJobs');
    props.setListJobsView('Job');
  };

  const handleStopJob = async () => {
    await props.app.commands.execute('scheduling:stop-job', {
      id: props.model.jobId
    });
    props.handleModelChange();
  };

  const downloadFiles = async () => {
    setDownloading(true);
    await props.app.commands.execute(CommandIDs.downloadFiles, {
      id: props.model.jobId,
      redownload: false
    });
    await new Promise(res => setTimeout(res, 500));
    await props.handleModelChange();
    setDownloading(false);
  };

  const ButtonBar = (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      {props.model.downloaded === false && props.model.status === 'COMPLETED' && (
        <Button
          variant="outlined"
          onClick={downloadFiles}
          disabled={downloading}
        >
          {trans.__('Download Job Files')}
        </Button>
      )}
      {props.model.status === 'IN_PROGRESS' && (
        <Button variant="outlined" onClick={handleStopJob}>
          {trans.__('Stop Job')}
        </Button>
      )}
      <ConfirmDeleteButton
        handleDelete={handleDeleteJob}
        title={trans.__('Delete Job')}
        text={trans.__('Are you sure that you want to delete this job?')}
      />
    </Stack>
  );

  const coreOptionsFields: TextFieldProps[][] = [
    [
      { value: props.model.jobName, label: trans.__('Job name') },
      { value: props.model.jobId, label: trans.__('Job ID') }
    ],
    [
      {
        value: props.model.inputFile,
        label: trans.__('Input filename')
      },
      {
        value: props.model.environment,
        label: trans.__('Environment')
      }
    ],
    [
      { value: props.model.status ?? '', label: trans.__('Status') },
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

  const convertJsonToJobFile = (jobFile: { [key: string]: string }) => {
    return {
      display_name: jobFile['display_name'],
      file_format: jobFile['file_format'],
      file_path: jobFile['file_path'] || null
    } as Scheduler.IJobFile;
  };

  const CoreOptions = (
    <Card>
      <CardContent>
        <Stack spacing={4}>
          {coreOptionsFields.map(propsRow => (
            <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {propsRow.map(textProp => (
                <TextFieldStyled
                  {...textProp}
                  style={{
                    flexGrow: 1
                  }}
                />
              ))}
            </Stack>
          ))}
          {props.model.status === 'COMPLETED' && (
            <>
              <FormLabel component="legend">{trans.__('Job files')}</FormLabel>
              {props.model.job_files.map(
                jobFile =>
                  jobFile['file_path'] && (
                    <JobFileLink
                      jobFile={convertJsonToJobFile(jobFile)}
                      app={props.app}
                    />
                  )
              )}
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
                <TextFieldStyled
                  label={trans.__('Parameter name')}
                  value={parameter.name}
                  style={{
                    flexGrow: 1
                  }}
                />
                <TextFieldStyled
                  label={trans.__('Parameter value')}
                  value={parameter.value}
                  style={{
                    flexGrow: 1
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
            jobsView={'JobDetail'}
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
      {ButtonBar}
      {props.model.statusMessage && (
        <Alert severity="error">{props.model.statusMessage}</Alert>
      )}
      {CoreOptions}
      {Parameters}
      {AdvancedOptions}
    </>
  );
}
