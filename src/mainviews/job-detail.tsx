import React, { useEffect, useState } from 'react';
import { ICreateJobModel, IJobDetailModel, JobsView } from '../model';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import {
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  OutlinedInputProps,
  TextField,
  Typography
} from '@mui/material';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { caretDownIcon } from '@jupyterlab/ui-components';

import { Heading } from '../components/heading';
import { Scheduler, SchedulerService } from '../handler';
import { useTranslator } from '../hooks';
import SchedulerTokens from '../tokens';

export interface IJobDetailProps {
  app: JupyterFrontEnd;
  model: IJobDetailModel;
  handleModelChange: (model: IJobDetailModel) => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
  // Extension point: optional additional component
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
}

interface ITextFieldStyledProps {
  label: string;
  defaultValue?: string;
  InputProps?: Partial<OutlinedInputProps> | undefined;
}

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Scheduler.IDescribeJob | undefined>(undefined);

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const getJobDefinion = async () => {
    const jobDefinition = await ss.getJob(props.model.jobId);
    setJob(jobDefinition);
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
          : undefined,
      outputFormats: job?.output_formats?.map(format => ({
        name: format,
        label: format
      }))
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
    getJobDefinion();
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
    getJobDefinion();
  }, []);

  function TextFieldStyled(props: ITextFieldStyledProps) {
    return (
      <TextField
        {...props}
        label={props.label}
        defaultValue={props.defaultValue}
        variant="outlined"
        disabled
      />
    );
  }

  function MainArea() {
    if (loading) {
      return (
        <Stack direction="row" justifyContent="center">
          <CircularProgress title={trans.__('Loading')} />
        </Stack>
      );
    } else {
      return (
        <>
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
          <Stack spacing={4}>
            <TextFieldStyled
              label={trans.__('Job name')}
              defaultValue={job?.name ?? ''}
            />
            <TextFieldStyled
              label={trans.__('Input file')}
              defaultValue={job?.input_uri ?? ''}
            />
            <TextFieldStyled
              label={trans.__('Output path')}
              defaultValue={job?.output_uri ?? ''}
            />
            <TextFieldStyled
              label={trans.__('Environment')}
              defaultValue={job?.runtime_environment_name ?? ''}
            />
            <FormControl component="fieldset">
              <FormLabel component="legend">
                {trans.__('Output formats')}
              </FormLabel>
              <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
                {job?.output_formats &&
                  job?.output_formats.map(format => (
                    <FormControlLabel
                      key={format}
                      control={<Checkbox checked={true} disabled />}
                      label={format}
                    />
                  ))}
              </FormGroup>
            </FormControl>
            <TextFieldStyled
              label={trans.__('Compute type')}
              defaultValue={job?.compute_type ?? ''}
            />
            <TextFieldStyled
              label={trans.__('Status')}
              defaultValue={job?.status ?? ''}
            />
            <Accordion defaultExpanded={true}>
              <AccordionSummary
                expandIcon={<caretDownIcon.react />}
                aria-controls="panel-content"
                id="panel-header"
              >
                <FormLabel component="legend">
                  {trans.__('Parameters')}
                </FormLabel>
              </AccordionSummary>
              <AccordionDetails id="panel-content">
                <Stack spacing={4}>
                  {Object.entries(job?.parameters ?? {}).map(
                    ([parameter, value]) => (
                      <Stack key={parameter} direction="row" spacing={1}>
                        <TextFieldStyled
                          label={trans.__('Parameter')}
                          defaultValue={parameter}
                          InputProps={{
                            readOnly: true
                          }}
                        />
                        <TextFieldStyled
                          label={trans.__('Value')}
                          defaultValue={value}
                        />
                      </Stack>
                    )
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>

          <Accordion defaultExpanded={true}>
            <AccordionSummary
              expandIcon={<caretDownIcon.react />}
              aria-controls="panel-content"
              id="panel-header"
            >
              <FormLabel component="legend">
                {trans.__('Additional options')}
              </FormLabel>
            </AccordionSummary>
            <AccordionDetails id="panel-content">
              <Stack spacing={4}>
                <FormLabel component="legend">{trans.__('Tags')}</FormLabel>
                {job?.tags &&
                  job?.tags.map(tag => (
                    <TextFieldStyled
                      label={trans.__('Tag')}
                      defaultValue={tag}
                      InputProps={{
                        readOnly: true
                      }}
                    />
                  ))}
                <TextFieldStyled
                  label={trans.__('Create time')}
                  defaultValue={timestampLocalize(job?.create_time ?? '')}
                />
                <TextFieldStyled
                  label={trans.__('Start time')}
                  defaultValue={timestampLocalize(job?.start_time ?? '')}
                />
                <TextFieldStyled
                  label={trans.__('End time')}
                  defaultValue={timestampLocalize(job?.end_time ?? '')}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded={true}>
            <AccordionSummary
              expandIcon={<caretDownIcon.react />}
              aria-controls="panel-content"
              id="panel-header"
            >
              <FormLabel component="legend">
                {trans.__('Advanced options')}
              </FormLabel>
            </AccordionSummary>
            <AccordionDetails id="panel-content">
              {/* Read-only */}
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
            </AccordionDetails>
          </Accordion>
        </>
      );
    }
  }

  return (
    <>
      <Box sx={{ maxWidth: '500px', p: 4 }}>
        <Stack spacing={4}>
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
              <Typography color="text.primary">{props.model.jobId}</Typography>
            </Breadcrumbs>
          </div>
          <Heading level={1}>{trans.__('Job Detail')}</Heading>
          <MainArea />
        </Stack>
      </Box>
    </>
  );
}
