import React, { useMemo } from 'react';
import {
  IJobDefinitionModel,
  JobsView,
  ICreateJobModel,
  emptyCreateJobModel
} from '../../model';
import { useTranslator } from '../../hooks';
import { timestampLocalize } from './job-detail';
import { SchedulerService } from '../../handler';
import cronstrue from 'cronstrue';
import { ListJobsTable } from '../list-jobs';
import { Scheduler as SchedulerTokens } from '../../tokens';

import { Button, Card, CardContent, FormLabel, Stack } from '@mui/material';
import { ConfirmDeleteButton } from '../../components/confirm-delete-button';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  ILabeledValueProps,
  LabeledValue
} from '../../components/labeled-value';

export interface IJobDefinitionProps {
  app: JupyterFrontEnd;
  model: IJobDefinitionModel;
  refresh: () => void;
  setJobsView: (view: JobsView) => void;
  showJobDetail: (jobId: string) => void;
  showCreateJob: (state: ICreateJobModel) => void;
  editJobDefinition: (jobDefinition: IJobDefinitionModel) => void;
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

  const runJobDefinition = () => {
    const initialState: ICreateJobModel = {
      ...emptyCreateJobModel(),
      inputFile: props.model.inputFile,
      outputPath: props.model.outputPrefix ?? '',
      environment: props.model.environment,
      computeType: props.model.computeType,
      runtimeEnvironmentParameters: props.model.runtimeEnvironmentParameters,
      parameters: props.model.parameters,
      outputFormats: props.model.outputFormats,
      jobDefinitionId: props.model.definitionId
    };

    props.showCreateJob(initialState);
    props.setJobsView(JobsView.CreateFromJobDescriptionForm);
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
      <Button variant="outlined" onClick={runJobDefinition}>
        {trans.__('Run Job')}
      </Button>
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
        variant="outlined"
        onClick={() => props.editJobDefinition(props.model)}
      >
        {trans.__('Edit Job Definition')}
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

  const jobDefinitionFields: ILabeledValueProps[][] = [
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
                <LabeledValue
                  {...textProp}
                  style={{
                    flex: '1 1 49%'
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
