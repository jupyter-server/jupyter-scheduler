import React, { useMemo } from 'react';
import { IJobDefinitionModel, JobsView, ListJobsView } from '../../model';
import { useTranslator } from '../../hooks';
import { TextFieldStyled, timestampLocalize } from './job-detail';
import { SchedulerService } from '../../handler';
import cronstrue from 'cronstrue';

import {
  Button,
  Card,
  CardContent,
  Stack,
  TextFieldProps
} from '@mui/material';

export interface IJobDefinitionProps {
  model: IJobDefinitionModel;
  refresh: () => void;
  setJobsView: (view: JobsView) => void;
  setListJobsView: (view: ListJobsView) => void;
}

export function JobDefinition(props: IJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const ss = useMemo(() => new SchedulerService({}), []);

  const handleDeleteJobDefinition = async () => {
    await ss.deleteJobDefinition(props.model.definitionId ?? '');
    props.setJobsView('ListJobs');
    props.setListJobsView('JobDefinition');
  };

  const pauseJobDefinition = async () => {
    await ss.pauseJobDefinition(props.model.definitionId);
    props.refresh();
  };

  const resumeJobDefinition = async () => {
    await ss.resumeJobDefinition(props.model.definitionId);
    props.refresh();
  };

  let cronString;
  try {
    if (props.model.schedule !== undefined) {
      cronString = cronstrue.toString(props.model.schedule);
    }
  } catch (e) {
    // Do nothing; let the errors or nothing display instead
  }

  const DefinitionButtonBar = (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      {props.model.active ? (
        <Button variant="outlined" onClick={pauseJobDefinition}>
          {trans.__('Pause')}
        </Button>
      ) : (
        <Button variant="outlined" onClick={resumeJobDefinition}>
          {trans.__('Resume')}
        </Button>
      )}
      <Button
        variant="contained"
        color="error"
        onClick={handleDeleteJobDefinition}
      >
        {trans.__('Delete Job Definition')}
      </Button>
    </Stack>
  );

  const jobDefinitionFields: TextFieldProps[][] = [
    [{ value: props.model.name, label: trans.__('Name') }],
    [
      {
        value: props.model.inputFile,
        label: trans.__('Input file')
      },
      {
        value: props.model.outputPath,
        label: trans.__('Output path')
      }
    ],
    [
      {
        value: props.model.environment,
        label: trans.__('Environment')
      },
      {
        value: props.model.active ? trans.__('Active') : trans.__('Paused'),
        label: trans.__('Status')
      }
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
        value: props.model.schedule ?? '',
        helperText: cronString ?? '',
        label: trans.__('Schedule')
      },
      {
        value: props.model.timezone ?? '',
        label: trans.__('Time zone')
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
        </Stack>
      </CardContent>
    </Card>
  );

  const JobsList = (
    <Card>
      <CardContent>
        <Stack spacing={4}> List of jobs will go here </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      {DefinitionButtonBar}
      {JobDefinition}
      {JobsList}
    </>
  );
}
