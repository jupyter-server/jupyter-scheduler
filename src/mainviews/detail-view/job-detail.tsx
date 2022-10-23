import React, { useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  emptyCreateJobModel,
  ICreateJobModel,
  IJobDetailModel,
  JobsView,
  ListJobsView
} from '../../model';
import { useTranslator } from '../../hooks';
import { Scheduler, SchedulerService } from '../../handler';
import { Scheduler as SchedulerTokens } from '../../tokens';
import { ConfirmDeleteButton } from '../../components/confirm-delete-button';

import FolderIcon from '@mui/icons-material/Folder';
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormLabel,
  InputAdornment,
  Link,
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

  const handleRerunJob = () => {
    const initialState: ICreateJobModel = {
      ...emptyCreateJobModel(),
      jobName: props.model.jobName,
      inputFile: props.model.inputFile,
      outputPath: props.model.outputPrefix ?? '',
      environment: props.model.environment,
      computeType: props.model.computeType,
      runtimeEnvironmentParameters: props.model.runtimeEnvironmentParameters,
      parameters: props.model.parameters,
      outputFormats: props.model.outputFormats
    };

    props.setCreateJobModel(initialState);
    props.setJobsView('CreateJob');
  };

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

  const downloadOutputs = async () => {
    setDownloading(true);
    await props.app.commands.execute(CommandIDs.downloadOutputs, {
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
          onClick={downloadOutputs}
          disabled={downloading}
        >
          {trans.__('Download Output Files')}
        </Button>
      )}
      {props.model.status === 'IN_PROGRESS' && (
        <Button variant="outlined" onClick={handleStopJob}>
          {trans.__('Stop Job')}
        </Button>
      )}
      <Button variant="outlined" onClick={handleRerunJob}>
        {trans.__('Rerun Job')}
      </Button>
      <ConfirmDeleteButton
        handleDelete={handleDeleteJob}
        title={trans.__('Delete Job')}
        text={trans.__('Are you sure that you want to delete this job?')}
      />
    </Stack>
  );

  const homeAdornment = (
    <InputAdornment position="start">
      <FolderIcon fontSize="small" />
      &nbsp;&nbsp;/
    </InputAdornment>
  );

  const coreOptionsFields: TextFieldProps[][] = [
    [
      { value: props.model.jobName, label: trans.__('Job name') },
      { value: props.model.jobId, label: trans.__('Job ID') }
    ],
    [
      {
        value: props.model.inputFile,
        label: trans.__('Input file'),
        InputProps: {
          startAdornment: homeAdornment
        }
      },
      {
        value: props.model.outputPath,
        label: trans.__('Output directory'),
        InputProps: {
          startAdornment: homeAdornment
        }
      }
    ],
    [
      {
        value: props.model.environment,
        label: trans.__('Environment')
      },
      { value: props.model.status ?? '', label: trans.__('Status') }
    ],
    [
      {
        value: timestampLocalize(props.model.createTime ?? ''),
        label: trans.__('Created at')
      },
      {
        value: timestampLocalize(props.model.updateTime ?? ''),
        label: trans.__('Updated at')
      }
    ],
    [
      {
        value: timestampLocalize(props.model.startTime ?? ''),
        label: trans.__('Start time')
      },
      {
        value: timestampLocalize(props.model.endTime ?? ''),
        label: trans.__('End time')
      }
    ]
  ];

  function OutputFile(props: {
    output: Scheduler.IOutput;
    app: JupyterFrontEnd;
  }) {
    return (
      <Link
        key={props.output.output_format}
        href={`/lab/tree/${props.output.output_path}`}
        title={trans.__('Open "%1"', props.output.output_path)}
        onClick={(
          e:
            | React.MouseEvent<HTMLSpanElement, MouseEvent>
            | React.MouseEvent<HTMLAnchorElement, MouseEvent>
        ) => {
          e.preventDefault();
          props.app.commands.execute('docmanager:open', {
            path: props.output.output_path
          });
        }}
        style={{ paddingRight: '1em' }}
      >
        {props.output.display_name}
      </Link>
    );
  }

  const convertJsonToOutput = (output: { [key: string]: string }) => {
    return {
      display_name: output['display_name'],
      output_format: output['output_format'],
      output_path: output['output_path'] || null
    } as Scheduler.IOutput;
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
              <FormLabel component="legend">
                {trans.__('Output files')}
              </FormLabel>
              {props.model.outputs.map(
                output =>
                  output['output_path'] && (
                    <OutputFile
                      output={convertJsonToOutput(output)}
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
