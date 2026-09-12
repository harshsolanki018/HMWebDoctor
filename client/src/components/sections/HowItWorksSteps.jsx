import React from 'react';
import { Globe, Cpu, FileCheck2 } from 'lucide-react';

export const HowItWorksSteps = ({ showTitle = true }) => {
  const steps = [
    {
      number: '01',
      icon: Globe,
      title: 'Enter your website URL',
      description: 'Provide any public HTTP or HTTPS website address. Client-side validation inspects URL syntax and protocol.',
    },
    {
      number: '02',
      icon: Cpu,
      title: 'HMWebDoctor examines your site',
      description: 'Our SSRF-protected worker executes safe, passive HTTP and browser-level observations without intrusive testing.',
    },
    {
      number: '03',
      icon: FileCheck2,
      title: 'Receive actionable treatment guidance',
      description: 'Get an explainable health report with categorized findings, severity levels, technical evidence, and concrete fix instructions.',
    },
  ];

  return (
    <section className="py-16 bg-surface-muted/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
              How HMWebDoctor works
            </h2>
            <p className="mt-2 text-sm text-muted">
              From URL entry to actionable treatment guidance in three clear steps.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative p-6 rounded-xl bg-surface border border-border shadow-sm flex flex-col items-start"
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-muted/30 font-mono">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {step.description}
                </p>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-muted/40">
                    &rarr;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
