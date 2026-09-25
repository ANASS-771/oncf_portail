import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: 40,
          background: '#fef2f2',
        }}>
          <div style={{
            background: 'white', border: '1px solid #fecaca', borderRadius: 12,
            padding: '40px 32px', maxWidth: 460, textAlign: 'center',
            boxShadow: '0 4px 24px rgba(220,38,38,0.08)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#fef2f2', border: '2px solid #fca5a5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>
              ⚠
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
              Une erreur inattendue est survenue
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
              L'application a rencontré un problème. Veuillez recharger la page pour continuer.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', borderRadius: 8, border: '1px solid #fca5a5',
                background: '#dc2626', color: 'white', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
