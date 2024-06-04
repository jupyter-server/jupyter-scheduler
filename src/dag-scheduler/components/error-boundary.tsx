import { Alert, AlertTitle, Stack, Typography } from '@mui/material';

import React from 'react';

interface IErrorBoundaryProps {
  alertTitle: string;
  alertMessage: string;
  detailTitle: string;
  onClose?: () => void;
}

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

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    // errorInfo has full stack trace, which we are not using
    this.setState({ hasError: true, error });
  }

  render(): React.ReactNode {
    let errorDetail;

    if (typeof this.state.error === 'string') {
      errorDetail = this.state.error;
    } else if (this.state.error instanceof Error) {
      errorDetail = this.state.error.message;
    }

    if (this.state.hasError) {
      return (
        <Stack spacing={4} p={4}>
          <Alert severity="error" onClose={this.props.onClose}>
            <AlertTitle>{this.props.alertTitle}</AlertTitle>
            {this.props.alertMessage}
          </Alert>
          {errorDetail && (
            <>
              <Typography variant="h6">{this.props.detailTitle}</Typography>
              <pre style={{ whiteSpace: 'break-spaces' }}>{errorDetail}</pre>
            </>
          )}
        </Stack>
      );
    }

    return this.props.children;
  }
}
