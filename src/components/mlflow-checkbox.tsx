import React, { ChangeEvent } from 'react';

import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';

export type MLFlowCheckboxProps = {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function MLFlowCheckbox(props: MLFlowCheckboxProps): JSX.Element {
  return (
    <FormGroup>
      <FormControlLabel
        control={<Checkbox onChange={props.onChange} value={'mlflowLogging'} />}
        label="Log with MLFlow"
      />
    </FormGroup>
  );
}
