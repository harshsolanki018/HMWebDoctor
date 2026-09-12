import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { LegalPageLayout } from '../components/sections/LegalPageLayout';

export const TermsPage = () => {
  return (
    <>
      <SeoHead
        title="Terms of Service — HMWebDoctor"
        description="Read the HMWebDoctor Terms of Service regarding acceptable website diagnostic use, website authorization, service limits, and non-destructive scanning guidelines."
        canonicalPath="/terms"
      />

      <LegalPageLayout
        title="Terms of Service"
        subtitle="Acceptable use guidelines, site ownership responsibilities, and service conditions for HMWebDoctor."
        lastUpdated="September 2026"
      >
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. Agreement to Terms</h2>
          <p>
            By accessing or using HMWebDoctor, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not access or use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Authorized Diagnostic Use</h2>
          <p>
            HMWebDoctor is a passive website health analysis utility. You agree to submit only website URLs that are publicly accessible on the internet and for which you have explicit authorization or legitimate interest to diagnose.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. Prohibited Misuse</h2>
          <p>
            You explicitly agree NOT to use HMWebDoctor for:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted">
            <li>Attempting to bypass security controls, brute-force credentials, or execute destructive payloads against any target server.</li>
            <li>Submitting internal IP addresses, loopback endpoints (`127.0.0.1`, `localhost`), or cloud metadata endpoints (`169.254.169.254`).</li>
            <li>Submitting automated requests designed to denial-of-service (DoS) third-party web infrastructure.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. Non-Destructive Passive Analysis</h2>
          <p>
            HMWebDoctor performs safe, non-intrusive HTTP GET observations. Reports provide technical health feedback and recommendations; they do not constitute a full penetration test or security guarantee.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">5. Service Availability & Limitations</h2>
          <p>
            HMWebDoctor reserves the right to rate-limit, restrict, or suspend diagnostic access to prevent abuse or service degradation. Diagnostic checks may return `NOT_TESTED` or `PARTIAL` if a target site times out or blocks requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. Changes to Terms</h2>
          <p>
            We reserve the right to update these terms as product capabilities evolve. Continued use of HMWebDoctor following updates indicates acceptance of modified terms.
          </p>
        </section>
      </LegalPageLayout>
    </>
  );
};
