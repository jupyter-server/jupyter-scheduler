import React from 'react';

import { AvailableSizes } from '../size';

export interface IBoxProps {
  size?: AvailableSizes;
  children: React.ReactNode;
}

export function Box(props: IBoxProps): JSX.Element {
  return (
    <div className={`jp-jobs-Box size-${props.size}`}>{props.children}</div>
  );
}
