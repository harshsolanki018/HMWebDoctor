import React from 'react';
import { Search, Shield, Zap, Eye, Smartphone, Link as LinkIcon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';

export const FeatureGrid = () => {
  const categories = [
    {
      icon: Search,
      title: 'SEO Health Assessment',
      description: 'HMWebDoctor evaluates title tags, meta descriptions, heading hierarchy (H1-H6), canonical URLs, open graph metadata, and robots directives.',
    },
    {
      icon: Shield,
      title: 'Passive Security Audit',
      description: 'Examines HTTPS enforcement, Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options, and cookie safety flags.',
    },
    {
      icon: Zap,
      title: 'Performance Analysis',
      description: 'Evaluates Core Web Vitals signals (FCP, LCP, CLS, TTFB), render-blocking resources, asset payload sizes, and network request counts.',
    },
    {
      icon: Eye,
      title: 'Accessibility Compliance',
      description: 'Verifies axe-core standards for image alt coverage, form labels, ARIA attributes, semantic structure, and color contrast signals.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Readiness',
      description: 'Analyzes viewport configuration, mobile tap target dimensions, horizontal overflow, and controlled mobile browser profile rendering.',
    },
    {
      icon: LinkIcon,
      title: 'Links & Image Optimization',
      description: 'Checks same-origin link health, HTTP redirect chains, missing image alt attributes, oversized assets, and modern image format opportunities.',
    },
  ];

  return (
    <section className="py-16 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Diagnostic Coverage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
            Areas HMWebDoctor is designed to evaluate
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
            A comprehensive, non-destructive health audit covering every essential aspect of a modern public website.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.title} hover className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{cat.title}</h3>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {cat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
