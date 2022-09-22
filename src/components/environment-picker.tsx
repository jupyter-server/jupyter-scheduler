import { InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React, { useState } from 'react';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

export type EnvironmentPickerProps = {
  label: string;
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

  const labelId = `${props.id}-label`;

  return (
    <>
      <InputLabel id={labelId}>{props.label}</InputLabel>
      <Select
        labelId={labelId}
        name={props.name}
        id={props.id}
        onChange={props.onChange}
        value={props.initialValue}
      >
        {environmentList.map((env, idx) => (
          <MenuItem value={env.label} title={env.description} key={idx}>
            {env.name}
          </MenuItem>
        ))}
      </Select>
    </>
  );
}
