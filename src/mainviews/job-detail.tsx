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
  const [job, setJob] = useState<IJobDetailModel | undefined>(undefined);

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const getJob = async () => {
    const jobFromService = await ss.getJob(props.model.jobId);
    const newModel = {
      ...props.model,
      ...convertDescribeJobtoJobDetail(jobFromService)
    };
    props.handleModelChange(newModel);
    setJob(newModel);
  };

  const handleRerunJob = () => {
    const initialState: ICreateJobModel = {
      jobName: job?.jobName ?? '',
      inputFile: job?.inputFile ?? '',
      outputPath: job?.outputPrefix ?? '',
      environment: job?.environment ?? '',
      parameters: job?.parameters
    };

    props.setCreateJobModel(initialState);
    props.setView('CreateJob');
  };

  const handleDeleteJob = async () => {
    await ss.deleteJob(job?.jobId ?? '');
    props.setView('ListJobs');
  };

  const handleStopJob = async () => {
    props.app.commands.execute('scheduling:stop-job', {
      id: job?.jobId
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

  useEffect(() => {
    if (job?.jobName) {
      setLoading(false);
    }
  }, [job?.jobName]);

  const TextFieldStyled = (props: TextFieldProps) => (
    <TextField {...props} variant="outlined" disabled fullWidth />
  );

  const Loading = () => (
    <Stack direction="row" justifyContent="center">
      <CircularProgress title={trans.__('Loading')} />
    </Stack>
  );

  const ButtonBar = () => (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      {job?.status === 'IN_PROGRESS' && (
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
      { defaultValue: job?.jobName ?? '', label: trans.__('Job name') },
      { defaultValue: job?.jobId ?? '', label: trans.__('Job ID') }
    ],
    [
      {
        defaultValue: job?.inputFile ?? '',
        label: trans.__('Input file')
      },
      {
        defaultValue: job?.outputPath ?? '',
        label: trans.__('Output path')
      }
    ],
    [
      {
        defaultValue: job?.environment ?? '',
        label: trans.__('Environment')
      },
      { defaultValue: job?.status ?? '', label: trans.__('Status') }
    ],
    [
      {
        defaultValue: timestampLocalize(job?.createTime ?? ''),
        label: trans.__('Create time')
      },
      {
        defaultValue: timestampLocalize(job?.updateTime ?? ''),
        label: trans.__('Update time')
      }
    ],
    [
      {
        defaultValue: timestampLocalize(job?.startTime ?? ''),
        label: trans.__('Start time')
      },
      {
        defaultValue: timestampLocalize(job?.endTime ?? ''),
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
                    flexGrow: 1,
                    flexBasis: 'min-content',
                    flexShrink: 1
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
          {Object.entries(job?.parameters ?? {}).map(([parameter, value]) => (
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
          ))}
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
        <Typography color="text.primary">
          {job?.jobName ?? props.model.jobName}
        </Typography>
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
