import React, { ChangeEvent } from 'react';

import {
  Box,
  Button,
  IconButton,
  InputLabel,
  TextField,
  Typography
} from '@mui/material';
import Stack from '@mui/system/Stack';

import { IJobParameter } from '../model';
import { useTranslator } from '../hooks';
import { Workflows } from '../tokens';
import { Add, Close } from '@mui/icons-material';

export type ParametersPickerProps = {
  label: string;
  name: string;
  id: string;
  value: IJobParameter[];
  required?: boolean;
  errors: Workflows.ErrorsType;
  options?: string[];
  onChange: (parameters: IJobParameter[]) => void;
  handleErrorsChange: (errors: Workflows.ErrorsType) => void;
};

function parameterNameMatch(elementName: string): number | null {
  const parameterNameMatch = elementName.match(/^parameter-(\d+)-name$/);

  if (parameterNameMatch === null) {
    return null;
  }

  return parseInt(parameterNameMatch[1]);
}

function parameterValueMatch(elementName: string): number | null {
  const parameterValueMatch = elementName.match(/^parameter-(\d+)-value$/);

  if (parameterValueMatch === null) {
    return null;
  }

  return parseInt(parameterValueMatch[1]);
}

const FIELD_NAME_REGEX = /^parameter-(\d+)/;

export function ParametersPicker(props: ParametersPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const newParams = props.value || [];
    const parameterNameIdx = parameterNameMatch(target.name);
    const parameterValueIdx = parameterValueMatch(target.name);

    if (parameterNameIdx !== null) {
      newParams[parameterNameIdx].name = target.value;
    } else if (parameterValueIdx !== null) {
      newParams[parameterValueIdx].value = target.value;
    }

    props.onChange(newParams);
  };

  const updateErrors = (errors: Record<string, string>) => {
    // Remove all parameter field errors so when a field is deleted,
    // error associated with it is also removed
    const existingErrors = Object.keys(props.errors)
      .filter(key => !FIELD_NAME_REGEX.test(key))
      .reduce((result, key) => ({ ...result, [key]: props.errors[key] }), {});

    props.handleErrorsChange({
      ...existingErrors,
      ...errors
    });
  };

  const checkParameterIndex = (idx: number) => {
    const param = props.value[idx];
    // If the parameter is not defined (such as if it was just created) then treat it
    // as invalid.
    const nameInvalid = param === undefined ? true : param.name === '';
    const valueInvalid = param === undefined ? true : param.value === '';

    updateErrors({
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

  const removeParameter = (idx: number) => {
    const newErrors: Record<string, string> = {};
    const newParams = props.value || [];

    newParams.splice(idx, 1);

    Object.keys(props.errors).forEach(formKey => {
      const paramMatch = formKey.match(FIELD_NAME_REGEX);
      const paramIdx =
        paramMatch && paramMatch.length >= 2 ? parseInt(paramMatch[1]) : -1;

      if (paramIdx === -1 || paramIdx < idx) {
        // restore errors associated with params before deleted param and all
        // other form fields
        newErrors[formKey] = props.errors[formKey];

        return;
      }

      if (paramIdx === idx) {
        // ignore errors associated with deleted param
        return;
      }

      // otherwise, restore errors with params after deleted param by offsetting
      // their index by -1
      newErrors[`parameter-${paramIdx - 1}-name`] =
        props.errors[`parameter-${paramIdx}-name`];
    });

    props.onChange(newParams);
    updateErrors(newErrors);
  };

  const addParameter = () => {
    const newParams = props.value || [];

    newParams.push({ name: '', value: '' });
    props.onChange(newParams);
  };

  const anyErrors = Object.keys(props.errors).some(
    key => key.indexOf('parameter') > -1 && !!props.errors[key]
  );

  return (
    <Stack spacing={2}>
      <InputLabel>
        {props.label}{' '}
        {props.required ? null : (
          <Typography variant="caption">- Optional</Typography>
        )}
      </InputLabel>
      {props.value.map((param, paramIdx) => {
        const nameHasError = !!props.errors[`parameter-${paramIdx}-name`];
        const valueHasError = !!props.errors[`parameter-${paramIdx}-value`];
        return (
          <Box
            gap={1}
            key={paramIdx}
            display="flex"
            flexWrap="nowrap"
            alignItems="flex-start"
          >
            <TextField
              name={`parameter-${paramIdx}-name`}
              value={param.name}
              type="text"
              placeholder={trans.__('Name')}
              onBlur={e => checkParameterElement(e.target)}
              error={nameHasError}
              helperText={props.errors[`parameter-${paramIdx}-name`] ?? ''}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }}
              style={{ flexGrow: 1 }}
            />
            <TextField
              name={`parameter-${paramIdx}-value`}
              value={param.value}
              type="text"
              placeholder={trans.__('Value')}
              onBlur={e => checkParameterElement(e.target)}
              error={valueHasError}
              helperText={props.errors[`parameter-${paramIdx}-value`] ?? ''}
              onChange={handleInputChange}
              FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }}
              style={{ flexGrow: 1 }}
            />
            <IconButton
              aria-label="delete"
              onClick={() => removeParameter(paramIdx)}
              title={trans.__('Delete this parameter')}
              sx={{ lineHeight: 0, mt: 3 }}
            >
              <Close />
            </IconButton>
          </Box>
        );
      })}
      {/* A one-item cluster to prevent the add-param button from being as wide as the widget */}
      <Stack
        direction="row"
        justifyContent="flex-start"
        sx={{
          color: 'text.secondary'
        }}
      >
        <Button
          variant="text"
          color="inherit"
          startIcon={<Add />}
          disabled={anyErrors}
          onClick={(e: React.MouseEvent) => {
            // Assume the parameter will be added at the end.
            const newParamIdx = props.value.length;

            addParameter();
            checkParameterIndex(newParamIdx);
            return false;
          }}
          title={trans.__('Add new parameter')}
        >
          {trans.__('Add')}
        </Button>
      </Stack>
    </Stack>
  );
}
