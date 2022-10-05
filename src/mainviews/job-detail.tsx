import React, { useEffect, useState } from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  convertDescribeJobtoJobDetail,
  ICreateJobModel,
  IJobDetailModel,
  JobsView
} from '../model';
import { useTranslator } from '../hooks';
import { Heading } from '../components/heading';
import { SchedulerService, Scheduler } from '../handler';
import { Scheduler as SchedulerTokens } from '../tokens';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';

import {
  Card,
  CardContent,
  CircularProgress,
  FormLabel,
  TextField,
  TextFieldProps,
  Typography
} from '@mui/material';

export interface IJobDetailProps {
  app: JupyterFrontEnd;
  model: IJobDetailModel;
  handleModelChange: (model: IJobDetailModel) => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
}

const TextFieldStyled = (props: TextFieldProps) => (
  <TextField {...props} variant="outlined" InputProps={{ readOnly: true }} />
);

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [outputFormatsStrings, setOutputFormatsStrings] = useState<string[]>(
    []
  );

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const updateJob = async () => {
    const jobFromService = await ss.getJob(props.model.jobId);
    setOutputFormatsStrings(jobFromService.output_formats ?? []);
    const newModel = {
      ...props.model,
      ...convertDescribeJobtoJobDetail(jobFromService)
    };
    props.handleModelChange(newModel);
    setLoading(false);
  };

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
    updateJob();
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

  const Loading = (
    <Stack direction="row" justifyContent="center">
      <CircularProgress title={trans.__('Loading')} />
    </Stack>
  );

  const BreadcrumbsStyled = () => (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          onClick={(
            _:
              | React.MouseEvent<HTMLAnchorElement, MouseEvent>
              | React.MouseEvent<HTMLSpanElement, MouseEvent>
          ): void => props.setView('ListJobs')}
        >
          {trans.__('Notebook Jobs')}
        </Link>
        <Typography color="text.primary">{props.model.jobName}</Typography>
      </Breadcrumbs>
    </div>
  );

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
              {outputFormatsStrings.map(outputFormatString => (
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

  const DefinitionBreadcrumbsStyled = () => (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          onClick={(
            _:
              | React.MouseEvent<HTMLAnchorElement, MouseEvent>
              | React.MouseEvent<HTMLSpanElement, MouseEvent>
          ): void => props.setView('ListJobs')}
        >
          {trans.__('Notebook Job Definitions')}
        </Link>
        <Typography color="text.primary">
          {mockJobDefinition.name ?? mockJobDefinition.job_definition_id}
        </Typography>
      </Breadcrumbs>
    </div>
  );

  const DefinitionButtonBar = (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      <Button
        variant="outlined"
        onClick={() => console.log('pause definition')}
      >
        {trans.__('Pause Job Definition')}
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => console.log('delete definition')}
      >
        {trans.__('Delete Job Definition')}
      </Button>
    </Stack>
  );

  const mockJobDefinition: Scheduler.IDescribeJobDefinition = {
    name: 'My Job Definition',
    job_definition_id: '7a139aa5-250f-427f-88ae-72bd6c7de740',
    input_path: 'in_Untitled-20221003_074708_AM.ipynb',
    output_path: 'out_Untitled-20221003_074708_AM.ipynb',
    last_modified_time: '1664579884508',
    job_ids: [
      '7a139aa5-250f-427f-88ae-72bd6c7de740',
      '4e1cef9c-227a-437e-b4a3-83526cbb24c3',
      '4aaf9da2-644c-4844-bd59-2c6274fe3ced'
    ]
  };

  const jobDefinitionFields: TextFieldProps[][] = [
    [
      {
        defaultValue: mockJobDefinition.name,
        label: trans.__('Job Definition name')
      },
      {
        defaultValue: mockJobDefinition.job_definition_id,
        label: trans.__('Job Definition ID')
      }
    ],
    [
      {
        defaultValue: mockJobDefinition.input_path,
        label: trans.__('Input path')
      },
      {
        defaultValue: mockJobDefinition.output_path,
        label: trans.__('Output path')
      }
    ],
    [
      {
        defaultValue: mockJobDefinition.last_modified_time,
        label: trans.__('Modified at')
      }
    ]
  ];

  const JobDefinition = (
    <Card>
      <CardContent>
        <Stack spacing={4}>
          {jobDefinitionFields.map(propsRow => (
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
          {mockJobDefinition.job_ids.length && (
            <>
              <FormLabel component="legend">{trans.__('Jobs')}</FormLabel>
              {mockJobDefinition.job_ids.map(jobId => (
                <Link
                  key={jobId}
                  title={trans.__('Open Job "%1"', jobId)}
                  onClick={(
                    e:
                      | React.MouseEvent<HTMLSpanElement, MouseEvent>
                      | React.MouseEvent<HTMLAnchorElement, MouseEvent>
                  ) => {
                    const newModel: IJobDetailModel = {
                      jobId: jobId,
                      jobName: '',
                      inputFile: '',
                      environment: '',
                      outputPath: '',
                      detailType: 'Job'
                    };
                    props.handleModelChange(newModel);
                  }}
                  style={{ paddingRight: '1em' }}
                >
                  {jobId}
                </Link>
              ))}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  useEffect(() => {
    updateJob();
  }, [props.model.jobId]);

  useEffect(() => {
    props.model.detailType = 'JobDefinition';
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        {props.model.detailType &&
        props.model.detailType === 'JobDefinition' ? (
          <DefinitionBreadcrumbsStyled />
        ) : (
          <BreadcrumbsStyled />
        )}
        <Heading level={1}>{trans.__('Job Detail')}</Heading>
        {loading ? (
          Loading
        ) : props.model.detailType &&
          props.model.detailType === 'JobDefinition' ? (
          <>
            {DefinitionButtonBar}
            {JobDefinition}
          </>
        ) : (
          <>
            {ButtonBar}
            {CoreOptions}
            {Parameters}
            {AdvancedOptions}
          </>
        )}
      </Stack>
    </Box>
  );
}
