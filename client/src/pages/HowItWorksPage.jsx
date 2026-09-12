import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { HowItWorksSteps } from '../components/sections/HowItWorksSteps';
import { FeatureGrid } from '../components/sections/FeatureGrid';
import { FinalCta } from '../components/sections/FinalCta';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { CheckCircle2, Shield } from 'lucide-react';

export const HowItWorksPage = () => {
  return (
    <>
      <SeoHead
        title="How It Works — Website Diagnostic Workflow"
        description="Learn how HMWebDoctor safely evaluates websites using SSRF-protected, passive observation workers to deliver categorized findings and treatment guidance."
        canonicalPath="/how-it-works"
      />

      <PageContainer>
        <PageHeader
          title="How HMWebDoctor Diagnoses Websites"
          subtitle="A clear, transparent explanation of our diagnostic process, examination scope, and engineering principles."
          badgeText="Product Workflow"
        />

        <div className="space-y-12 mb-12">
          {/* Workflow Steps */}
          <HowItWorksSteps showTitle={false} />

          {/* Detailed Examination Breakdown */}
          <Card>
            <CardHeader
              title="What Happens During a Diagnostic Examination?"
              subtitle="Inside HMWebDoctor's non-intrusive observation engine"
            />
            <CardContent className="space-y-6 text-sm text-muted leading-relaxed">
              <p>
                When a public website URL is submitted for diagnosis, HMWebDoctor passes the target through a multi-stage, SSRF-safe observation pipeline:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-2">
                  <div className="flex items-center space-x-2 text-foreground font-semibold">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>1. Security & SSRF Pre-Flight</span>
                  </div>
                  <p className="text-muted">
                    Validates protocol (HTTP/HTTPS), resolves DNS, and blocks private IP ranges, loopback addresses, link-local endpoints, and cloud metadata targets before fetching.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-2">
                  <div className="flex items-center space-x-2 text-foreground font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>2. Passive HTTP & DOM Observation</span>
                  </div>
                  <p className="text-muted">
                    Examines response headers, SSL/TLS configuration, HTML meta tags, heading hierarchy, asset payloads, and accessibility DOM attributes.
                  </p>
                </div>
              </div>

              <Alert variant="info" title="Safe Passive Analysis Guarantee">
                HMWebDoctor performs safe, non-destructive HTTP GET requests. We never perform penetration testing, brute-force attacks, port scanning, or intrusive payloads.
              </Alert>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      {/* Feature Grid & Final CTA */}
      <FeatureGrid />
      <FinalCta />
    </>
  );
};
