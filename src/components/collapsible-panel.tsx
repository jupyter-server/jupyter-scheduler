import { ToolbarButtonComponent } from '@jupyterlab/apputils';
import React, { useState } from 'react';
import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';

export interface ICollapsiblePanelProps {
  expandedByDefault?: boolean;
  title: JSX.Element | string;
  content: JSX.Element | string;
}

export function CollapsiblePanel(props: ICollapsiblePanelProps): JSX.Element {
  const [expanded, setExpanded] = useState(props.expandedByDefault ?? false);

  const onControlClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={'jp-collapsible-panel' + (expanded ? ' expanded' : '')}>
      <div
        className={
          'jp-collapsible-panel-summary' + (expanded ? ' expanded' : '')
        }
      >
        <ToolbarButtonComponent
          className="jp-collapsible-panel-icon-toolbar-button"
          icon={expanded ? caretDownIcon : caretRightIcon}
          onClick={onControlClick}
        />
        <span className="jp-collapsible-panel-title" onClick={onControlClick}>
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