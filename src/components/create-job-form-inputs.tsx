import React, { ChangeEvent } from 'react';
import { IJobParameter, IOutputFormat } from '../model';

import { OutputFormatPicker } from '../components/output-format-picker';
import { EnvironmentPicker } from './environment-picker';
import { ParametersPicker } from './parameters-picker';
import { Cluster } from './cluster';

export interface ICreateJobField {
  label: string;
  inputName: string;
  inputType: 'text' | 'environment' | 'outputFormats' | 'parameters';
  // Could be an Element, HTMLInputElement, or HTMLSelectElement
  onChange: (event: ChangeEvent<any>) => void;
  value: any;
}

export interface ICreateJobTextField extends ICreateJobField {
  value: string;
}

export interface ICreateJobEnvironmentField extends ICreateJobField {
  environmentsPromise: () => Promise<any>;
  value: string;
}

export interface ICreateJobOutputFormatsField extends ICreateJobField {
  environment: string;
  value: IOutputFormat[];
}

export interface ICreateJobParametersField extends ICreateJobField {
  value: IJobParameter[];
  addParameter: () => void;
  removeParameter: (idx: number) => void;
}

export interface ICreateJobInputsProps {
  formRow: string;
  formLabel: string;
  formPrefix: string;
  formInput: string;
  fields: ICreateJobField[];
}

export function CreateJobInputs(props: ICreateJobInputsProps): JSX.Element {
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
                  field as ICreateJobEnvironmentField
                ).environmentsPromise()}
                initialValue={field.value}
              />
            );
            break;
          case 'outputFormats':
            // If no environment is selected, do not display output formats.
            if ((field as ICreateJobOutputFormatsField).environment === '') {
              return null;
            }

            formInputElement = (
              <OutputFormatPicker
                name={field.inputName}
                id={formInputId}
                onChange={field.onChange}
                environment={
                  (field as ICreateJobOutputFormatsField).environment
                }
                value={(field as ICreateJobOutputFormatsField).value}
              />
            );
            break;
          case 'parameters':
            formInputElement = (
              <ParametersPicker
                name={field.inputName}
                id={formInputId}
                value={(field as ICreateJobParametersField).value}
                onChange={field.onChange}
                addParameter={(field as ICreateJobParametersField).addParameter}
                removeParameter={
                  (field as ICreateJobParametersField).removeParameter
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
