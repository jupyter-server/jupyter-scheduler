import React, { ChangeEvent } from 'react';

import { addIcon, closeIcon, LabIcon } from '@jupyterlab/ui-components';

import { IconButton, InputLabel, TextField } from '@mui/material';
import Stack from '@mui/system/Stack';

import { Cluster } from '../components/cluster';
import { IJobParameter } from '../model';
import { useTranslator } from '../hooks';

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
          <IconButton
            aria-label="delete"
            onClick={() => {
              props.removeParameter(paramIdx);
              return false;
            }}
            title={trans.__('Delete this parameter')}
          >
            <LabIcon.resolveReact icon={closeIcon} tag="span" />
          </IconButton>
        </Cluster>
      ))}
      {/* A one-item cluster to prevent the add-param button from being as wide as the widget */}
      <Cluster justifyContent="flex-start">
        <IconButton
          onClick={(e: React.MouseEvent) => {
            props.addParameter();
            return false;
          }}
          title={trans.__('Add new parameter')}
        >
          <LabIcon.resolveReact icon={addIcon} tag="span" />
        </IconButton>
      </Cluster>
    </Stack>
  );
}
