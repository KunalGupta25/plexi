import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-error-container/40 rounded-[2rem] flex items-center justify-center shadow-inner border border-error/10">
              <span className="material-symbols-outlined text-4xl text-error">
                error
              </span>
            </div>
            <h1 className="text-3xl font-black font-headline text-on-surface tracking-tight">
              Something went wrong
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
