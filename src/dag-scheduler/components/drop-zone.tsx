import { Drag } from '@lumino/dragdrop';
import React, { FC, useState, useCallback, useEffect, useRef } from 'react';

interface IRootProps {
  ref: React.RefObject<HTMLDivElement>;
}

export interface IDropZoneProps {
  children?: JSX.Element;
  onDragEnter?: (e: Drag.Event) => any;
  onDragLeave?: (e: Drag.Event) => any;
  onDragOver?: (e: Drag.Event) => any;
  onDrop?: (e: Drag.Event) => any;
}

interface IReturn {
  dragHover: boolean;
  getRootProps: () => IRootProps;
}

export const useDropzone = (
  props: Omit<IDropZoneProps, 'children'>
): IReturn => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragHover, setDragHover] = useState(false);

  const handleEvent = useCallback(
    (e: any): void => {
      e.preventDefault();
      e.stopPropagation();

      switch (e.type) {
        case 'lm-dragenter':
          setDragHover(true);
          props.onDragEnter?.(e);
          break;
        case 'lm-dragleave':
          setDragHover(false);
          props.onDragLeave?.(e);
          break;
        case 'lm-dragover':
          setDragHover(true);
          e.dropAction = e.proposedAction;
          props.onDragOver?.(e);
          break;
        case 'lm-drop':
          setDragHover(false);
          props.onDrop?.(e);
          break;
      }
    },
    [props]
  );

  useEffect(() => {
    const node = rootRef.current as HTMLElement;

    node?.addEventListener('lm-dragenter', handleEvent);
    node?.addEventListener('lm-dragleave', handleEvent);
    node?.addEventListener('lm-dragover', handleEvent);
    node?.addEventListener('lm-drop', handleEvent);

    return (): void => {
      node?.removeEventListener('lm-dragenter', handleEvent);
      node?.removeEventListener('lm-dragleave', handleEvent);
      node?.removeEventListener('lm-dragover', handleEvent);
      node?.removeEventListener('lm-drop', handleEvent);
    };
  }, [handleEvent]);

  return {
    dragHover,
    getRootProps: (): IRootProps => ({
      ref: rootRef
    })
  };
};

export const Dropzone: FC<IDropZoneProps> = ({ children, ...rest }) => {
  const { getRootProps, dragHover } = useDropzone(rest);

  return (
    <div
      style={{ height: '100%', width: '100%' }}
      {...getRootProps()}
      className={dragHover ? 'draghover' : ''}
    >
      {children}
    </div>
  );
};
