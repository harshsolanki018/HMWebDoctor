import React from 'react';
import { UrlScannerForm } from './UrlScannerForm';

export const FinalCta = () => {
  return (
    <section className="py-16 bg-surface border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Ready to diagnose your website?
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
          Enter any public website URL below to test syntax, validate protocol readiness, and prepare your domain for health analysis.
        </p>

        <div className="mt-8 max-w-xl mx-auto">
          <UrlScannerForm buttonText="Scan Website" />
        </div>
      </div>
    </section>
  );
};
