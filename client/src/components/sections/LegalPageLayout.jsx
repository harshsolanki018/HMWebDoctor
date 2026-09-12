import React from 'react';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { Alert } from '../ui/Alert';

export const LegalPageLayout = ({ title, subtitle, lastUpdated = 'September 2026', children }) => {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle}
        badgeText={`Effective Date: ${lastUpdated}`}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="warning" title="Draft Policy Notice">
          This document represents the structured product policy draft for HMWebDoctor V1. It is provided for transparency and requires formal legal review prior to production deployment.
        </Alert>

        <div className="prose dark:prose-invert max-w-none text-foreground space-y-6 text-sm sm:text-base leading-relaxed bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm">
          {children}
        </div>
      </div>
    </PageContainer>
  );
};
