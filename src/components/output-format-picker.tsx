import React, { ChangeEvent, useMemo } from 'react';
import { Scheduler } from '../handler';

export interface OutputFormatOption {
  readonly name: string;
  readonly label: string;
}

export type OutputFormatPickerProps = {
  name: string;
  id: string;
  environment: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: OutputFormatOption[];
  // CSS classes for output elements
  rowClassName: string;
  labelClassName: string;
  inputClassName: string;
};

export function outputFormatsForEnvironment(
  environment: string
): OutputFormatOption[] | null {
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

  return environmentObj['output_formats'] as OutputFormatOption[];
}

export function OutputFormatPicker(props: OutputFormatPickerProps) {
  const outputFormats = useMemo(
    () => outputFormatsForEnvironment(props.environment),
    [props.environment]
  );
  if (outputFormats === null) {
    return null;
  }

  return (
    <div className={props.rowClassName}>
      <label className={props.labelClassName}>Output formats</label>
      <div className={props.inputClassName}>
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
      </div>
    </div>
  );
}
