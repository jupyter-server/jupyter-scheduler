import React, { ChangeEvent, useState } from 'react';

import { Scheduler } from '../handler';
import { useTranslator } from '../hooks';

export type EnvironmentPickerProps = {
  name: string;
  id: string;
  onChange: (event: ChangeEvent) => void;
  environmentsPromise: Promise<Scheduler.IRuntimeEnvironment[]>;
  initialValue: string;
};

export function EnvironmentPicker(props: EnvironmentPickerProps) {
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
    <select
      name={props.name}
      id={props.id}
      onChange={props.onChange}
      value={props.initialValue}
    >
      <option
        value=""
        title={trans.__('No environment selected')}
        disabled
      ></option>
      {environmentList.map((env, idx) => (
        <option value={env.label} title={env.description} key={idx}>
          {env.name}
        </option>
      ))}
    </select>
  );
}
