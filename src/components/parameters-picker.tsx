import { ToolbarButtonComponent } from '@jupyterlab/apputils';
import { addIcon, Button, closeIcon, LabIcon } from '@jupyterlab/ui-components';
import React, { ChangeEvent } from 'react';

import { IJobParameter } from '../model';
import { useTranslator } from '../hooks';

export type ParametersPickerProps = {
  name: string;
  id: string;
  value: IJobParameter[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  addParameter: () => void;
  removeParameter: (idx: number) => void;
  // CSS classes for elements
  formPrefix: string;
};

export function ParametersPicker(props: ParametersPickerProps): JSX.Element {
  const trans = useTranslator('jupyterlab');

  return (
    <>
      {props.value &&
        props.value.map((param, paramIdx) => (
          <div key={paramIdx} className={`${props.formPrefix}parameter-row`}>
            <input
              name={`parameter-${paramIdx}-name`}
              size={15}
              value={param.name}
              type="text"
              placeholder={trans.__('Name')}
              onChange={props.onChange}
            />
            <input
              name={`parameter-${paramIdx}-value`}
              size={15}
              value={param.value}
              type="text"
              placeholder={trans.__('Value')}
              onChange={props.onChange}
            />
            <ToolbarButtonComponent
              className={`${props.formPrefix}inline-button`}
              icon={closeIcon}
              onClick={() => {
                props.removeParameter(paramIdx);
                return false;
              }}
              tooltip={trans.__('Delete this parameter')}
            />
          </div>
        ))}
      <Button
        minimal={true}
        onClick={(e: React.MouseEvent) => {
          props.addParameter();
          return false;
        }}
        title={trans.__('Add new parameter')}
      >
        <LabIcon.resolveReact icon={addIcon} tag="span" />
      </Button>
    </>
  );
}
