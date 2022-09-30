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
import { Scheduler, SchedulerService } from '../handler';
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
  const [job, setJob] = useState<Scheduler.IDescribeJob | undefined>(undefined);

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const getJob = async () => {
    const jobFromService = await ss.getJob(props.model.jobId);
    setJob(jobFromService);
    // Populate the model.
    props.handleModelChange({
      ...props.model,
      ...convertDescribeJobtoJobDetail(jobFromService)
    });
    setLoading(false);
  };

  // Retrieve the key from the parameters list or return a parameter with a null value
  const getParam = (key: string) => {
    return {
      name: key,
      value: job?.parameters?.[key]
    };
  };

  const rerunJob = () => {
    const initialState: ICreateJobModel = {
      inputFile: job?.input_uri ?? '',
      jobName: job?.name ?? '',
      outputPath: job?.output_prefix ?? '',
      environment: job?.runtime_environment_name ?? '',
      parameters:
        job && job.parameters
          ? Object.keys(job.parameters).map(key => getParam(key))
          : undefined
    };

    props.setCreateJobModel(initialState);
    props.setView('CreateJob');
  };

  const handleDeleteJob = async () => {
    await ss.deleteJob(job?.job_id ?? '');
    props.setView('ListJobs');
  };

  const handleStopJob = async () => {
    props.app.commands.execute('scheduling:stop-job', {
      id: job?.job_id
    });
    getJob();
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
    getJob();
  }, []);

  const TextFieldStyled = (props: TextFieldProps) => (
    <TextField {...props} variant="outlined" disabled fullWidth />
  );

  const Loading = () => (
    <Stack direction="row" justifyContent="center">
      <CircularProgress title={trans.__('Loading')} />
    </Stack>
  );

  const ButtonBar = () => (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      {job?.status === 'IN_PROGRESS' && (
        <Button variant="outlined" onClick={handleStopJob}>
          {trans.__('Stop Job')}
        </Button>
      )}
      <Button variant="outlined" onClick={rerunJob}>
        {trans.__('Rerun Job')}
      </Button>
      <Button variant="contained" color="error" onClick={handleDeleteJob}>
        {trans.__('Delete Job')}
      </Button>
    </Stack>
  );

  const coreOptionsFields: TextFieldProps[] = [
    { defaultValue: job?.name ?? '', label: trans.__('Job name') },
    { defaultValue: job?.job_id ?? '', label: trans.__('Job ID') },
    {
      defaultValue: job?.input_uri ?? '',
      label: trans.__('Input file')
    },
    {
      defaultValue: job?.output_uri ?? '',
      label: trans.__('Output path')
    },
    {
      defaultValue: job?.runtime_environment_name ?? '',
      label: trans.__('Environment')
    },
    {
      defaultValue: timestampLocalize(job?.create_time ?? ''),
      label: trans.__('Create time')
    },
    {
      defaultValue: timestampLocalize(job?.start_time ?? ''),
      label: trans.__('Start time')
    },
    {
      defaultValue: timestampLocalize(job?.end_time ?? ''),
      label: trans.__('End time')
    },
    { defaultValue: job?.status ?? '', label: trans.__('Status') }
  ];

  const CoreOptions = () => (
    <Card>
      <CardContent>
        <Grid container spacing={4}>
          {coreOptionsFields.map(textFieldProps => (
            <Grid key={textFieldProps.defaultValue as string} xs={12} md={6}>
              <TextFieldStyled {...textFieldProps} />
            </Grid>
          ))}
        </Grid>
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
          {Object.entries(job?.parameters ?? {}).map(([parameter, value]) => (
            <React.Fragment key={parameter}>
              <Grid xs={12} md={6}>
                <TextFieldStyled
                  label={trans.__('Parameter')}
                  defaultValue={parameter}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <TextFieldStyled
                  label={trans.__('Value')}
                  defaultValue={value}
                />
              </Grid>
            </React.Fragment>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const OtherOptions = () => (
    <Card>
      <CardContent>
        <Stack spacing={4}>
          <TextFieldStyled
            label={trans.__('Idempotency token')}
            defaultValue={job?.idempotency_token ?? ''}
          />
          <FormLabel component="legend">{trans.__('Tags')}</FormLabel>
          {job?.tags &&
            job?.tags.map(tag => (
              <TextFieldStyled label={trans.__('Tag')} defaultValue={tag} />
            ))}
        </Stack>
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
        </Stack>
      </CardContent>
    </Card>
  );

  const BreadcrumbStyled = () => (
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
        <Typography color="text.primary">
          {job?.name ?? props.model.jobId}
        </Typography>
      </Breadcrumbs>
    </div>
  );

  return (
    <Box sx={{ p: 4 }} style={{ height: '100%', boxSizing: 'border-box' }}>
      <Stack spacing={4}>
        <BreadcrumbStyled />
        <Heading level={1}>{trans.__('Job Detail')}</Heading>
        {loading ? (
          <Loading />
        ) : (
          <>
            <ButtonBar />
            <CoreOptions />
            <Parameters />
            <OtherOptions />
            <AdvancedOptions />
          </>
        )}
      </Stack>
    </Box>
  );
}
