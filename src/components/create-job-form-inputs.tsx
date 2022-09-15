import React, { ChangeEvent } from 'react';
import { JobParameter } from '../create-job-form';

import {
  OutputFormatOption,
  OutputFormatPicker
} from '../components/output-format-picker';
import { EnvironmentPicker } from './environment-picker';
import { ParametersPicker } from './parameters-picker';

export interface CreateJobFormField {
  label: string;
  inputName: string;
  inputType: 'text' | 'environment' | 'outputFormats' | 'parameters';
  // Could be an Element, HTMLInputElement, or HTMLSelectElement
  onChange: (event: ChangeEvent<any>) => void;
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
  addParameter: () => void;
  removeParameter: (idx: number) => void;
}

export interface CreateJobFormInputsProps {
  formRow: string;
  formLabel: string;
  formPrefix: string;
  formInput: string;
  fields: CreateJobFormField[];
}

export function CreateJobFormInputs(props: CreateJobFormInputsProps) {
  return (
    <>
      {props.fields.map((field, idx) => {
        // Handle environment selector
        let formInputElement: JSX.Element | null = null;
        const formInputId = `${props.formPrefix}${field.inputName}`;

        switch (field.inputType) {
          // Environment picker
          case 'environment':
            const envField = field as CreateJobFormEnvironmentField;
            formInputElement = (
              <EnvironmentPicker
                name={field.inputName}
                id={formInputId}
                onChange={field.onChange}
                environmentsPromise={envField.environmentsPromise()}
                initialValue={field.value}
              />
            );
            break;
          case 'outputFormats':
            const ofField = field as CreateJobFormOutputFormatsField;

            // If no environment is selected, do not display output formats.
            if (ofField.environment === '') {
              return null;
            }

            formInputElement = (
              <OutputFormatPicker
                name={field.inputName}
                id={formInputId}
                onChange={field.onChange}
                environment={ofField.environment}
                value={ofField.value}
              />
            );
            break;
          case 'parameters':
            const pField = field as CreateJobFormParametersField;

            formInputElement = (
              <ParametersPicker
                name={field.inputName}
                id={formInputId}
                value={pField.value}
                onChange={field.onChange}
                addParameter={pField.addParameter}
                removeParameter={pField.removeParameter}
                formPrefix={props.formPrefix}
              />
            );
            break;
          default: // text field
            formInputElement = (
              <input
                type="text"
                className={props.formInput}
                name={field.inputName}
                id={formInputId}
                value={field.value}
                onChange={field.onChange}
              />
            );
        }

        return (
          <div className={props.formRow} key={idx}>
            <label
              className={props.formLabel}
              htmlFor={`${props.formPrefix}${field.inputName}`}
            >
              {field.label}
            </label>
            <div className={props.formInput}>{formInputElement}</div>
          </div>
        );
      })}
    </>
  );
}
