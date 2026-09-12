import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { ProductPrinciples } from '../components/sections/ProductPrinciples';
import { FinalCta } from '../components/sections/FinalCta';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export const AboutPage = () => {
  return (
    <>
      <SeoHead
        title="About HMWebDoctor — Website Health Platform"
        description="Learn about HMWebDoctor, the second product in the HM product family, dedicated to delivering transparent, actionable, and safe website diagnostics."
        canonicalPath="/about"
      />

      <PageContainer>
        <PageHeader
          title="About HMWebDoctor"
          subtitle="Diagnose your website. Fix what matters. Built for developers, small businesses, and agencies who need transparent website health analysis."
          badgeText="Product Overview"
        />

        <div className="space-y-8 mb-12">
          <Card>
            <CardHeader
              title="Why HMWebDoctor Exists"
              subtitle="Solving website health opacity with evidence-backed diagnostics"
            />
            <CardContent className="space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
              <p>
                Modern websites rely on dozens of moving parts—from HTTP security headers and search engine meta directives to performance budgets, mobile viewport layouts, and accessibility standards. When something breaks, identifying the root cause often requires sifting through raw developer tools.
              </p>
              <p>
                HMWebDoctor was built to bridge this gap. As the next project in the HM product family after HMDevTools, HMWebDoctor provides a safe, passive diagnostic utility that translates website observations into clear findings, severity ratings, and step-by-step treatment guidance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Our Engineering Philosophy"
              subtitle="Core principles guiding every feature we build"
            />
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">1. Real Evidence Over Speculation</h4>
                <p>
                  Every diagnostic finding connects to verifiable technical evidence—such as exact HTTP header strings, missing DOM tags, or oversized asset payloads.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">2. Safe, Non-Destructive Observations</h4>
                <p>
                  We treat every target website with care. Scans perform passive HTTP GET observations and never run intrusive exploits, brute force, or port scans.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">3. First-Class SSRF Protection</h4>
                <p>
                  Security is built in from day one. Outbound worker requests strictly block loopbacks, private IPv4/IPv6 ranges, link-local addresses, and cloud metadata endpoints.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">4. Actionable Treatment Guidance</h4>
                <p>
                  A diagnostic finding is only as good as the solution. HMWebDoctor provides clear remediation instructions so you can fix what matters quickly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <ProductPrinciples />
      <FinalCta />
    </>
  );
};
