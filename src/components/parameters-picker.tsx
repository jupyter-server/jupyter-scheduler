import React, { ChangeEvent } from 'react';

import { InputLabel, TextField } from '@mui/material';
import Stack from '@mui/system/Stack';

import { Cluster } from '../components/cluster';
import { IJobParameter } from '../model';
import { useTranslator } from '../hooks';
import { AddButton, DeleteButton } from './icon-buttons';
import { Scheduler } from '../tokens';

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
  errors: Scheduler.ErrorsType;
  handleErrorsChange: (errors: Scheduler.ErrorsType) => void;
};

export function ParametersPicker(props: ParametersPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const checkParameter = (
    e: EventTarget & (HTMLInputElement | HTMLTextAreaElement)
  ) => {
    const paramInputName = e.name;

    const paramMatch = paramInputName.match(/^parameter-(\d+)/);
    if (!paramMatch || paramMatch.length < 2) {
      return; // Invalid parameter name; should not happen
    }
    const paramIdx = parseInt(paramMatch[1]);

    const param = props.value[paramIdx];
    const invalid = param.name === '' && param.value !== '';

    props.handleErrorsChange({
      ...props.errors,
      [`parameter-${paramIdx}-name`]: invalid
        ? trans.__('No name specified for this parameter.')
        : ''
    });
  };

  return (
    <Stack spacing={2}>
      <InputLabel>{props.label}</InputLabel>
      {props.value.map((param, paramIdx) => {
        const nameHasError = !!props.errors[`parameter-${paramIdx}-name`];
        return (
          <Cluster
            key={paramIdx}
            justifyContent="flex-start"
            alignItems="start"
          >
            <TextField
              name={`parameter-${paramIdx}-name`}
              value={param.name}
              type="text"
              placeholder={trans.__('Name')}
              onBlur={e => checkParameter(e.target)}
              error={nameHasError}
              helperText={props.errors[`parameter-${paramIdx}-name`] ?? ''}
              onChange={props.onChange}
              FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }}
              style={{
                flexGrow: 1
              }}
            />
            <TextField
              name={`parameter-${paramIdx}-value`}
              value={param.value}
              type="text"
              placeholder={trans.__('Value')}
              onBlur={e => checkParameter(e.target)}
              onChange={props.onChange}
              FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }}
              style={{
                flexGrow: 1
              }}
            />
            <DeleteButton
              onClick={() => props.removeParameter(paramIdx)}
              title={trans.__('Delete this parameter')}
              addedStyle={{ marginTop: '14px' }}
            />
          </Cluster>
        );
      })}
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
