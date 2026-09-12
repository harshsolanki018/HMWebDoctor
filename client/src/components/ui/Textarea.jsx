import React, { useId } from 'react';

export const Textarea = ({
  label,
  description,
  error,
  rows = 4,
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const textareaId = props.id || generatedId;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : description ? `${textareaId}-desc` : undefined}
        className={`w-full rounded-lg border bg-surface text-foreground text-sm p-3 transition-colors placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-surface-muted ${
          error ? 'border-danger focus:ring-danger' : 'border-border'
        }`}
        {...props}
      />

      {description && !error && (
        <p id={`${textareaId}-desc`} className="text-xs text-muted">
          {description}
        </p>
      )}

      {error && (
        <p id={`${textareaId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
};
