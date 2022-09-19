import React, { useState } from 'react';
import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';

export interface ICollapsiblePanelProps {
  title: JSX.Element | string;
  content: JSX.Element | string;
  expanded?: boolean;
}

export function CollapsiblePanel(props: ICollapsiblePanelProps): JSX.Element {
  const [expanded, setExpanded] = useState(props.expanded ?? false);

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={'jp-collapsible-panel' + (expanded ? ' expanded' : '')}>
      <h2
        className={
          'jp-collapsible-panel-header' + (expanded ? ' expanded' : '')
        }
        onClick={handleChange}
      >
        {expanded ? <caretDownIcon.react /> : <caretRightIcon.react />}
        {props.title}
      </h2>
      <div
        className={'jp-collapsible-panel-body' + (expanded ? ' expanded' : '')}
      >
        {props.content}
      </div>
    </div>
  );
}
