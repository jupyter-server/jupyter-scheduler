import { Alert, AlertTitle, Stack, Typography } from '@mui/material';

import React from 'react';

interface IErrorBoundaryProps {
  alertTitle: string;
  alertMessage: string;
  detailTitle: string;
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

  render(): JSX.Element {
    let errorDetail;
    if (typeof this.state.error === 'string') {
      errorDetail = this.state.error;
    } else if (this.state.error instanceof Error) {
      errorDetail = this.state.error.message;
    }

    if (this.state.hasError) {
      return (
        <div className="jp-error-boundary">
          <Stack spacing={4}>
            <Alert severity="error">
              <AlertTitle>{this.props.alertTitle}</AlertTitle>
              {this.props.alertMessage}
            </Alert>
            {errorDetail && (
              <>
                <Typography variant="h1">{this.props.detailTitle}</Typography>
                <pre>{errorDetail}</pre>
              </>
            )}
          </Stack>
        </div>
      );
    }
    return <> {this.props.children} </>;
  }
}
