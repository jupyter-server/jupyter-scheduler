import React, { useEffect, useState } from 'react';
import {
  convertDescribeJobtoJobDetail,
  ICreateJobModel,
  IJobDetailModel,
  JobsView
} from '../model';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import {
  Card,
  CardContent,
  CircularProgress,
  FormLabel,
  TextField,
  TextFieldProps,
  Typography
} from '@mui/material';
import { useTranslator } from '../hooks';
import { Heading } from '../components/heading';
import { SchedulerService } from '../handler';
import { JupyterFrontEnd } from '@jupyterlab/application';
import Grid from '@mui/material/Unstable_Grid2';
import { Scheduler as SchedulerTokens } from '../tokens';

export interface IJobDetailProps {
  app: JupyterFrontEnd;
  model: IJobDetailModel;
  handleModelChange: (model: IJobDetailModel) => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
}

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const [loading, setLoading] = useState(true);

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const updateJob = async () => {
    const jobFromService = await ss.getJob(props.model.jobId);
    const newModel = {
      ...props.model,
      ...convertDescribeJobtoJobDetail(jobFromService)
    };
    props.handleModelChange(newModel);
  };

  const handleRerunJob = () => {
    const initialState: ICreateJobModel = {
      jobName: props.model.jobName,
      inputFile: props.model.inputFile,
      outputPath: props.model.outputPrefix ?? '',
      environment: props.model.environment,
      parameters: props.model.parameters
    };

    props.setCreateJobModel(initialState);
    props.setView('CreateJob');
  };

  const handleDeleteJob = async () => {
    await ss.deleteJob(props.model.jobId ?? '');
    props.setView('ListJobs');
  };

  const handleStopJob = async () => {
    props.app.commands.execute('scheduling:stop-job', {
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

  useEffect(() => {
    updateJob();
  }, []);

  const TextFieldStyled = (props: TextFieldProps) => (
    <TextField {...props} variant="outlined" disabled />
  );

  const Loading = () => (
    <Stack direction="row" justifyContent="center">
      <CircularProgress title={trans.__('Loading')} />
    </Stack>
  );

  const ButtonBar = () => (
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
        label: trans.__('Create time')
      },
      {
        defaultValue: timestampLocalize(props.model.updateTime ?? ''),
        label: trans.__('Update time')
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

  const CoreOptions = () => (
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
        </Stack>
      </CardContent>
    </Card>
  );

  const Parameters = () => (
    <Card>
      <CardContent>
        <FormLabel sx={{ mb: 4 }} component="legend">
          {trans.__('Parameters')}
        </FormLabel>
        <Grid container spacing={4}>
          {Object.entries(props.model.parameters ?? {}).map(
            ([parameter, value]) => (
              <React.Fragment key={parameter}>
                <Grid xs={12} md={6}>
                  <TextFieldStyled
                    label={trans.__('Parameter name')}
                    defaultValue={parameter}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <TextFieldStyled
                    label={trans.__('Parameter value')}
                    defaultValue={value}
                  />
                </Grid>
              </React.Fragment>
            )
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const AdvancedOptions = () => (
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

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        <BreadcrumbsStyled />
        <Heading level={1}>{trans.__('Job Detail')}</Heading>
        {loading ? (
          <Loading />
        ) : (
          <>
            <ButtonBar />
            <CoreOptions />
            <Parameters />
            <AdvancedOptions />
          </>
        )}
      </Stack>
    </Box>
  );
}
