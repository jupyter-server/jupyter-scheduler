import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useState } from 'react';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

export type EnvironmentPickerProps = {
  name: string;
  id: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  environmentsPromise: Promise<Scheduler.IRuntimeEnvironment[]>;
  initialValue: string;
};

export function EnvironmentPicker(props: EnvironmentPickerProps): JSX.Element {
  const [environmentList, setEnvironmentList] = useState(
    [] as Scheduler.IRuntimeEnvironment[]
  );
  const trans = useTranslator('jupyterlab');

  React.useEffect(() => {
    props.environmentsPromise.then(envList => setEnvironmentList(envList));
  }, []);

  if (environmentList.length === 0) {
    return <em>{trans.__('Loading …')}</em>;
  }

  return (
    <Select
      name={props.name}
      id={props.id}
      onChange={props.onChange}
      value={props.initialValue}
    >
      <MenuItem disabled value="">
        <em>{trans.__('No environment selected')}</em>
      </MenuItem>
      {environmentList.map((env, idx) => (
        <MenuItem value={env.label} title={env.description} key={idx}>
          {env.name}
        </MenuItem>
      ))}
    </Select>
  );
}
