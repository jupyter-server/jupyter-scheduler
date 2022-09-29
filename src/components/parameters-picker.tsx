import React, { ChangeEvent } from 'react';

import { InputLabel, TextField } from '@mui/material';
import Stack from '@mui/system/Stack';

import { Cluster } from '../components/cluster';
import { IJobParameter } from '../model';
import { useTranslator } from '../hooks';
import { AddButton, DeleteButton } from './icon-buttons';

export type ParametersPickerProps = {
  label: string;
  name: string;
  id: string;
  value: IJobParameter[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  addParameter: () => void;
  removeParameter: (idx: number) => void;
  // CSS classes for elements
  formPrefix: string;
};

export function ParametersPicker(props: ParametersPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  return (
    <Stack spacing={2}>
      <InputLabel>{props.label}</InputLabel>
      {props.value.map((param, paramIdx) => (
        <Cluster key={paramIdx} justifyContent="flex-start">
          <TextField
            name={`parameter-${paramIdx}-name`}
            value={param.name}
            type="text"
            placeholder={trans.__('Name')}
            onChange={props.onChange}
          />
          <TextField
            name={`parameter-${paramIdx}-value`}
            value={param.value}
            type="text"
            placeholder={trans.__('Value')}
            onChange={props.onChange}
          />
          <DeleteButton
            onClick={() => {
              props.removeParameter(paramIdx);
              return false;
            }}
            title={trans.__('Delete this parameter')}
          />
        </Cluster>
      ))}
      {/* A one-item cluster to prevent the add-param button from being as wide as the widget */}
      <Cluster justifyContent="flex-start">
        <AddButton
          onClick={(e: React.MouseEvent) => {
            props.addParameter();
            return false;
          }}
          title={trans.__('Add new parameter')}
        />
      </Cluster>
    </Stack>
  );
}
