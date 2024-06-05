import React, { FC } from 'react';

import {
  FormControl,
  MenuItem,
  ListSubheader,
  SelectChangeEvent,
  FormHelperText,
  SelectProps,
  FormLabel,
  Typography,
  InputLabel
} from '@mui/material';
import { Controller, UseControllerProps } from 'react-hook-form';
import { CustomSelect } from '../styled';

type Option = {
  value: string;
  label: string;
};

type Props = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  helperText?: string;
  placeholder?: string;
  onChange?: (event: SelectChangeEvent<string>) => void;
} & UseControllerProps &
  SelectProps<string>;

export type SelectBoxProps = Props & {
  options: Option[];
};

export type GroupSelectBoxProps = Props & {
  options: {
    groupName: string;
    items: Option[];
  }[];
};

const SelectComponent: FC<SelectBoxProps | GroupSelectBoxProps> = props => {
  const labelId = `${props.id}-label`;
  const isRequired = props.rules?.required || props.rules?.validate;

  return (
    <FormControl
      component="fieldset"
      style={{ margin: 0 }}
      disabled={props.disabled}
      sx={{
        '& .MuiInputLabel-shrink': {
          display: 'none'
        }
      }}
    >
      <FormLabel component="legend" focused={false} sx={{ mb: 1 }}>
        {props.label}{' '}
        {isRequired ? null : (
          <Typography variant="caption">- Optional</Typography>
        )}
      </FormLabel>
      <Controller
        {...props}
        control={props.control}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <InputLabel sx={{ color: 'var(--jp-border-color0)' }}>
              {props.placeholder}
            </InputLabel>
            <CustomSelect
              displayEmpty
              value={value}
              id={props.id}
              error={!!error}
              labelId={labelId}
              name={props.name}
              onChange={onChange}
              placeholder={props.label}
              readOnly={props.readOnly}
              // renderValue={(value: string) => {
              //   // TODO: This is really inconvenient.
              //   // Figure out a way to show the labels as placeholder
              //   // and remove this hack
              //   return value && props.renderValue ? (
              //     props.renderValue(value)
              //   ) : (
              //     <FormLabel error={!!error}>
              //       {props.placeholder || props.label}
              //     </FormLabel>
              //   );
              // }}
            >
              {props.children}
            </CustomSelect>
            {error || props.helperText ? (
              <FormHelperText error={!!error}>
                {error?.message || props.helperText}
              </FormHelperText>
            ) : null}
          </>
        )}
      />
    </FormControl>
  );
};

export const FormInputSelectBox: FC<SelectBoxProps> = props => (
  <SelectComponent {...props}>
    {props.options.map((item, idx) => (
      <MenuItem value={item.value} title={item.label} key={idx}>
        {item.label}
      </MenuItem>
    ))}
  </SelectComponent>
);

export const FormInputGroupedSelectBox: FC<GroupSelectBoxProps> = props => (
  <SelectComponent {...props}>
    {props.options.map(({ groupName, items }, idx) => {
      return [
        <ListSubheader>{groupName}</ListSubheader>,
        items.map(item => (
          <MenuItem value={item.value} title={item.label} key={idx}>
            {item.label}
          </MenuItem>
        ))
      ];
    })}
  </SelectComponent>
);
