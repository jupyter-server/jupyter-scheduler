import React, { useMemo } from 'react';
import { IJobDefinitionModel, JobsView, ICreateJobModel } from '../../model';
import { useTranslator } from '../../hooks';
import { timestampLocalize } from './job-detail';
import { SchedulerService } from '../../handler';
import cronstrue from 'cronstrue';
import { ListJobsTable } from '../list-jobs';
import { Scheduler as SchedulerTokens } from '../../tokens';

import {
  Button,
  Card,
  CardContent,
  FormLabel,
  Stack,
  TextFieldProps
} from '@mui/material';
import { ConfirmDeleteButton } from '../../components/confirm-delete-button';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReadonlyTextField } from '../../components/readonly-text-field';

export interface IJobDefinitionProps {
  app: JupyterFrontEnd;
  model: IJobDefinitionModel;
  refresh: () => void;
  setJobsView: (view: JobsView) => void;
  showJobDetail: (jobId: string) => void;
  showCreateJob: (state: ICreateJobModel) => void;
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
}

export function JobDefinition(props: IJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const ss = useMemo(() => new SchedulerService({}), []);

  const handleDeleteJobDefinition = async () => {
    await ss.deleteJobDefinition(props.model.definitionId ?? '');
    props.setJobsView(JobsView.ListJobDefinitions);
  };

  const pauseJobDefinition = async () => {
    await ss.pauseJobDefinition(props.model.definitionId);
    props.refresh();
  };

  const resumeJobDefinition = async () => {
    await ss.resumeJobDefinition(props.model.definitionId);
    props.refresh();
  };

  const editJobDefinition = async () => {
    const initialState: ICreateJobModel = {
      jobName: props.model.jobName,
      inputFile: props.model.inputFile,
      outputPath: props.model.outputPrefix ?? '',
      environment: props.model.environment,
      runtimeEnvironmentParameters: props.model.runtimeEnvironmentParameters,
      parameters: props.model.parameters,
      outputFormats: props.model.outputFormats,
      createType: 'JobDefinition',
      scheduleInterval: 'weekday',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    props.showCreateJob(initialState);
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
      <Button variant="outlined" onClick={editJobDefinition}>
        {trans.__('Edit')}
      </Button>
      <ConfirmDeleteButton
        handleDelete={handleDeleteJobDefinition}
        title={trans.__('Delete Job Definition')}
        text={trans.__(
          'Are you sure that you want to delete this job definition?'
        )}
      />
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
        label: trans.__('Output directory')
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
                <ReadonlyTextField
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

  const AdvancedOptions = (
    <Card>
      <CardContent>
        <Stack component="form" spacing={4}>
          <FormLabel component="legend">
            {trans.__('Advanced Options')}
          </FormLabel>
          <props.advancedOptions
            jobsView={JobsView.JobDefinitionDetail}
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

  const JobsList = (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <ListJobsTable
            app={props.app}
            showCreateJob={props.showCreateJob}
            showJobDetail={props.showJobDetail}
            jobDefinitionId={props.model.definitionId}
            pageSize={5}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      {DefinitionButtonBar}
      {JobDefinition}
      {JobsList}
      {AdvancedOptions}
    </>
  );
}
