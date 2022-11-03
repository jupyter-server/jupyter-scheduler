import React from 'react';

export interface ILabeledValueProps {
  label: string;
  id?: string;
  value?: React.ReactNode;
  style?: React.CSSProperties;
  InputProps?: {
    startAdornment: JSX.Element;
  };
  helperText?: string;
  name?: string;
}

export const LabeledValue = (props: ILabeledValueProps): JSX.Element => {
  const { label, value, style, helperText, InputProps } = props;

  return (
    <div
      id={props.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      <span className="jp-jobs-LabeledValue-label">{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {InputProps?.startAdornment}
          <span className="jp-jobs-LabeledValue-value">
            {value ? value : !InputProps?.startAdornment && '\u2014'}
          </span>
        </div>
        <span
          className="jp-jobs-LabeledValue-label"
          style={{ maxWidth: 'fit-content' }}
        >
          {helperText}
        </span>
      </div>
    </div>
  );
};
