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
          'jp-collapsible-panel-header' + (expanded ? ' expanded' : '')
        }
      >
        <div onClick={handleChange} className="jp-collapsible-panel-button">
          {expanded ? (
            <caretDownIcon.react container={document.createElement('SPAN')} />
          ) : (
            <caretRightIcon.react container={document.createElement('SPAN')} />
          )}
        </div>
        <span className="jp-collapsible-panel-title" onClick={handleChange}>
          {props.title}
        </span>
      </div>
      <div
        className={
          'jp-collapsible-panel-content' + (expanded ? ' expanded' : '')
        }
      >
        {props.content}
      </div>
    </div>
  );
}
