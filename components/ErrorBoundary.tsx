/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../utils/logger';
import { isAppError, AppError } from '../utils/errors';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log the error
    logger.error('Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Default Error Fallback UI
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onGoHome: () => void;
  showDetails?: boolean;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  showDetails = false,
}: DefaultErrorFallbackProps): JSX.Element {
  const isDevelopment = import.meta.env?.DEV ?? false;
  const shouldShowDetails = showDetails || isDevelopment;

  // Get user-friendly error message
  const errorMessage = isAppError(error)
    ? error.message
    : 'Something went wrong. Please try again.';

  const errorCode = isAppError(error) ? error.code : 'UNKNOWN_ERROR';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Oops! Something went wrong
        </h1>

        {/* Message */}
        <p className="text-slate-600 mb-6">
          {errorMessage}
        </p>

        {/* Error Code */}
        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-mono text-slate-500 mb-6">
          Error: {errorCode}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            <Home size={18} />
            Go Home
          </button>
        </div>

        {/* Developer Details */}
        {shouldShowDetails && error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700">
              Technical Details
            </summary>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg overflow-auto">
              <p className="text-xs font-mono text-slate-600 mb-2">
                <strong>Error:</strong> {error.name}
              </p>
              <p className="text-xs font-mono text-slate-600 mb-2">
                <strong>Message:</strong> {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap overflow-x-auto">
                  {error.stack}
                </pre>
              )}
              {errorInfo?.componentStack && (
                <>
                  <p className="text-xs font-mono text-slate-600 mt-4 mb-2">
                    <strong>Component Stack:</strong>
                  </p>
                  <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap overflow-x-auto">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Async Error Boundary (for Suspense)
// ============================================================================

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AsyncErrorBoundary({
  children,
  fallback,
}: AsyncErrorBoundaryProps): JSX.Element {
  return (
    <ErrorBoundary fallback={fallback}>
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
          </div>
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ErrorBoundary;
