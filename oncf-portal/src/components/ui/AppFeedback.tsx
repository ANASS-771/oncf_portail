import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastInput {
  type?: ToastType;
  title?: string;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface ToastItem extends ToastInput {
  id: number;
  type: ToastType;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface AppFeedbackContextValue {
  notify: (input: ToastInput) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

export function AppFeedbackProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const notify = (input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const toast: ToastItem = {
      id,
      type: input.type ?? 'info',
      title: input.title,
      message: input.message,
    };

    setToasts(current => [...current, toast]);
    window.setTimeout(() => {
      setToasts(current => current.filter(item => item.id !== id));
    }, 4200);
  };

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>(resolve => {
      setConfirmState({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmer',
        cancelLabel: options.cancelLabel ?? 'Annuler',
        tone: options.tone ?? 'default',
        resolve,
      });
    });

  const dismissToast = (id: number) => {
    setToasts(current => current.filter(item => item.id !== id));
  };

  const closeConfirm = (result: boolean) => {
    if (!confirmState) return;
    confirmState.resolve(result);
    setConfirmState(null);
  };

  const value = useMemo(() => ({ notify, confirm }), []);

  return (
    <AppFeedbackContext.Provider value={value}>
      {children}

      <div className="app-toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => {
          const icon = toast.type === 'success'
            ? <CheckCircle2 size={18} />
            : toast.type === 'error'
              ? <XCircle size={18} />
              : <Info size={18} />;

          return (
            <div key={toast.id} className={`app-toast app-toast--${toast.type}`}>
              <div className="app-toast__icon">{icon}</div>
              <div className="app-toast__body">
                {toast.title && <div className="app-toast__title">{toast.title}</div>}
                <div className="app-toast__message">{toast.message}</div>
              </div>
              <button type="button" className="app-toast__close" onClick={() => dismissToast(toast.id)} aria-label="Fermer la notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="app-confirm-overlay" role="presentation">
          <div className="app-confirm-card" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">
            <div className="app-confirm-card__icon">
              <AlertTriangle size={18} />
            </div>
            <div className="app-confirm-card__content">
              <h3 id="app-confirm-title" className="app-confirm-card__title">{confirmState.title}</h3>
              <p className="app-confirm-card__message">{confirmState.message}</p>
            </div>
            <div className="app-confirm-card__actions">
              <button type="button" className="app-button app-button--ghost" onClick={() => closeConfirm(false)}>
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                className={`app-button ${confirmState.tone === 'danger' ? 'app-button--danger' : 'app-button--primary'}`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppFeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);
  if (!context) {
    throw new Error('useAppFeedback must be used within AppFeedbackProvider.');
  }

  return context;
}