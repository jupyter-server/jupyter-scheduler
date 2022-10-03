import React from 'react';

import { FormControlLabel, InputLabel, Radio, RadioGroup } from '@mui/material';
import Stack from '@mui/system/Stack';

import { useTranslator } from '../hooks';

export type CreateScheduleOptionsProps = {
  label: string;
  name: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
};

export function CreateScheduleOptions(
  props: CreateScheduleOptionsProps
): JSX.Element | null {
  const trans = useTranslator('jupyterlab');

  const labelId = `${props.id}-label`;

  return (
    <Stack spacing={4}>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <RadioGroup
        aria-labelledby={labelId}
        name={props.name}
        value={props.value}
        onChange={props.onChange}
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
    </Stack>
  );
}
