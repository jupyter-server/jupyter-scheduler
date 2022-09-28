import React, { ChangeEvent } from 'react';

import { Stack, TextField } from '@mui/material';

import { useTranslator } from './hooks';
import Scheduler from './tokens';

const AdvancedOptions = (
  props: Scheduler.IAdvancedOptionsProps
): JSX.Element => {
  const formPrefix = 'jp-create-job-advanced-';

  const trans = useTranslator('jupyterlab');

  // Cache text inputs so that React can update their state immediately, preventing
  // a situation where the cursor jumps to the end of the text box after the user
  // enters a character mid-input.
  const [textInputs, setTextInputs] = React.useState<Record<string, string>>(
    {}
  );

  const handleInputChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;

    const value = target.value;
    const name = target.name;

    setTextInputs({ ...textInputs, [name]: value });
    props.handleModelChange({ ...props.model, [name]: value });
  };

  return (
    <Stack spacing={4}>
      <TextField
        label={trans.__('Idempotency token')}
        variant="outlined"
        onChange={handleInputChange}
        value={textInputs['idempotencyToken'] ?? props.model.idempotencyToken}
        id={`${formPrefix}idempotencyToken`}
        name="idempotencyToken"
        disabled={props.jobsView !== 'CreateJob'}
      />
    </Stack>
  );
};

export default AdvancedOptions;
