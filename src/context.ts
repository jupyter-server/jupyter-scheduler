import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import React from 'react';

type ITelemetryProcessor = (eventName: string) => void
export const TelemetryContext = React.createContext<ITelemetryProcessor>(() => {})

// Context to be overridden with JupyterLab context
const TranslatorContext = React.createContext<ITranslator>(nullTranslator);
export default TranslatorContext;
