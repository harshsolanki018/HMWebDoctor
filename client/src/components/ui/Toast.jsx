import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = ({ toast, onClose }) => {
  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[toast.type] || Info;

  const styles = {
    success: 'bg-emerald-950 border-emerald-800 text-emerald-200',
    warning: 'bg-amber-950 border-amber-800 text-amber-200',
    danger: 'bg-red-950 border-red-800 text-red-200',
    error: 'bg-red-950 border-red-800 text-red-200',
    info: 'bg-slate-900 border-slate-700 text-slate-200',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-lg border shadow-xl text-xs transition-all duration-200 animate-in slide-in-from-bottom-5 ${
        styles[toast.type] || styles.info
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        {toast.message && <p className="mt-0.5 opacity-90">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
