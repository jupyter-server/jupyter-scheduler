import React, { ChangeEvent, useMemo } from 'react';
import { Scheduler } from '../handler';
import { IOutputFormat } from '../model';

export type OutputFormatPickerProps = {
  name: string;
  id: string;
  environment: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: IOutputFormat[];
};

export function outputFormatsForEnvironment(
  environment: string
): IOutputFormat[] | null {
  // Retrieve the environment data from session storage.
  const environmentsData = sessionStorage.getItem('environments');
  if (environmentsData === null) {
    return null;
  }

  const environments = JSON.parse(
    environmentsData
  ) as Array<Scheduler.IRuntimeEnvironment>;
  const environmentObj = environments.find(env => env.name === environment);
  if (!environmentObj || !environmentObj['output_formats']) {
    return null;
  }

  return environmentObj['output_formats'] as IOutputFormat[];
}

export function OutputFormatPicker(
  props: OutputFormatPickerProps
): JSX.Element | null {
  const outputFormats = useMemo(
    () => outputFormatsForEnvironment(props.environment),
    [props.environment]
  );
  if (outputFormats === null) {
    return null;
  }

  return (
    <ul className="jp-notebook-job-output-formats-options">
      {outputFormats.map((of, idx) => (
        <li key={idx}>
          <label>
            <input
              type="checkbox"
              id={`${props.id}-${of.name}`}
              value={of.name}
              onChange={props.onChange}
              checked={props.value.some(sof => of.name === sof.name)}
            />{' '}
            {of.label}
          </label>
        </li>
      ))}
    </ul>
  );
}
