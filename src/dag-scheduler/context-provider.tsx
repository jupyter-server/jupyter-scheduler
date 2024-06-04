import React, { FC, useMemo, useState, useEffect, useRef } from 'react';
import { WorkflowStoreContext, WorkflowsContext } from './context';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { Scheduler } from './handler';
import useZustandStore, { StoreType } from './store';
import { Contents } from '@jupyterlab/services';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { MockWorkflowService } from './mocks/handler';
type Props = {
  app: JupyterFrontEnd;
  children: JSX.Element;
  contents: Contents.IManager;
  editorFactory: CodeEditor.Factory;
};

export const WorkflowsContextProvider: FC<Props> = ({
  app,
  contents,
  editorFactory,
  children
}) => {
  const [kernelSpecs, setKernelSpecs] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] =
    useState<Scheduler.IJobDefinition | null>(null);

  const api = useMemo(() => new MockWorkflowService({}), []);

  useEffect(() => {
    const getKernelSpecs = async () => {
      const kernelSpecs = (await api.getKernelSpecs()) as any;

      setKernelSpecs(kernelSpecs);
    };

    getKernelSpecs();
  }, []);

  useEffect(() => {
    const getNamespaces = async () => {
      const namespaces = await api.getNamespaces();

      setNamespaces(namespaces as any);
    };

    getNamespaces();
  }, []);

  const value = useMemo(
    () => ({
      app,
      api,
      contents,
      kernelSpecs,
      namespaces,
      currentWorkflow,
      setCurrentWorkflow,
      editorFactory
    }),
    [
      app,
      contents,
      api,
      kernelSpecs,
      namespaces,
      currentWorkflow,
      editorFactory
    ]
  );

  return (
    <WorkflowsContext.Provider value={value}>
      {children}
    </WorkflowsContext.Provider>
  );
};

type StoreProps = {
  initialData?: any;
  children: JSX.Element;
};

export const WorkflowStoreProvider: FC<StoreProps> = ({
  initialData,
  children
}) => {
  const storeRef = useRef<StoreType | null>(null);

  if (!storeRef.current) {
    storeRef.current = useZustandStore(initialData);
  }

  return (
    <WorkflowStoreContext.Provider value={storeRef.current}>
      {children}
    </WorkflowStoreContext.Provider>
  );
};
