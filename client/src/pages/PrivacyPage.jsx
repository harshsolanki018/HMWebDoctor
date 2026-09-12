import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { LegalPageLayout } from '../components/sections/LegalPageLayout';

export const PrivacyPage = () => {
  return (
    <>
      <SeoHead
        title="Privacy Policy — HMWebDoctor"
        description="Read the HMWebDoctor Privacy Policy regarding website URL scanning, local storage preferences, technical data collection, and data handling practices."
        canonicalPath="/privacy"
      />

      <LegalPageLayout
        title="Privacy Policy"
        subtitle="How HMWebDoctor handles public website URLs, local storage, technical data, and user preferences."
        lastUpdated="September 2026"
      >
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">1. Overview</h2>
          <p>
            HMWebDoctor is a website health and diagnostic platform. This Privacy Policy describes how we collect, use, and handle information when you visit our website or submit public URLs for health diagnosis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
          <p>
            HMWebDoctor is designed with privacy-conscious principles:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted">
            <li>
              <strong>Submitted Website URLs:</strong> When you submit a URL for health diagnosis, our system processes the public web address to perform HTTP observations.
            </li>
            <li>
              <strong>Technical & Network Data:</strong> Standard server logs record IP addresses, user agent strings, and request timestamps to maintain system security and rate limits.
            </li>
            <li>
              <strong>Local Storage Preferences:</strong> We store your visual theme selection (system/light/dark) in your browser&apos;s local storage.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">3. How We Use Submitted Data</h2>
          <p>
            Submitted URLs are used exclusively to fetch public website metadata, HTTP headers, DOM tags, and performance signals required to generate website health diagnostic reports. We do not sell URL submission history to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">4. Safe Scanning & Security</h2>
          <p>
            Our scanner workers implement strict Server-Side Request Forgery (SSRF) protections. Outbound worker fetches strictly block private IPv4/IPv6 ranges, loopback endpoints, internal subnets, and cloud metadata services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">5. Cookies & Local Storage</h2>
          <p>
            HMWebDoctor does not use tracking cookies or third-party advertising trackers. We utilize browser local storage solely to remember your chosen user interface theme.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">6. Contact & Inquiries</h2>
          <p>
            For questions regarding this draft Privacy Policy or data handling practices, please contact us via our Contact Page.
          </p>
        </section>
      </LegalPageLayout>
    </>
  );
};
