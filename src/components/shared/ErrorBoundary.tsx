/* src/components/shared/ErrorBoundary.tsx */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Secure Logging: Clean error stack traces to strip out database keys, passwords, or tokens.
    const sanitize = (text: string) => {
      if (!text) return '';
      // Regex pattern to scrub passwords, keys, secrets, or JWT tokens
      return text
        .replace(/sb_secret_[a-zA-Z0-9\-_]+/g, '[REDACTED_SECRET]')
        .replace(/sb_publishable_[a-zA-Z0-9\-_]+/g, '[REDACTED_PUBLISHABLE_KEY]')
        .replace(/(?:password|token|secret|key)=([^&\s]+)/gi, '$1=[REDACTED]');
    };

    console.error('--- Telemetry Error Boundary Triggered ---');
    console.error('Error Message:', sanitize(error.message));
    console.error('Component Stack:', sanitize(errorInfo.componentStack || ''));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          <div 
            style={{
              maxWidth: '480px',
              padding: '32px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 12px 0' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              The application encountered an unexpected runtime error. We have logged the diagnostic trail and our team will resolve it. Please reload the page or return to the directory.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary btn-sm"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="btn btn-outline btn-sm"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
