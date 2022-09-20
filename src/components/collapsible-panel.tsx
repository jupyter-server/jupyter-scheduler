import React, { ReactNode, useState } from 'react';
import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';

export interface ICollapsiblePanelProps {
  title: string;
  children?: ReactNode;
  expanded?: boolean;
}

export function CollapsiblePanel(props: ICollapsiblePanelProps): JSX.Element {
  const [expanded, setExpanded] = useState(props.expanded ?? false);
  const children = React.Children.toArray(props.children);

  return (
    <div className={'jp-jobs-CollapsiblePanel'}>
      <h2
        className={
          'jp-jobs-CollapsiblePanel-header' + (expanded ? ' expanded' : '')
        }
        onClick={_ => {
          setExpanded(!expanded);
          console.log(props.children);
        }}
      >
        {expanded ? <caretDownIcon.react /> : <caretRightIcon.react />}
        {props.title}
      </h2>
      <div
        className={
          'jp-jobs-CollapsiblePanel-body' + (expanded ? ' expanded' : '')
        }
      >
        {children}
      </div>
    </div>
  );
}
