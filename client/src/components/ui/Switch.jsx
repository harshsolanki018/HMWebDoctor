import React, { useId } from 'react';

export const Switch = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const switchId = props.id || generatedId;

  return (
    <div className={`flex items-center justify-between space-x-3 ${className}`}>
      {(label || description) && (
        <div className="text-sm">
          {label && (
            <label htmlFor={switchId} className="font-medium text-foreground cursor-pointer select-none">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          checked ? 'bg-primary' : 'bg-surface-hover border-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        {...props}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
