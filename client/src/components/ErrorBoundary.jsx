import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details silently
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorPage}>
          <div style={styles.errorCard}>
            <div style={styles.iconContainer}>⚠️</div>
            <h2 style={styles.title}>Oops! Something went wrong</h2>
            <p style={styles.text}>
              The application encountered an unexpected error. Please try reloading the page or return to the store.
            </p>
            <div style={styles.actions}>
              <button onClick={this.handleReload} style={styles.btnPrimary}>
                Reload Page
              </button>
              <a href="/" style={styles.btnSecondary}>
                Back to Home
              </a>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre style={styles.errorDetails}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  errorPage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '20px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  errorCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '40px 32px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
  },
  iconContainer: {
    fontSize: '3rem',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 12px 0',
  },
  text: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 18px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnSecondary: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '10px 18px',
    fontSize: '0.9rem',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'background-color 0.2s',
  },
  errorDetails: {
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.8rem',
    color: '#ef4444',
    textAlign: 'left',
    overflowX: 'auto',
    maxHeight: '150px',
  },
};

export default ErrorBoundary;
