import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import React from 'react';

export type Logger = (eventName: string) => void;
export const LogContext = React.createContext<Logger>((eventName: string) => {
  /*noop*/
});

// Context to be overridden with JupyterLab context
const TranslatorContext = React.createContext<ITranslator>(nullTranslator);
export default TranslatorContext;
