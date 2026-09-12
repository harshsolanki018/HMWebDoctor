import React, { useId } from 'react';

export const Input = ({
  label,
  description,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  icon: Icon,
  endAction,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined}
          className={`w-full rounded-lg border bg-surface text-foreground text-sm px-3.5 py-2 transition-colors placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-surface-muted ${
            Icon ? 'pl-10' : ''
          } ${endAction ? 'pr-20' : ''} ${
            error ? 'border-danger focus:ring-danger' : 'border-border'
          }`}
          {...props}
        />

        {endAction && <div className="absolute right-1.5">{endAction}</div>}
      </div>

      {description && !error && (
        <p id={`${inputId}-desc`} className="text-xs text-muted">
          {description}
        </p>
      )}

      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
};
