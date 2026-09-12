import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[variant] || Info;

  const variantStyles = {
    success: 'bg-success-surface border-success-border text-success-foreground',
    warning: 'bg-warning-surface border-warning-border text-warning-foreground',
    danger: 'bg-danger-surface border-danger-border text-danger-foreground',
    error: 'bg-danger-surface border-danger-border text-danger-foreground',
    info: 'bg-info-surface border-info-border text-info-foreground',
  };

  return (
    <div
      role="alert"
      className={`flex items-start space-x-3 p-4 rounded-lg border text-sm transition-all ${
        variantStyles[variant] || variantStyles.info
      } ${className}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1">
        {title && <h4 className="font-semibold leading-tight mb-1">{title}</h4>}
        {children && <div className="text-xs sm:text-sm leading-relaxed opacity-90">{children}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
