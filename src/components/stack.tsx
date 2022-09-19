import React from 'react';

import { AvailableSizes } from '../size';

export interface IStackProps {
  size?: AvailableSizes;
  children?: React.ReactNode;
}

export function Stack(props: IStackProps): JSX.Element {
  return (
    <div className={`jp-jobs-Stack size-${props.size || 1}`}>
      {props.children}
    </div>
  );
}
