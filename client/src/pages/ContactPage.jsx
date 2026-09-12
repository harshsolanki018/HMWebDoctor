import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { ContactForm } from '../components/sections/ContactForm';
import { Mail, MessageSquare, ShieldCheck } from 'lucide-react';

export const ContactPage = () => {
  return (
    <>
      <SeoHead
        title="Contact Us — HMWebDoctor Support"
        description="Get in touch with the HMWebDoctor team for inquiries, technical feedback, or questions regarding website health diagnostics."
        canonicalPath="/contact"
      />

      <PageContainer>
        <PageHeader
          title="Get in Touch"
          subtitle="Have questions about HMWebDoctor or suggestions for diagnostic features? Send us a message below."
          badgeText="Contact Support"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Contact Form (2 columns) */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Right: Support Information (1 column) */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
              <div className="flex items-center space-x-3 text-primary font-semibold text-sm">
                <Mail className="w-5 h-5" />
                <span>Product Feedback</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                We welcome developer feedback, scanner suggestions, and diagnostic bug reports as we build out HMWebDoctor V1.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
              <div className="flex items-center space-x-3 text-primary font-semibold text-sm">
                <MessageSquare className="w-5 h-5" />
                <span>HM Family Products</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                HMWebDoctor is part of the HM product suite alongside HMDevTools, adhering to high standards of performance and design.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
              <div className="flex items-center space-x-3 text-primary font-semibold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Safe Diagnostics Guarantee</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Our diagnostic tools use safe, non-destructive HTTP analysis only. We never perform intrusive security testing.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
};
