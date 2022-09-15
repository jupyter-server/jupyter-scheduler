import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import React from 'react';

// Context to be overridden with JupyterLab context
const TranslatorContext = React.createContext<ITranslator>(nullTranslator);
export default TranslatorContext;
