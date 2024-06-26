import React, { FC } from 'react';

import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Stack,
  Typography
} from '@mui/material';
import {
  Controller,
  UseControllerProps,
  useFormContext
} from 'react-hook-form';

export type CheckboxListProps = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
} & UseControllerProps;

export const FormInputCheckboxList: FC<CheckboxListProps> = props => {
  const methods = useFormContext();
  const { formState } = methods;
  const isRequired = props.rules?.required || props.rules?.validate;

  // Don't display anything, not even the label, if there are no values
  if (props.options === null || props.options.length === 0) {
    return null;
  }

  return (
    <Stack>
      <InputLabel required={props.required}>
        {props.label}{' '}
        {isRequired ? null : (
          <Typography variant="caption">- Optional</Typography>
        )}
      </InputLabel>
      <Stack direction="column" justifyContent="flex-start">
        {props.options.map((of, idx) => (
          <FormControlLabel
            key={idx}
            label={of.label}
            sx={{ m: 0 }}
            control={
              <Controller
                {...props}
                name={props.name}
                render={({
                  field: { value, onChange },
                  fieldState: { error }
                }) => (
                  <Checkbox
                    required={props.required}
                    id={`${props.id}-${of.value}`}
                    value={of.value}
                    sx={{ ml: '-9px' }} // negative margin to ignore the padding for ripple effect animation
                    onChange={event => {
                      const currentValue = (value || []) as string[];
                      const formatName = event.target.value;
                      const isChecked = event.target.checked;

                      const nextValue = isChecked
                        ? [...currentValue, formatName]
                        : currentValue.filter(v => v !== formatName);

                      onChange(nextValue);
                    }}
                    style={{ color: error ? 'red' : undefined }}
                    checked={(value || []).some(
                      (sof: string) => of.value === sof
                    )}
                  />
                )}
                control={props.control}
              />
            }
          />
        ))}
      </Stack>
      {formState.errors[props.name] ? (
        <FormHelperText error>
          {formState.errors[props.name]?.message as string}
        </FormHelperText>
      ) : null}
    </Stack>
  );
};
