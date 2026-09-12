import React from 'react';
import { Eye, ShieldAlert, Wrench, Lock } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export const ProductPrinciples = () => {
  const principles = [
    {
      icon: Eye,
      title: 'Transparent Diagnostics & Real Evidence',
      description: 'Every finding includes exact code snippets, HTTP header values, or DOM selectors so developers can verify and reproduce findings immediately.',
    },
    {
      icon: Wrench,
      title: 'Actionable Fix Guidance',
      description: 'Instead of raw error codes, HMWebDoctor explains why each issue matters and provides step-by-step remediation instructions.',
    },
    {
      icon: ShieldAlert,
      title: 'Safe Passive Analysis Only',
      description: 'HMWebDoctor performs safe, non-intrusive HTTP requests. We do not perform penetration testing, brute force, port scanning, or destructive requests.',
    },
    {
      icon: Lock,
      title: 'First-Class SSRF Security',
      description: 'All user-supplied target URLs are validated against private IP ranges, loopback endpoints, cloud metadata services, and redirect limits before fetching.',
    },
  ];

  return (
    <section className="py-16 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Engineering Standards
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
            Built on transparent product principles
          </h2>
          <p className="mt-2 text-sm text-muted">
            Delivering clean, trustworthy, and actionable website health diagnostics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="p-2">
                <CardContent className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
