import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';

export const Footer = () => {
  return (
    <footer className="w-full bg-surface border-t border-border mt-auto text-sm text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
              <Logo className="h-7" />
            </Link>
            <p className="text-xs text-muted leading-relaxed">
              Diagnose your website. Fix what matters. Professional, safe, and actionable website health diagnostics.
            </p>
          </div>

          {/* Links: Product */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-foreground mb-3">
              Product
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/scan" className="hover:text-primary transition-colors">
                  Scan Website
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Company */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-foreground mb-3">
              Company
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Legal */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-foreground mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted">
          <p>© {new Date().getFullYear()} HMWebDoctor. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Part of the HM Product Family</p>
        </div>
      </div>
    </footer>
  );
};

