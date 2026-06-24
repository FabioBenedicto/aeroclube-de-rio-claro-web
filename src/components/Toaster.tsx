import { useState, useEffect } from 'react';
import { toast as toastEmitter, type ToastEvent } from '../utils/toast';
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

const ICONS = {
  error: <AlertCircle size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
};

const typeClass: Record<string, string> = {
  error: 'border-danger bg-danger-soft text-danger',
  success: 'border-success bg-success-soft text-success',
  warning: 'border-warn bg-warn-soft text-warn',
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return toastEmitter.subscribe(event => {
      setToasts(prev => [...prev, event]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== event.id));
      }, 5000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-[380px]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'toast-animate flex items-start gap-2.5 px-3.5 py-3 rounded-lg border shadow-[var(--shadow)] text-[13px]',
            typeClass[t.type] ?? 'bg-bg-elev border-line text-ink',
          )}
        >
          <span className="shrink-0 mt-px">{ICONS[t.type]}</span>
          <span className="flex-1 text-ink leading-snug">{t.message}</span>
          <button
            className="shrink-0 flex items-center border-0 bg-transparent cursor-pointer text-ink-3 p-0"
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
