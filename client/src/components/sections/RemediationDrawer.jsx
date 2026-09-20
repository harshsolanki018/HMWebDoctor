import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Copy, Check, ShieldAlert, Code2, CheckCircle, Terminal } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export const RemediationDrawer = ({ isOpen, onClose, item, triggerRef }) => {
  const [copied, setCopied] = useState(false);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const { addToast } = useToast();

  // Keyboard Escape key listener & focus management
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Simple Focus Trap within drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus close button upon opening
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else if (triggerRef && triggerRef.current) {
      // Restore focus to triggering element upon close
      triggerRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !item) return null;

  const { title, severity, domain, remediation } = item;

  const handleCopyCode = async () => {
    if (!remediation?.codeFix) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(remediation.codeFix);
      } else {
        // Fallback plain text copy
        const textArea = document.createElement('textarea');
        textArea.value = remediation.codeFix;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      addToast('Copied code fix to clipboard', 'pass');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy code snippet', 'danger');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 no-print"
      aria-modal="true"
      role="dialog"
      aria-labelledby="remediation-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className="w-full max-w-2xl bg-surface border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-surface-muted/50">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={severity === 'high' ? 'danger' : severity === 'medium' ? 'warn' : 'info'}>
                {severity} priority
              </Badge>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono px-2 py-0.5 rounded bg-surface border border-border">
                {domain}
              </span>
            </div>
            <h3 id="remediation-drawer-title" className="text-lg font-bold text-foreground">
              {title}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close remediation guide"
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {remediation ? (
            <>
              {/* Technical Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  Technical Problem Summary
                </h4>
                <p className="text-sm text-foreground leading-relaxed bg-surface-muted/50 p-4 rounded-xl border border-border">
                  {remediation.summary}
                </p>
              </div>

              {/* Security & UX Impact */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warn" />
                  Security & Technical Impact
                </h4>
                <p className="text-sm text-muted leading-relaxed bg-surface p-4 rounded-xl border border-border">
                  {remediation.impact}
                </p>
              </div>

              {/* Code Fix Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-pass" />
                    Recommended Static Code Fix
                  </h4>
                  {remediation.codeFix && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={copied ? Check : Copy}
                      onClick={handleCopyCode}
                    >
                      {copied ? 'Copied' : 'Copy Fix'}
                    </Button>
                  )}
                </div>
                {remediation.codeFix ? (
                  <pre className="p-4 rounded-xl bg-surface-muted border border-border font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    <code>{remediation.codeFix}</code>
                  </pre>
                ) : (
                  <p className="text-xs text-muted italic p-3 rounded-lg bg-surface-muted border border-border">
                    No static code fix snippet applies to this diagnostic item. Follow the implementation steps below.
                  </p>
                )}
              </div>

              {/* Implementation Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Implementation Steps
                </h4>
                <ol className="space-y-2 list-decimal list-inside text-sm text-foreground pl-1">
                  {remediation.steps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed text-muted">
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Verification Instructions */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-pass" />
                  Fix Verification Instructions
                </h4>
                <p className="text-sm text-muted leading-relaxed">
                  {remediation.verification}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted">
              <p className="text-sm">No static remediation guide available for this item.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-surface-muted/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
};

RemediationDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.shape({
    findingId: PropTypes.string,
    title: PropTypes.string,
    severity: PropTypes.string,
    domain: PropTypes.string,
    remediation: PropTypes.shape({
      summary: PropTypes.string,
      impact: PropTypes.string,
      codeFix: PropTypes.string,
      steps: PropTypes.arrayOf(PropTypes.string),
      verification: PropTypes.string,
    }),
  }),
  triggerRef: PropTypes.object,
};

export default RemediationDrawer;
