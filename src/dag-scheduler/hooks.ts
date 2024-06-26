import { useContext } from 'react';

import { TranslationBundle } from '@jupyterlab/translation';

import TranslatorContext, {
  WorkflowStoreContext,
  WorkflowsContext,
  WorkflowsContextType
} from './context';
import { StoreType } from './store';

export function useTranslator(bundleId: string): TranslationBundle {
  const translator = useContext(TranslatorContext);

  if (translator === null) {
    throw new Error('Please wrap the app with TranslatorContext');
  }

  return translator.load(bundleId);
}

export function useWorkflows(): WorkflowsContextType {
  const context = useContext(WorkflowsContext);

  if (context === null) {
    throw new Error('Please wrap the app with WorkflowsContext');
  }

  return context;
}

export function useWorkflowStore(): StoreType {
  const store = useContext(WorkflowStoreContext);

  if (!store) {
    throw new Error(
      'useWorkflowStore must be used within WorkflowStoreProvider'
    );
  }

  return store;
}
