import React, { ChangeEvent, useCallback, useState } from 'react';

import { InputLabel, TextField } from '@mui/material';
import Stack from '@mui/system/Stack';

import { Cluster } from '../components/cluster';
import { IJobParameter } from '../model';
import { useTranslator } from '../hooks';
import { AddButton, DeleteButton } from './icon-buttons';
import Scheduler from '../tokens';

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

const useForceUpdate = () => {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return update;
};

export function ParametersPicker(props: ParametersPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const update = useForceUpdate();

  const checkParameter = (
    e: EventTarget & (HTMLInputElement | HTMLTextAreaElement)
  ) => {
    const paramInputName = e.name;

    const paramMatch = paramInputName.match(/^parameter-(\d+)/);
    if (paramMatch === null) {
      return; // Invalid parameter name; should not happen
    }
    const paramIdx = parseInt(paramMatch[1]);

    const modifiedParam = props.value[paramIdx];
    const paramName = modifiedParam.name;
    const paramValue = modifiedParam.value;

    if (paramName === '' && paramValue !== '') {
      const newErrors: Scheduler.ErrorsType = props.errors;
      newErrors['parameter-' + paramIdx + '-name'] = trans.__(
        'No name specified for this parameter.'
      );
      props.handleErrorsChange(newErrors);
    } else {
      const newErrors: Scheduler.ErrorsType = props.errors;
      newErrors['parameter-' + paramIdx + '-name'] = '';
      props.handleErrorsChange(newErrors);
    }

    // Force a rerender.
    update();
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
            />
            <TextField
              name={`parameter-${paramIdx}-value`}
              value={param.value}
              type="text"
              placeholder={trans.__('Value')}
              onBlur={e => checkParameter(e.target)}
              onChange={props.onChange}
            />
            {/* The addedStyle will probably have to be changed again once MUI is restyled to have smaller text box height */}
            <DeleteButton
              onClick={() => {
                props.removeParameter(paramIdx);
                return false;
              }}
              title={trans.__('Delete this parameter')}
              addedStyle={{ marginTop: '12px' }}
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
