import React, { ChangeEvent, useState } from 'react';

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

export function parameterNameMatch(elementName: string): number | null {
  const parameterNameMatch = elementName.match(/^parameter-(\d+)-name$/);

  if (parameterNameMatch === null) {
    return null;
  }

  return parseInt(parameterNameMatch[1]);
}

export function parameterValueMatch(elementName: string): number | null {
  const parameterValueMatch = elementName.match(/^parameter-(\d+)-value$/);

  if (parameterValueMatch === null) {
    return null;
  }

  return parseInt(parameterValueMatch[1]);
}

export function ParametersPicker(props: ParametersPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  // Keep an internal state of parameters to prevent the cursor from jumping to the end
  // of text boxes after the model updates.
  const [parameters, setParameters] = useState<IJobParameter[]>(props.value);

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;

    // Update the local state.
    const newParams = parameters || [];
    const parameterNameIdx = parameterNameMatch(target.name);
    const parameterValueIdx = parameterValueMatch(target.name);
    if (parameterNameIdx !== null) {
      newParams[parameterNameIdx].name = target.value;
    } else if (parameterValueIdx !== null) {
      newParams[parameterValueIdx].value = target.value;
    }
    setParameters(newParams);

    props.onChange(event);
  };

  return (
    <Stack spacing={2}>
      <InputLabel>{props.label}</InputLabel>
      {parameters.map((param, paramIdx) => (
        <Cluster key={paramIdx} justifyContent="flex-start">
          <TextField
            name={`parameter-${paramIdx}-name`}
            value={param.name}
            type="text"
            placeholder={trans.__('Name')}
            onChange={changeHandler}
          />
          <TextField
            name={`parameter-${paramIdx}-value`}
            value={param.value}
            type="text"
            placeholder={trans.__('Value')}
            onChange={changeHandler}
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
