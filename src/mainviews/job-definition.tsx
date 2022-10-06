import React from 'react';

import { IJobDefinitionModel, JobsView } from '../model';
import { useTranslator } from '../hooks';

import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextFieldProps,
  Typography
} from '@mui/material';
import { TextFieldStyled, timestampLocalize } from './job-detail';
import { Heading } from '../components/heading';
import { SchedulerService } from '../handler';

export interface IJobDefinitionProps {
  model: IJobDefinitionModel;
  setView: (view: JobsView) => void;
}

export function JobDefinition(props: IJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const ss = new SchedulerService({});

  const handleDeleteJobDefinition = async () => {
    await ss.deleteJob(props.model.definitionId ?? '');
    props.setView('ListJobs');
  };

  const DefinitionBreadcrumbsStyled = (
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
          {trans.__('Notebook Job Definitions')}
        </Link>
        <Typography color="text.primary">
          {props.model.name ?? props.model.definitionId}
        </Typography>
      </Breadcrumbs>
    </div>
  );

  const DefinitionButtonBar = (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
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
    [{ defaultValue: props.model.name, label: trans.__('Name') }],
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
      { defaultValue: props.model.active ?? '', label: trans.__('Status') }
    ],
    [
      {
        defaultValue: timestampLocalize(props.model.createTime ?? ''),
        label: trans.__('Created at')
      },
      {
        defaultValue: timestampLocalize(props.model.updateTime ?? ''),
        label: trans.__('Updated at')
      }
    ],
    [
      {
        defaultValue: props.model.schedule ?? '',
        label: trans.__('Schedule')
      },
      {
        defaultValue: props.model.timezone ?? '',
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
          {/* {mockJobDefinition.job_ids.length && (
            <>
              <FormLabel component="legend">{trans.__('Jobs')}</FormLabel>
              {mockJobDefinition.job_ids.map(jobId => (
                <Link
                  key={jobId}
                  title={trans.__('Open Job "%1"', jobId)}
                  onClick={(
                    e:
                      | React.MouseEvent<HTMLSpanElement, MouseEvent>
                      | React.MouseEvent<HTMLAnchorElement, MouseEvent>
                  ) => {
                    const newModel: IJobDetailModel = {
                      jobId: jobId,
                      jobName: '',
                      inputFile: '',
                      environment: '',
                      outputPath: '',
                      detailType: 'Job',
                      createType: 'Job'
                    };
                    props.handleModelChange(newModel);
                  }}
                  style={{ paddingRight: '1em' }}
                >
                  {jobId}
                </Link>
              ))}
            </>
          )} */}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      {DefinitionBreadcrumbsStyled}
      <Heading level={1}>{trans.__('Job Detail')}</Heading>
      {DefinitionButtonBar}
      {JobDefinition}
    </>
  );
}
