import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-rose-900/50 bg-rose-950/20 text-zinc-300 my-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-900/40 text-rose-400 mb-3 border border-rose-800/40">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-rose-200">
            {this.props.fallbackTitle || 'Something went wrong displaying this section'}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              'An unexpected rendering issue occurred. Please try resetting or reloading.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Display
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
