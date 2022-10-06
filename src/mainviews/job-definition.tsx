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
import { TextFieldStyled } from './job-detail';

export interface IJobDefinitionProps {
  model: IJobDefinitionModel;
  setView: (view: JobsView) => void;
}

export function JobDefinition(props: IJobDefinitionProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

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
          {props.model.name ?? props.model.job_definition_id}
        </Typography>
      </Breadcrumbs>
    </div>
  );

  const DefinitionButtonBar = (
    <Stack direction="row" gap={2} justifyContent="flex-end" flexWrap={'wrap'}>
      <Button
        variant="outlined"
        onClick={() => console.log('pause definition')}
      >
        {trans.__('Pause Job Definition')}
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => console.log('delete definition')}
      >
        {trans.__('Delete Job Definition')}
      </Button>
    </Stack>
  );

  const jobDefinitionFields: TextFieldProps[][] = [
    // [
    //   {
    //     defaultValue: mockJobDefinition.name,
    //     label: trans.__('Job Definition name')
    //   },
    //   {
    //     defaultValue: mockJobDefinition.job_definition_id,
    //     label: trans.__('Job Definition ID')
    //   }
    // ],
    // [
    //   {
    //     defaultValue: mockJobDefinition.input_path,
    //     label: trans.__('Input path')
    //   },
    //   {
    //     defaultValue: mockJobDefinition.output_path,
    //     label: trans.__('Output path')
    //   }
    // ],
    // [
    //   {
    //     defaultValue: mockJobDefinition.last_modified_time,
    //     label: trans.__('Modified at')
    //   }
    // ]
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
      {DefinitionButtonBar}
      {JobDefinition}
    </>
  );
}
