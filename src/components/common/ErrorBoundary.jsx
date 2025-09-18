import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    // Console log removed
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="text-red-600 text-2xl">⚠️</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700">Bir hata oluştu</p>
              <p className="text-xs text-red-500">Dosya görüntülenemedi</p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">Hata detayları</summary>
                  <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
