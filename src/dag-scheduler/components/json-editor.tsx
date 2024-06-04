import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, debounce, InputLabel, Typography } from '@mui/material';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Slot } from '@lumino/signaling';
import { ISharedText, SourceChange } from '@jupyter/ydoc';
import { tryParse } from '../util';
import { useWorkflows } from '../hooks';

export type JsonEditorProps = {
  label?: string;
  readOnly?: boolean;
  required?: boolean;
  initialValue: string;
  height?: number;
  width?: number;
  onChange?: (str: string) => void;
  onResize?: (width: number, height: number) => void;
};

export const JsonEditor: FC<JsonEditorProps> = props => {
  const { editorFactory } = useWorkflows();
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<CodeEditor.IEditor | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleResize = useMemo(
    () =>
      debounce((width: number, height: number) => {
        props.onResize?.(width, height);
      }, 300),
    []
  );

  const handleStateChange = useMemo(
    () =>
      debounce((input: string) => {
        setErrorMessage(tryParse(input));
      }, 300),
    []
  );

  useEffect(() => {
    if (editorHostRef.current && editorFactory) {
      const editor = editorFactory({
        config: {
          lineNumbers: true,
          smartIndent: true,
          autoClosingBrackets: true,
          readOnly: props.readOnly,
          lineWrap: 'off',
          lineWrapping: false
        },
        host: editorHostRef.current,
        model: new CodeEditor.Model({ mimeType: 'application/json' })
      });

      editorRef.current = editor;
      editor.model.sharedModel.setSource(props.initialValue);
      handleStateChange(props.initialValue);

      if (props.height && props.width) {
        editorHostRef.current.style.width = `${props.width}px`;
        editorHostRef.current.style.height = `${props.height}px`;
      }

      const resizeObserver = new ResizeObserver(entries => {
        const height = entries[0].target.clientHeight;
        const width = entries[0].target.clientWidth;

        handleResize(width, height);
      });

      resizeObserver.observe(editorHostRef.current);
    }
  }, []);

  useEffect(() => {
    const handler: Slot<ISharedText, SourceChange> = sender => {
      const newState = sender.getSource();

      props.onChange?.(newState);
      handleStateChange(newState);
    };

    const canConnect = editorRef.current && !props.readOnly;

    if (canConnect) {
      editorRef.current?.model.sharedModel.changed.connect(handler);
    }

    return () => {
      canConnect &&
        editorRef.current?.model.sharedModel.changed.disconnect(handler);
    };
  }, [editorRef.current, props.onChange, props.readOnly]);

  const cx = ['jp-scheduler-editor', errorMessage ? 'error' : ''];

  return (
    <Stack spacing={2}>
      {props.label ? (
        <InputLabel>
          {props.label}{' '}
          {props.required ? null : (
            <Typography variant="caption">- Optional</Typography>
          )}
        </InputLabel>
      ) : null}
      <div ref={editorHostRef} className={cx.join(' ')}></div>
      {errorMessage ? <span className="error-msg">{errorMessage}</span> : null}
    </Stack>
  );
};
