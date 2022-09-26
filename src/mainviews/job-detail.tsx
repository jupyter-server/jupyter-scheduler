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
import { caretDownIcon } from '@jupyterlab/ui-components';
import { useTranslator } from '../hooks';
import { Heading } from '../components/heading';
import { Scheduler, SchedulerService } from '../handler';

export interface IJobDetailProps {
  model: IJobDetailModel;
  modelChanged: (model: IJobDetailModel) => void;
  setCreateJobModel: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
}

interface ITextFieldStyledProps {
  label: string;
  defaultValue?: string;
  InputProps?: Partial<OutlinedInputProps> | undefined;
}

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Scheduler.IDescribeJob | undefined>(undefined);

  //TO DELETE
  const prop = { model: { jobId: '3f062962-1e3e-442b-8454-e76af250da39' } };

  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const getJobDefinion = async () => {
    const jobDefinition = await ss.getJob(prop.model.jobId);
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
      outputPath: job?.output_uri ?? '',
      environment: job?.runtime_environment_name ?? '',
      parameters:
        job?.parameters !== undefined
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

  useEffect(() => {
    getJobDefinion();
  }, []);

  console.log(`jobId from props: ${props.model.jobId}`);

  function TextFieldStyled(props: ITextFieldStyledProps) {
    return (
      <TextField
        {...props}
        label={props.label}
        defaultValue={props.defaultValue}
        variant="outlined"
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
            <Button variant="outlined" onClick={rerunJob}>
              {trans.__('Rerun Job')}
            </Button>
            <Button variant="contained" color="error">
              {trans.__('Delete Job')}
            </Button>
          </Stack>
          <Stack spacing={4}>
            <TextFieldStyled
              label={trans.__('Job name')}
              defaultValue={job?.name ?? ''}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Input file')}
              defaultValue={job?.input_uri ?? ''}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Output path')}
              defaultValue={job?.output_uri ?? ''}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Environment')}
              defaultValue={job?.runtime_environment_name ?? ''}
              InputProps={{
                readOnly: true
              }}
            />

            {job?.output_formats && (
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  {trans.__('Output formats')}
                </FormLabel>
                <FormGroup>
                  {job?.output_formats.map((format, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={<Checkbox checked={true} defaultChecked />}
                      label={format}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            )}

            {job?.parameters && (
              <>
                <FormLabel component="legend">
                  {trans.__('Parameters')}
                </FormLabel>

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
                        InputProps={{
                          readOnly: true
                        }}
                      />
                    </Stack>
                  )
                )}
              </>
            )}
          </Stack>

          <Accordion defaultExpanded={true}>
            <AccordionSummary
              expandIcon={<caretDownIcon.react />}
              aria-controls="panel-content"
              id="panel-header"
            >
              Advanced options
            </AccordionSummary>
            <AccordionDetails id="panel-content">
              <Stack component="form" spacing={4}>
                Placeholder
              </Stack>
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
              <Typography color="text.primary">{prop.model.jobId}</Typography>
            </Breadcrumbs>
          </div>
          <Heading level={1}>{trans.__('Job Detail')}</Heading>
          <MainArea />
        </Stack>
      </Box>
    </>
  );
}
