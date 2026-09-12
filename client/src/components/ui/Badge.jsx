import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
}) => {
  const variantStyles = {
    pass: 'bg-success-surface text-success-foreground border-success-border',
    success: 'bg-success-surface text-success-foreground border-success-border',
    fail: 'bg-danger-surface text-danger-foreground border-danger-border',
    danger: 'bg-danger-surface text-danger-foreground border-danger-border',
    warning: 'bg-warning-surface text-warning-foreground border-warning-border',
    info: 'bg-info-surface text-info-foreground border-info-border',
    neutral: 'bg-surface-muted text-muted-foreground border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border uppercase tracking-wider ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      <span>{children}</span>
    </span>
  );
};
