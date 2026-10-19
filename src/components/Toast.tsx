import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'error';
}

interface ToastProps {
  toast: ToastMessage | null;
  onDone: () => void;
}

/** A short message at the bottom of the screen that disappears by itself. */
export function Toast({ toast, onDone }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDone, toast.tone === 'error' ? 6000 : 2600);
    return () => window.clearTimeout(t);
  }, [toast, onDone]);

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toast && (
        <div key={toast.id} className={`toast ${toast.tone === 'error' ? 'is-error' : ''}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
