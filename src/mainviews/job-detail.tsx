import React, { useState } from 'react';
import {
  ICreateJobModel,
  IJobDetailModel,
  IJobParameter,
  JobsView
} from '../model';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import {
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  OutlinedInputProps,
  TextField,
  Typography
} from '@mui/material';
import { caretDownIcon } from '@jupyterlab/ui-components';
import { useTranslator } from '../hooks';
import { Heading } from '../components/heading';

export interface IJobDetailProps {
  model: IJobDetailModel;
  modelChanged: (model: IJobDetailModel) => void;
  //remove optional below in setCreateModel
  setCreateModel?: (createModel: ICreateJobModel) => void;
  setView: (view: JobsView) => void;
}

interface ITextFieldStyledProps {
  label: string;
  defaultValue?: string;
  InputProps?: Partial<OutlinedInputProps> | undefined;
}

export function JobDetail(props: IJobDetailProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(true);

  const trans = useTranslator('jupyterlab');

  //const ss = new SchedulerService({});
  //const job = ss.getJobDefinitions(props.model.jobId):
  // Take props.jobId, make REST API request to get IJobDetailsModel with all of the job information
  // To rerun job:
  // 1) Call props.setCreateModel(<current model for this job>)
  // 2) Call props.setView('CreateJob')

  const prop = {
    jobId: 'job-12'
  };

  const advancedOptions: IJobParameter[] = [
    { name: 'option 1', value: 'hello' },
    { name: 'option 2', value: 'value 2' }
  ];

  const basicOptions: ICreateJobModel = {
    jobName: 'my job',
    inputFile: 'foobar',
    outputPath: 'foobar.jptr',
    environment: 'conda3',
    parameters: advancedOptions,
    outputFormats: [{ name: 'hello', label: 'label' }]
  };

  function TextFieldStyled(props: ITextFieldStyledProps) {
    return (
      <TextField
        {...props}
        label={props.label}
        defaultValue={props.defaultValue}
        size="small"
        variant="outlined"
      />
    );
  }

  function MainArea() {
    if (loading) {
      return (
        <Stack direction="row" justifyContent="center">
          <CircularProgress />
        </Stack>
      );
    } else {
      return (
        <>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {running && (
              <Button onClick={_ => setRunning(!running)}> Stop Job </Button>
            )}
            <Button onClick={_ => setRunning(!running)}> Rerun Job </Button>
            <Button> Delete Job </Button>
          </Stack>
          <Stack spacing={4}>
            <TextFieldStyled
              label={trans.__('Job name')}
              defaultValue={basicOptions.jobName}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Input file')}
              defaultValue={basicOptions.inputFile}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Output path')}
              defaultValue={basicOptions.outputPath}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Environment')}
              defaultValue={basicOptions.environment}
              InputProps={{
                readOnly: true
              }}
            />
            <TextFieldStyled
              label={trans.__('Job name')}
              defaultValue={basicOptions.jobName}
              InputProps={{
                readOnly: true
              }}
            />
          </Stack>

          <Accordion
            defaultExpanded={advancedOptions.length > 0}
            disabled={advancedOptions.length === 0}
          >
            <AccordionSummary
              expandIcon={<caretDownIcon.react />}
              aria-controls="panel-content"
              id="panel-header"
            >
              Advanced options
            </AccordionSummary>
            <AccordionDetails id="panel-content">
              <Stack component="form" spacing={4}>
                {advancedOptions.length > 0 &&
                  advancedOptions.map((option, idx) => (
                    <Stack key={idx} direction="row" spacing={1}>
                      <TextFieldStyled
                        label={trans.__('Name')}
                        defaultValue={option.name}
                        InputProps={{
                          readOnly: true
                        }}
                      />
                      <TextFieldStyled
                        label={trans.__('Value')}
                        defaultValue={option.value}
                        InputProps={{
                          readOnly: true
                        }}
                      />
                    </Stack>
                  ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </>
      );
    }
  }

  return (
    <>
      <Button onClick={_ => setLoading(!loading)}> Toggle loading </Button>
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
                Jobs
              </Link>
              <Typography color="text.primary">{prop.jobId}</Typography>
            </Breadcrumbs>
          </div>
          <Heading level={1}>{trans.__('Job Detail')}</Heading>
          <MainArea />
        </Stack>
      </Box>
    </>
  );
}
