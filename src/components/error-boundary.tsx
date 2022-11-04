import { Alert, AlertTitle, Stack, Typography } from '@mui/material';

import React from 'react';

interface IErrorBoundaryProps {}

interface IErrorBoundaryState {
  hasError: boolean;
  error?: unknown;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<IErrorBoundaryProps>,
  IErrorBoundaryState
> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): IErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.log('Caught error in ErrorBoundary', error, errorInfo);
  }

  render(): React.ReactNode {
    const errorMessage =
      'We encountered an internal error. Please try your command again.';

    let errorDetail;
    if (typeof this.state.error === 'string') {
      errorDetail = this.state.error;
    } else if (this.state.error instanceof Error) {
      errorDetail = this.state.error.message;
    }

    let infoSection;
    if (errorDetail !== undefined) {
      infoSection = (
        <>
          <Typography variant="h1">Error details</Typography>
          <pre>{errorDetail}</pre>
        </>
      );
    }
    if (this.state.hasError) {
      return (
        <div className="jp-error-boundary">
          <Stack spacing={4}>
            <Alert severity="error">
              <AlertTitle>Internal error</AlertTitle>
              {errorMessage}
            </Alert>
            {infoSection}
          </Stack>
        </div>
      );
    }
    return this.props.children;
  }
}
