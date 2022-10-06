import React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICreateJobModel, IJobDetailModel, JobsView } from '../model';
import { useTranslator } from '../hooks';
import { SchedulerService } from '../handler';
import { Scheduler as SchedulerTokens } from '../tokens';

import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import {
  Card,
  CardContent,
  FormLabel,
  TextField,
  TextFieldProps
} from '@mui/material';

export const TextFieldStyled = (props: TextFieldProps): JSX.Element => (
  <TextField {...props} variant="outlined" InputProps={{ readOnly: true }} />
);
export interface IJobDetailProps {
  app: JupyterFrontEnd;
  model: IJobDetailModel;
  handleModelChange: () => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
  outputFormatsStrings?: string[];
}

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  console.log('job detail model');
  console.log(props.model);

  const ss = new SchedulerService({});

  const handleRerunJob = () => {
    const initialState: ICreateJobModel = {
      jobName: props.model.jobName,
      inputFile: props.model.inputFile,
      outputPath: props.model.outputPrefix ?? '',
      environment: props.model.environment,
      parameters: props.model.parameters,
      createType: 'Job'
    };

    props.setCreateJobModel(initialState);
    props.setView('CreateJob');
  };

  const handleDeleteJob = async () => {
    await ss.deleteJob(props.model.jobId ?? '');
    props.setView('ListJobs');
  };

  const handleStopJob = async () => {
    await props.app.commands.execute('scheduling:stop-job', {
      id: props.model.jobId
    });
    props.handleModelChange();
  };

  const timestampLocalize = (time: number | '') => {
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

  const ButtonBar = (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      {props.model.status === 'IN_PROGRESS' && (
        <Button variant="outlined" onClick={handleStopJob}>
          {trans.__('Stop Job')}
        </Button>
      )}
      <Button variant="outlined" onClick={handleRerunJob}>
        {trans.__('Rerun Job')}
      </Button>
      <Button variant="contained" color="error" onClick={handleDeleteJob}>
        {trans.__('Delete Job')}
      </Button>
    </Stack>
  );

  const coreOptionsFields: TextFieldProps[][] = [
    [
      { defaultValue: props.model.jobName, label: trans.__('Job name') },
      { defaultValue: props.model.jobId, label: trans.__('Job ID') }
    ],
    [
      {
        defaultValue: props.model.inputFile,
        label: trans.__('Input file')
      },
      {
        defaultValue: props.model.outputPath,
        label: trans.__('Output path')
      }
    ],
    [
      {
        defaultValue: props.model.environment,
        label: trans.__('Environment')
      },
      { defaultValue: props.model.status ?? '', label: trans.__('Status') }
    ],
    [
      {
        defaultValue: timestampLocalize(props.model.createTime ?? ''),
        label: trans.__('Created at')
      },
      {
        defaultValue: timestampLocalize(props.model.updateTime ?? ''),
        label: trans.__('Updated at')
      }
    ],
    [
      {
        defaultValue: timestampLocalize(props.model.startTime ?? ''),
        label: trans.__('Start time')
      },
      {
        defaultValue: timestampLocalize(props.model.endTime ?? ''),
        label: trans.__('End time')
      }
    ]
  ];

  function OutputFile(props: {
    outputType: string;
    app: JupyterFrontEnd;
    outputPath: string;
  }) {
    const outputName = props.outputPath.replace(/ipynb$/, props.outputType);
    return (
      <Link
        key={props.outputType}
        href={`/lab/tree/${outputName}`}
        title={trans.__('Open "%1"', outputName)}
        onClick={(
          e:
            | React.MouseEvent<HTMLSpanElement, MouseEvent>
            | React.MouseEvent<HTMLAnchorElement, MouseEvent>
        ) => {
          e.preventDefault();
          props.app.commands.execute('docmanager:open', {
            path: outputName
          });
        }}
        style={{ paddingRight: '1em' }}
      >
        {outputName}
      </Link>
    );
  }

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
              {props.outputFormatsStrings?.map(outputFormatString => (
                <OutputFile
                  outputType={outputFormatString}
                  app={props.app}
                  outputPath={props.model.outputPath}
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
                <TextFieldStyled
                  label={trans.__('Parameter name')}
                  defaultValue={parameter.name}
                  style={{
                    flexGrow: 1
                  }}
                />
                <TextFieldStyled
                  label={trans.__('Parameter value')}
                  defaultValue={parameter.value}
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
            handleModelChange={model => {
              return;
            }}
            errors={{}}
            handleErrorsChange={errors => {
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
      {CoreOptions}
      {Parameters}
      {AdvancedOptions}
    </>
  );
}
