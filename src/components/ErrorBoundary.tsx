import React, { Component, ErrorInfo, ReactNode } from 'react';

// 1. Define the Props Interface (MUST include children)
interface Props {
  children: ReactNode;      // <--- Crucial: Explicitly type children
  fallback?: ReactNode;     // Optional custom error UI
}

// 2. Define the State Interface
interface State {
  hasError: boolean;
  error?: Error;
}

// 3. Pass Props and State to the Component Generic
class ErrorBoundary extends Component<Props, State> {
  
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state so the next render shows the fallback UI.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Log the error to an analytics service
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return custom fallback if provided, otherwise default UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 m-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <p className="font-bold">Component Error</p>
          <p>Something went wrong loading this section.</p>
        </div>
      );
    }

    // Render children normally if no error
    return this.props.children;
  }
}

export default ErrorBoundary;