import React, { useId } from 'react';

export const Select = ({
  label,
  options = [],
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const selectId = props.id || generatedId;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-surface text-foreground text-sm px-3.5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-surface-muted ${
          error ? 'border-danger focus:ring-danger' : 'border-border'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
};
