import React, { ChangeEvent } from 'react';
import { JobParameter } from '../create-job-form';

// import { useTranslator } from '../hooks';

import { OutputFormatOption } from '../components/output-format-picker';

export interface CreateJobFormField {
  label: string;
  inputName: string;
  onChange: (event: ChangeEvent<Element>) => void;
  value: any;
}

export interface CreateJobFormTextField extends CreateJobFormField {
  value: string;
}

export interface CreateJobFormEnvironmentField extends CreateJobFormField {
  environmentsPromise: () => Promise<any>;
  value: string;
}

export interface CreateJobFormOutputFormatsField extends CreateJobFormField {
  environment: string;
  value: OutputFormatOption[];
}

export interface CreateJobFormParametersField extends CreateJobFormField {
  value: JobParameter[];
}

export interface CreateJobFormInputsProps {
  formRow: string;
  formLabel: string;
  formPrefix: string;
  formInput: string;
  fields: CreateJobFormField[];
}

export function CreateJobFormInputs(props: CreateJobFormInputsProps) {
  // const trans = useTranslator('jupyterlab');

  return <>
    {props.fields.map((field, idx) => {
      // Start by only handling text fields
      if (typeof field.value !== 'string') {
        return;
      }

      return <div className={props.formRow} key={idx}>
        <label
          className={props.formLabel}
          htmlFor={`${props.formPrefix}${field.inputName}`}>{field.label}</label>
        <input
          type='text'
          className={props.formInput}
          name={field.inputName}
          id={`${props.formPrefix}${field.inputName}`}
          value={field.value}
          onChange={field.onChange} />
      </div>;
    })}
  </>;
}
