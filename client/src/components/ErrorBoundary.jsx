import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <p className="error-boundary-icon">💥</p>
            <h2>Something went wrong</h2>
            <p className="error-boundary-message">{this.state.error?.message}</p>
            <div className="error-boundary-actions">
              <button
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <button
                className="btn-secondary"
                onClick={() => (window.location.href = "/")}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
