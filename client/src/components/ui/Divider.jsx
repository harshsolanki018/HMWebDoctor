import React from 'react';

export const Divider = ({ label, className = '' }) => {
  if (label) {
    return (
      <div className={`relative flex py-4 items-center ${className}`}>
        <div className="flex-grow border-t border-border" />
        <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        <div className="flex-grow border-t border-border" />
      </div>
    );
  }
  return <hr className={`border-t border-border my-4 ${className}`} />;
};
