import React, { ChangeEvent } from 'react';

import { FormControlLabel, InputLabel, Radio, RadioGroup } from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';
import { ICreateJobModel } from '../model';
import { ScheduleInputs } from './schedule-inputs';
import { Scheduler } from '../tokens';

export type CreateScheduleOptionsProps = {
  label: string;
  name: string;
  id: string;
  model: ICreateJobModel;
  handleModelChange: (model: ICreateJobModel) => void;
  errors: Scheduler.ErrorsType;
  handleErrorsChange: (errors: Scheduler.ErrorsType) => void;
  utcOnly?: boolean;
};

export function CreateScheduleOptions(
  props: CreateScheduleOptionsProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  const labelId = `${props.id}-label`;

  const handleScheduleOptionsChange = (
    event: ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    const name = event.target.name;
    props.handleModelChange({ ...props.model, [name]: value });
  };

  return (
    <Stack spacing={4}>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <RadioGroup
        aria-labelledby={labelId}
        name={props.name}
        value={props.model.createType}
        onChange={handleScheduleOptionsChange}
      >
        <FormControlLabel
          value="Job"
          control={<Radio />}
          label={trans.__('Run now')}
        />
        <FormControlLabel
          value="JobDefinition"
          control={<Radio />}
          label={trans.__('Run on a schedule')}
        />
      </RadioGroup>
      {props.model.createType === 'JobDefinition' && (
        <ScheduleInputs
          idPrefix={`${props.id}-definition-`}
          model={props.model}
          handleModelChange={props.handleModelChange}
          errors={props.errors}
          handleErrorsChange={props.handleErrorsChange}
          utcOnly={props.utcOnly}
        />
      )}
    </Stack>
  );
}
