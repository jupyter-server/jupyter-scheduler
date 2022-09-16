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
      <div
        className={
          'jp-collapsible-panel-summary' + (expanded ? ' expanded' : '')
        }
      >
        {expanded ? caretDownIcon.react : caretRightIcon.react}
        <span className="jp-collapsible-panel-title" onClick={handleChange}>
          {props.title}
        </span>
      </div>
      <div
        className={
          'jp-collapsible-panel-content' + (expanded ? ' expanded' : '')
        }
      >
        {expanded && <div>{props.content}</div>}
      </div>
    </div>
  );
}
