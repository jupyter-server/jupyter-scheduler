import React from 'react';

export interface ILabeledValueProps {
  label: string;
  id?: string;
  value?: string | number | boolean;
  style?: React.CSSProperties;
  InputProps?: {
    startAdornment: JSX.Element;
  };
  helperText?: string;
}

export const LabeledValue = (props: ILabeledValueProps): JSX.Element => {
  const { label, value, style, helperText, InputProps } = props;

  return (
    <div
      id={props.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0.3rem 0',
        gap: '0.5rem',
        ...style
      }}
    >
      <span style={{ fontSize: '0.8em' }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {InputProps?.startAdornment}
          <span>{value ? value : !InputProps?.startAdornment && '\u2014'}</span>
        </div>
        <span style={{ fontSize: '0.8em', maxWidth: 'fit-content' }}>
          {helperText}
        </span>
      </div>
    </div>
  );
};
