import React, { useState } from 'react';
import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';

export interface ICollapsiblePanelProps {
  title: JSX.Element | string;
  content: JSX.Element | string;
  expanded?: boolean;
}

export function CollapsiblePanel(props: ICollapsiblePanelProps): JSX.Element {
  const [expanded, setExpanded] = useState(props.expanded ?? false);

  return (
    <div className={'jp-jobs-CollapsiblePanel'}>
      <h2
        className={
          'jp-jobs-CollapsiblePanel-header' + (expanded ? ' expanded' : '')
        }
        onClick={_ => setExpanded(!expanded)}
      >
        {expanded ? <caretDownIcon.react /> : <caretRightIcon.react />}
        {props.title}
      </h2>
      <div
        className={
          'jp-jobs-CollapsiblePanel-body' + (expanded ? ' expanded' : '')
        }
      >
        {props.content}
      </div>
    </div>
  );
}
