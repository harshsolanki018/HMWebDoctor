import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught rendering error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6" role="alert">
          <div className="max-w-md w-full space-y-6 text-center bg-surface border border-border rounded-xl p-8 shadow-lg">
            <div className="flex justify-center">
              <div className="p-3 bg-danger/10 text-danger rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Something Went Wrong</h2>
              <p className="text-sm text-muted">
                An unexpected application rendering error occurred. You can reload the page or return home to continue.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="primary" icon={RotateCcw} onClick={this.handleReset}>
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
};

export default ErrorBoundary;
