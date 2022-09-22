import React from 'react';

import { AvailableSizes } from '../size';

export interface IClusterProps {
  children: React.ReactNode;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'start'
    | 'end'
    | 'left'
    | 'right'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?:
    | 'stretch'
    | 'flex-start'
    | 'start'
    | 'self-start'
    | 'flex-end'
    | 'end'
    | 'self-end'
    | 'center'
    | 'baseline';
  gap?: AvailableSizes;
}

export function Cluster(props: IClusterProps): JSX.Element {
  let cls = 'jp-jobs-Cluster';
  cls += ` justify-content-${props.justifyContent || 'flex-start'}`;
  cls += ` align-items-${props.alignItems || 'center'}`;
  cls += ` gap-${props.gap || 1}`;
  return <div className={cls}>{props.children}</div>;
}
