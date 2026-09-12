import React from 'react';

export const PageHeader = ({ title, subtitle, badgeText, actions, className = '' }) => {
  return (
    <div className={`mb-8 border-b border-border pb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {badgeText && (
            <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
              {badgeText}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm sm:text-base text-muted max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center space-x-3">{actions}</div>}
      </div>
    </div>
  );
};
