import React from 'react';
import { X } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { NavLink } from './NavLink';

export const MobileNavigation = ({ isOpen, onClose, navLinks = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-surface border-l border-border shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <Logo className="h-7" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-6 flex flex-col space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                active={link.active}
                onClick={onClose}
                className="py-2.5 text-base"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-border text-xs text-muted text-center">
          HMWebDoctor V1 — Website Health Diagnosis
        </div>
      </div>
    </div>
  );
};
