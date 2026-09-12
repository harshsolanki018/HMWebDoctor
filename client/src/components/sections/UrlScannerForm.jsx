import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { validateAndNormalizeUrl } from '../../utils/urlValidator';
import { Button } from '../ui/Button';

export const UrlScannerForm = ({
  initialUrl = '',
  buttonText = 'Scan Website',
  autoFocus = false,
  className = '',
  onValidSubmit,
}) => {
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (initialUrl) {
      setInputUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const validation = validateAndNormalizeUrl(inputUrl);

    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid website URL.');
      return;
    }

    if (onValidSubmit) {
      onValidSubmit(validation.normalizedUrl);
    } else {
      navigate(`/scan?url=${encodeURIComponent(validation.normalizedUrl)}`);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-surface p-2 rounded-xl border border-border shadow-lg transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter public website URL (e.g. example.com)"
              autoFocus={autoFocus}
              aria-label="Website URL to diagnose"
              aria-invalid={!!error}
              aria-describedby={error ? 'url-error-msg' : undefined}
              className="w-full bg-transparent text-foreground placeholder:text-muted text-sm sm:text-base pl-11 pr-4 py-2.5 rounded-lg focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto font-semibold px-6 py-3 shrink-0"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {error && (
          <div
            id="url-error-msg"
            aria-live="polite"
            className="p-3 rounded-lg bg-danger-surface border border-danger-border text-danger-foreground text-xs font-medium animate-in fade-in"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted px-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Safe, non-destructive HTTP analysis only
          </span>
          <span>HTTP & HTTPS supported</span>
        </div>
      </form>
    </div>
  );
};
