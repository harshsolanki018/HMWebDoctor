import React, { useId } from 'react';
import { Check } from 'lucide-react';

export const Checkbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = props.id || generatedId;

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={checkboxId}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${
            checked
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-surface border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </label>
      </div>

      {(label || description) && (
        <div className="text-sm">
          {label && (
            <label htmlFor={checkboxId} className="font-medium text-foreground cursor-pointer select-none">
              {label}
            </label>
          )}
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      )}
    </div>
  );
};
