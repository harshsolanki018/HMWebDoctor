import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`rounded-xl border border-border bg-surface text-foreground shadow-sm transition-all duration-150 ${
        hover ? 'hover:shadow-md hover:border-primary/40' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', title, subtitle, action }) => {
  if (title || subtitle || action) {
    return (
      <div className={`p-6 border-b border-border flex items-start justify-between gap-4 ${className}`}>
        <div>
          {title && <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs sm:text-sm text-muted">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={`p-6 border-b border-border ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`p-6 border-t border-border bg-surface-muted/50 rounded-b-xl flex items-center justify-between ${className}`}>{children}</div>;
};
