import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <div className="rounded-lg border border-red-500/20 bg-zinc-800 p-8">
              {/* Error Icon */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-red-500/10 p-4">
                  <svg
                    className="h-12 w-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center">
                <h1 className="mb-2 text-2xl font-bold text-white">Something went wrong</h1>
                <p className="mb-6 text-gray-400">
                  We encountered an unexpected error. Please try again or reload the page.
                </p>
              </div>

              {/* Error Details (Collapsible) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 rounded-lg bg-zinc-900 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-red-400">Error Message:</p>
                      <p className="mt-1 text-xs text-gray-400 font-mono">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs font-semibold text-red-400">Stack Trace:</p>
                        <pre className="mt-1 overflow-x-auto text-xs text-gray-400">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-semibold text-red-400">Component Stack:</p>
                        <pre className="mt-1 overflow-x-auto text-xs text-gray-400">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="rounded-lg border border-white/10 bg-zinc-700 px-6 py-2 text-white transition-all hover:bg-zinc-600"
                  aria-label="Try again"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="rounded-lg bg-cyan-500 px-6 py-2 text-white transition-all hover:bg-cyan-600"
                  aria-label="Reload page"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-center text-sm text-gray-500">
                If the problem persists, please contact support or check the console for more details.
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const handleError = (error: Error) => {
    throw error; // This will be caught by the nearest ErrorBoundary
  };

  return handleError;
}
