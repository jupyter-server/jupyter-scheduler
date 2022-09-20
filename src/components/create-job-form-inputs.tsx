import React, { ChangeEvent } from 'react';
import { JobParameter } from '../create-job-form';

import {
  IOutputFormatOption,
  OutputFormatPicker
} from '../components/output-format-picker';
import { EnvironmentPicker } from './environment-picker';
import { ParametersPicker } from './parameters-picker';
import { Cluster } from './cluster';

export interface ICreateJobFormField {
  label: string;
  inputName: string;
  inputType: 'text' | 'environment' | 'outputFormats' | 'parameters';
  // Could be an Element, HTMLInputElement, or HTMLSelectElement
  onChange: (event: ChangeEvent<any>) => void;
  value: any;
}

export interface ICreateJobFormTextField extends ICreateJobFormField {
  value: string;
}

export interface ICreateJobFormEnvironmentField extends ICreateJobFormField {
  environmentsPromise: () => Promise<any>;
  value: string;
}

export interface ICreateJobFormOutputFormatsField extends ICreateJobFormField {
  environment: string;
  value: IOutputFormatOption[];
}

export interface ICreateJobFormParametersField extends ICreateJobFormField {
  value: JobParameter[];
  addParameter: () => void;
  removeParameter: (idx: number) => void;
}

export interface ICreateJobFormInputsProps {
  formRow: string;
  formLabel: string;
  formPrefix: string;
  formInput: string;
  fields: ICreateJobFormField[];
}

export function CreateJobFormInputs(
  props: ICreateJobFormInputsProps
): JSX.Element {
  return (
    <>
      {props.fields.map((field, idx) => {
        // Handle environment selector
        let formInputElement: JSX.Element | null = null;
        const formInputId = `${props.formPrefix}${field.inputName}`;

        switch (field.inputType) {
          // Environment picker
          case 'environment':
            formInputElement = (
              <EnvironmentPicker
                name={field.inputName}
                id={formInputId}
                onChange={field.onChange}
                environmentsPromise={(
                  field as ICreateJobFormEnvironmentField
                ).environmentsPromise()}
                initialValue={field.value}
              />
            );
            break;
          case 'outputFormats':
            // If no environment is selected, do not display output formats.
            if (
              (field as ICreateJobFormOutputFormatsField).environment === ''
            ) {
              return null;
            }

            formInputElement = (
              <OutputFormatPicker
                name={field.inputName}
                id={formInputId}
                onChange={field.onChange}
                environment={
                  (field as ICreateJobFormOutputFormatsField).environment
                }
                value={(field as ICreateJobFormOutputFormatsField).value}
              />
            );
            break;
          case 'parameters':
            formInputElement = (
              <ParametersPicker
                name={field.inputName}
                id={formInputId}
                value={(field as ICreateJobFormParametersField).value}
                onChange={field.onChange}
                addParameter={
                  (field as ICreateJobFormParametersField).addParameter
                }
                removeParameter={
                  (field as ICreateJobFormParametersField).removeParameter
                }
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
          // <div className={props.formRow} key={idx}>
          <div style={{ display: 'none' }}>
            <Cluster gap={2}>
              <label
                className={props.formLabel}
                htmlFor={`${props.formPrefix}${field.inputName}`}
              >
                {field.label}:
              </label>
              {formInputElement}
            </Cluster>
          </div>
        );
      })}
    </>
  );
}
