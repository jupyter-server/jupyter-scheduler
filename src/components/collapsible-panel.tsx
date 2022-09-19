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
        onClick={handleChange}
      >
        {expanded ? (
          <caretDownIcon.react
            className="jp-collapsible-panel-button"
            tag="span"
          />
        ) : (
          <caretRightIcon.react
            className="jp-collapsible-panel-button"
            tag="span"
          />
        )}
        {props.title}
      </div>
      <div
        className={'jp-collapsible-panel-body' + (expanded ? ' expanded' : '')}
      >
        {props.content}
      </div>
    </div>
  );
}
