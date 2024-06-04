import React from 'react';
import { WorkflowStoreProvider } from '../context-provider';

type WrapperProps = {
  children?: JSX.Element;
};

export const withStore = (Component: React.ComponentType<WrapperProps>) => (
  props: WrapperProps
): JSX.Element => {
  return (
    <WorkflowStoreProvider>
      <Component {...props} />
    </WorkflowStoreProvider>
  );
};
