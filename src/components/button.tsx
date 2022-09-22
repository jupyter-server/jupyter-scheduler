import React from 'react';

export type ButtonColors = 'primary' | 'secondary';

export interface IButtonProps {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  color?: ButtonColors;
}

export function Button(props: IButtonProps): JSX.Element {
  const cls = `jp-jobs-Button color-${props.color || 'secondary'}`;
  return (
    <button className={cls} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
