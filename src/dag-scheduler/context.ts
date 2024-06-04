import { JupyterFrontEnd } from '@jupyterlab/application';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import React from 'react';
import { WorkflowsService, Namespace, Scheduler } from './handler';
import { CodeEditor } from '@jupyterlab/codeeditor';

export type WorkflowsContextType = {
  app: JupyterFrontEnd;
  api: WorkflowsService;
  kernelSpecs: Array<{ label: string; value: string }>;
  namespaces: Namespace[];
  editorFactory: CodeEditor.Factory;
  currentWorkflow: Scheduler.IJobDefinition | null;
  setCurrentWorkflow: (name: Scheduler.IJobDefinition) => void;
};

// Context to be overridden with JupyterLab context
const TranslatorContext = React.createContext<ITranslator>(nullTranslator);

export const WorkflowsContext = React.createContext<WorkflowsContextType>(
  {} as WorkflowsContextType
);

export default TranslatorContext;

export const WorkflowStoreContext = React.createContext(null as any);
