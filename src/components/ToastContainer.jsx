import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let toastClass = 'toast-success';
        let iconColor = 'var(--success)';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          toastClass = 'toast-error';
          iconColor = 'var(--danger)';
        } else if (toast.type === 'info') {
          Icon = Info;
          toastClass = 'toast-info';
          iconColor = 'var(--primary-600)';
        }

        return (
          <div key={toast.id} className={`toast ${toastClass}`}>
            <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.85rem' }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn-icon"
              style={{ padding: '2px', color: 'var(--text-muted)' }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
