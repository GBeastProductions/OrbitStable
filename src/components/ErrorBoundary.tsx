import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('ORBIT ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#07080d] p-6 text-center text-white">
          <div className="max-w-md border border-white/15 bg-[#0e111a] p-6">
            <h1 className="font-display text-xl font-black text-[#ff3b82]">
              Stage Display Recovery
            </h1>
            <p className="mt-2 text-xs text-[#a1abbe] break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 border border-[#ff3b82] bg-[#ff3b82] px-5 py-2 text-xs font-black text-white cursor-pointer"
            >
              Reload ORBIT
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
