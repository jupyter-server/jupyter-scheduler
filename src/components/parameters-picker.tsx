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

  const checkParameterIndex = (idx: number) => {
    const param = props.value[idx];
    // If the parameter is not defined (such as if it was just created) then treat it
    // as invalid.
    const nameInvalid = param === undefined ? true : param.name === '';
    const valueInvalid = param === undefined ? true : param.value === '';

    props.handleErrorsChange({
      ...props.errors,
      [`parameter-${idx}-name`]: nameInvalid
        ? trans.__('No name specified for this parameter.')
        : '',
      [`parameter-${idx}-value`]: valueInvalid
        ? trans.__('No value specified for this parameter.')
        : ''
    });
  };

  const checkParameterElement = (
    e: EventTarget & (HTMLInputElement | HTMLTextAreaElement)
  ) => {
    const paramInputName = e.name;

    const paramMatch = paramInputName.match(/^parameter-(\d+)/);
    if (!paramMatch || paramMatch.length < 2) {
      return; // Invalid parameter name; should not happen
    }
    checkParameterIndex(parseInt(paramMatch[1]));
  };

  return (
    <Stack spacing={2}>
      <InputLabel>{props.label}</InputLabel>
      {props.value.map((param, paramIdx) => {
        const nameHasError = !!props.errors[`parameter-${paramIdx}-name`];
        const valueHasError = !!props.errors[`parameter-${paramIdx}-value`];
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
              onBlur={e => checkParameterElement(e.target)}
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
              onBlur={e => checkParameterElement(e.target)}
              error={valueHasError}
              helperText={props.errors[`parameter-${paramIdx}-value`] ?? ''}
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
            // Assume the parameter will be added at the end.
            const newParamIdx = props.value.length;
            props.addParameter();
            checkParameterIndex(newParamIdx);
            return false;
          }}
          title={trans.__('Add new parameter')}
        />
      </Cluster>
    </Stack>
  );
}
