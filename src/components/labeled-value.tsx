import React from 'react';

export interface ILabeledValueProps {
  label?: string;
  value?: string | number | boolean;
  style?: React.CSSProperties;
  InputProps?: {
    startAdornment: JSX.Element;
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const LabeledValue = (props: ILabeledValueProps): JSX.Element => {
  const { label, value, style, InputProps } = props;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0.3rem 0',
        gap: '0.5rem',
        ...style
      }}
    >
      <span style={{ fontSize: '0.8em' }}>{label}</span>
      <div
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        {InputProps?.startAdornment}
        <span>{value ? value : !InputProps?.startAdornment && '\u2014'}</span>
      </div>
      {/* {...props}
    FormHelperTextProps={{ sx: { maxWidth: 'fit-content' } }} */}
    </div>
  );
};
