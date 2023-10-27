import React, { useMemo, useState } from 'react';

import {
  Alert,
  Button,
  Card,
  CardContent,
  FormLabel,
  Stack
} from '@mui/material';
import { ButtonBar } from '../../components/button-bar';
import { ConfirmDialogDeleteButton } from '../../components/confirm-dialog-buttons';
import cronstrue from 'cronstrue';
import {
  IJobDefinitionModel,
  JobsView,
  ICreateJobModel,
  emptyCreateJobModel
} from '../../model';
import {
  ILabeledValueProps,
  LabeledValue
} from '../../components/labeled-value';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ListJobsTable } from '../list-jobs';
import { NotificationsConfigDetails } from '../../components/notification-detail';
import { Scheduler as SchedulerTokens } from '../../tokens';
import { SchedulerService } from '../../handler';
import { timestampLocalize } from './job-detail';
import { useEventLogger, useTranslator } from '../../hooks';

export interface IJobDefinitionProps {
  app: JupyterFrontEnd;
  model: IJobDefinitionModel | null;
  refresh: () => void;
  setJobsView: (view: JobsView) => void;
  showJobDetail: (jobId: string) => void;
  showCreateJob: (state: ICreateJobModel) => void;
  editJobDefinition: (jobDefinition: IJobDefinitionModel) => void;
  advancedOptions: React.FunctionComponent<SchedulerTokens.IAdvancedOptionsProps>;
  reload: () => void;
}

export function JobDefinition(props: IJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const [displayError, setDisplayError] = useState<string | null>(null);
  const ss = useMemo(() => new SchedulerService({}), []);
  const log = useEventLogger();

  const ReloadButton = (
    <Button
      variant="contained"
      onClick={e => {
        log('job-definition-detail.reload');
        props.reload();
      }}
    >
      {trans.__('Reload Job Definition')}
    </Button>
  );

  const ErrorBanner = displayError && (
    <Alert severity="error">{displayError}</Alert>
  );

  if (props.model === null) {
    return (
      <>
        {ErrorBanner}
        <ButtonBar>{ReloadButton}</ButtonBar>
      </>
    );
  }
  const model: IJobDefinitionModel = props.model;

  const handleDeleteJobDefinition = async () => {
    ss.deleteJobDefinition(model.definitionId ?? '')
      .then(_ => props.setJobsView(JobsView.ListJobDefinitions))
      .catch((e: Error) => setDisplayError(e.message));
  };

  const pauseJobDefinition = async () => {
    setDisplayError(null);
    ss.pauseJobDefinition(model.definitionId)
      .then(_ => props.refresh())
      .catch((e: Error) => setDisplayError(e.message));
  };

  const resumeJobDefinition = async () => {
    setDisplayError(null);
    ss.resumeJobDefinition(model.definitionId)
      .then(_ => props.refresh())
      .catch((e: Error) => setDisplayError(e.message));
  };

  const runJobDefinition = () => {
    const initialState: ICreateJobModel = {
      ...emptyCreateJobModel(),
      jobName: model.name,
      inputFile: model.inputFile,
      outputPath: model.outputPrefix ?? '',
      environment: model.environment,
      computeType: model.computeType,
      runtimeEnvironmentParameters: model.runtimeEnvironmentParameters,
      parameters: model.parameters,
      outputFormats: model.outputFormats,
      jobDefinitionId: model.definitionId
    };

    props.showCreateJob(initialState);
    props.setJobsView(JobsView.CreateFromJobDescriptionForm);
  };

  let cronString;
  try {
    if (model.schedule !== undefined) {
      cronString = cronstrue.toString(model.schedule);
    }
  } catch (e) {
    // Do nothing; let the errors or nothing display instead
  }

  const DefinitionButtonBar = (
    <ButtonBar>
      {ReloadButton}
      <Button
        variant="outlined"
        onClick={e => {
          log('job-definition-detail.run');
          runJobDefinition();
        }}
      >
        {trans.__('Run Job')}
      </Button>
      {model.active ? (
        <Button
          variant="outlined"
          onClick={e => {
            log('job-definition-detail.pause');
            pauseJobDefinition();
          }}
        >
          {trans.__('Pause')}
        </Button>
      ) : (
        <Button
          variant="outlined"
          onClick={e => {
            log('job-definition-detail.resume');
            resumeJobDefinition();
          }}
        >
          {trans.__('Resume')}
        </Button>
      )}
      <Button
        variant="outlined"
        onClick={() => {
          log('job-definition-detail.edit');
          props.editJobDefinition(model);
        }}
      >
        {trans.__('Edit Job Definition')}
      </Button>
      <ConfirmDialogDeleteButton
        handleDelete={async () => {
          log('job-definition-detail.delete');
          handleDeleteJobDefinition();
        }}
        title={trans.__('Delete Job Definition')}
        dialogText={trans.__(
          'Are you sure that you want to delete this job definition?'
        )}
      />
    </ButtonBar>
  );

  const jobDefinitionFields: ILabeledValueProps[][] = [
    [{ value: model.name, label: trans.__('Name') }],
    [
      {
        value: model.inputFile,
        label: trans.__('Input file')
      },
      {
        value: model.outputPath,
        label: trans.__('Output directory')
      }
    ],
    [
      {
        value: model.environment,
        label: trans.__('Environment')
      },
      {
        value: model.active ? trans.__('Active') : trans.__('Paused'),
        label: trans.__('Status')
      }
    ],
    [
      {
        value: timestampLocalize(model.createTime ?? ''),
        label: trans.__('Created at')
      },
      {
        value: timestampLocalize(model.updateTime ?? ''),
        label: trans.__('Updated at')
      }
    ],
    [
      {
        value: model.schedule ?? '',
        helperText: cronString ?? '',
        label: trans.__('Schedule')
      },
      {
        value: model.timezone ?? '',
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
            model={model}
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
            jobDefinitionId={model.definitionId}
            pageSize={5}
            emptyRowMessage={trans.__(
              'No notebook jobs associated with this job definition.'
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      {ErrorBanner}
      {DefinitionButtonBar}
      {JobDefinition}
      {JobsList}
      {props.model.notificationsConfig && (
        <NotificationsConfigDetails
          notificationsConfig={props.model.notificationsConfig}
        />
      )}
      {AdvancedOptions}
    </>
  );
}
