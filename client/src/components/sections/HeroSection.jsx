import React from 'react';
import { Link } from 'react-router-dom';
import { UrlScannerForm } from './UrlScannerForm';
import { CheckCircle2, Shield, Eye, FileText } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-12 sm:py-20 bg-gradient-to-b from-background via-surface-muted/40 to-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtitle Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Professional Website Health Diagnostics</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight max-w-4xl mx-auto">
          Diagnose your website.{' '}
          <span className="text-primary block sm:inline">Fix what matters.</span>
        </h1>

        {/* Supporting Explanation */}
        <p className="mt-5 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          HMWebDoctor safely evaluates public websites across performance, SEO, passive security headers, accessibility compliance, and mobile readiness.
        </p>

        {/* Prominent URL Scanner Form */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <UrlScannerForm buttonText="Scan Website" autoFocus />
        </div>

        {/* Secondary Action Link */}
        <div className="mt-6 flex justify-center items-center space-x-4 text-xs font-medium text-muted">
          <span>Need to learn how it works first?</span>
          <Link
            to="/how-it-works"
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            How It Works &rarr;
          </Link>
        </div>

        {/* Transparent Principles Bar */}
        <div className="mt-12 pt-8 border-t border-border/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-surface/60 border border-border/60">
            <Eye className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Transparent Diagnostics</h4>
              <p className="text-[11px] text-muted leading-tight mt-0.5">Every finding includes evidence</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-surface/60 border border-border/60">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Safe & Passive</h4>
              <p className="text-[11px] text-muted leading-tight mt-0.5">SSRF-protected, safe analysis</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-surface/60 border border-border/60">
            <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Actionable Guidance</h4>
              <p className="text-[11px] text-muted leading-tight mt-0.5">Clear treatment recommendations</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-surface/60 border border-border/60">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">Deterministic Scope</h4>
              <p className="text-[11px] text-muted leading-tight mt-0.5">Zero fabricated scan results</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
