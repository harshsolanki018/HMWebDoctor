import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { ReportHeader } from '../components/sections/ReportHeader';
import { FindingSearchBar } from '../components/sections/FindingSearchBar';
import { ActionCenterCard } from '../components/sections/ActionCenterCard';
import { SeoFindingsCard } from '../components/sections/SeoFindingsCard';
import { SecurityHeadersCard } from '../components/sections/SecurityHeadersCard';
import { CrawlabilityCard } from '../components/sections/CrawlabilityCard';
import { TechnicalDetailsCard } from '../components/sections/TechnicalDetailsCard';
import { PerformanceCard } from '../components/sections/PerformanceCard';
import { AccessibilityCard } from '../components/sections/AccessibilityCard';
import { MobileReadinessCard } from '../components/sections/MobileReadinessCard';
import { ContentQualityCard } from '../components/sections/ContentQualityCard';
import { Skeleton } from '../components/ui/Skeleton';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { getScanById } from '../services/api';
import { AlertCircle, RotateCcw } from 'lucide-react';

// Domain Map for all 55 exact finding IDs (matching M8 Action Center domain mapping)
export const FINDING_DOMAIN_MAP = {
  // Security
  'sec-https': 'security',
  'sec-hsts': 'security',
  'sec-csp': 'security',
  'sec-x-frame-options': 'security',
  'sec-x-content-type-options': 'security',
  'sec-referrer-policy': 'security',
  'sec-permissions-policy': 'security',
  'sec-cookie-flags': 'security',

  // Accessibility
  'a11y-image-alt': 'accessibility',
  'a11y-iframe-title': 'accessibility',
  'a11y-form-labels': 'accessibility',
  'a11y-button-name': 'accessibility',
  'a11y-link-name': 'accessibility',
  'a11y-aria-attributes': 'accessibility',
  'a11y-landmarks': 'accessibility',
  'a11y-table-markup': 'accessibility',
  'a11y-tabindex-positive': 'accessibility',
  'a11y-html-lang': 'accessibility',
  'mobile-viewport-zoom': 'accessibility',
  'mobile-input-types': 'accessibility',
  'mobile-inputmode': 'accessibility',
  'mobile-autocomplete': 'accessibility',

  // Performance
  'perf-blocking-scripts': 'performance',
  'perf-stylesheets-css': 'performance',
  'perf-inline-css': 'performance',
  'perf-resource-hints': 'performance',
  'perf-dom-footprint': 'performance',
  'perf-image-lazyloading': 'performance',
  'tech-compression': 'performance',
  'tech-caching': 'performance',

  // SEO & Crawlability
  'seo-title': 'seo_crawlability',
  'seo-meta-description': 'seo_crawlability',
  'seo-canonical': 'seo_crawlability',
  'seo-meta-robots': 'seo_crawlability',
  'seo-viewport': 'seo_crawlability',
  'seo-heading-h1': 'seo_crawlability',
  'seo-heading-hierarchy': 'seo_crawlability',
  'seo-opengraph': 'seo_crawlability',
  'crawl-x-robots-tag': 'seo_crawlability',
  'crawl-html-sitemap': 'seo_crawlability',
  'crawl-robots-txt': 'seo_crawlability',

  // Markup & Structure
  'content-empty-page': 'markup_structure',
  'content-low-volume': 'markup_structure',
  'content-word-count': 'markup_structure',
  'content-duplicate-paragraphs': 'markup_structure',
  'content-document-structure': 'markup_structure',
  'content-duplicate-ids': 'markup_structure',
  'content-link-classification': 'markup_structure',
  'content-href-markup': 'markup_structure',
  'content-src-markup': 'markup_structure',
  'content-image-dimensions': 'markup_structure',
  'tech-status-code': 'markup_structure',
  'tech-charset': 'markup_structure',
  'tech-doctype-size': 'markup_structure',
  'mobile-meta-tags': 'markup_structure',
};

export const getDomainForFinding = (finding) => {
  if (!finding) return 'markup_structure';
  if (finding.domain) return finding.domain;
  const fId = finding.id || finding.findingId;
  if (fId && FINDING_DOMAIN_MAP[fId]) return FINDING_DOMAIN_MAP[fId];
  if (fId?.startsWith('sec-')) return 'security';
  if (fId?.startsWith('a11y-')) return 'accessibility';
  if (fId?.startsWith('perf-')) return 'performance';
  if (fId?.startsWith('seo-') || fId?.startsWith('crawl-')) return 'seo_crawlability';
  if (fId?.startsWith('content-') || fId?.startsWith('tech-') || fId?.startsWith('mobile-')) return 'markup_structure';
  return 'markup_structure';
};

export const ReportPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Search & Filter State (Exact M9 Filter Groups: domain, category, severity)
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getScanById(scanId);

      if (!isMounted) return;

      if (result.success && result.data) {
        setReport(result.data);
      } else {
        setError(
          result.error || {
            code: 'NOT_FOUND',
            message: 'Scan report not found or expired.',
          }
        );
      }
      setIsLoading(false);
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [scanId]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDomainFilter('all');
    setCategoryFilter('all');
    setSeverityFilter('all');
  };

  // Helper to filter findings within a single category according to M9 contracts
  const getFilteredCategoryData = (catKey, catObj) => {
    if (!catObj || !Array.isArray(catObj.findings)) return catObj;

    if (categoryFilter !== 'all' && categoryFilter !== catKey) {
      return { ...catObj, findings: [] };
    }

    const query = searchTerm.trim().toLowerCase();

    const filtered = catObj.findings.filter((finding) => {
      // Domain filter check
      if (domainFilter !== 'all' && getDomainForFinding(finding) !== domainFilter) return false;

      // Severity filter check
      if (severityFilter !== 'all' && finding.severity !== severityFilter) return false;

      // Text search check (OR across EXACTLY 4 approved fields: id, title, message, recommendation)
      if (query) {
        const fId = finding.id || finding.findingId;
        const matchId = fId ? fId.toLowerCase().includes(query) : false;
        const matchTitle = finding.title ? finding.title.toLowerCase().includes(query) : false;
        const matchMessage = finding.message ? finding.message.toLowerCase().includes(query) : false;
        const matchRec = finding.recommendation ? finding.recommendation.toLowerCase().includes(query) : false;

        // NOTE: finding.value is intentionally EXCLUDED from text search match per M9 Search Contract
        return matchId || matchTitle || matchMessage || matchRec;
      }
      return true;
    });

    return {
      ...catObj,
      findings: filtered,
    };
  };

  // Total findings count across all categories
  let totalCount = 0;
  let filteredCount = 0;

  if (report && report.categories) {
    Object.keys(report.categories).forEach((catKey) => {
      const cat = report.categories[catKey];
      if (cat && Array.isArray(cat.findings)) {
        totalCount += cat.findings.length;
        const filteredCat = getFilteredCategoryData(catKey, cat);
        filteredCount += filteredCat.findings.length;
      }
    });
  }

  // Filtered Action Center Items
  const filteredActionCenterItems = report?.actionCenter?.items?.filter((item) => {
    const itemDomain = item.domain || getDomainForFinding(item);
    if (domainFilter !== 'all' && itemDomain !== domainFilter) return false;
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const fId = item.findingId || item.id;
      const matchId = fId ? fId.toLowerCase().includes(q) : false;
      const matchTitle = item.title ? item.title.toLowerCase().includes(q) : false;
      const matchMessage = item.message ? item.message.toLowerCase().includes(q) : false;
      const matchRec = item.recommendation ? item.recommendation.toLowerCase().includes(q) : false;
      return matchId || matchTitle || matchMessage || matchRec;
    }
    return true;
  }) || [];

  return (
    <>
      <SeoHead
        title={report ? `Scan Report: ${report.targetUrl} - HMWebDoctor` : 'Scan Report - HMWebDoctor'}
        description="Shareable website diagnostic report detailing passive security, performance, accessibility, SEO, and content findings."
        noindex={true}
      />

      <PageContainer>
        <PageHeader
          title="Diagnostic Scan Report"
          subtitle="Comprehensive, passive analysis report for public website diagnosis"
        />

        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {error && !isLoading && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
            <Alert variant="danger" icon={AlertCircle} title="Report Not Found">
              {error.message || 'The requested scan report could not be found or has expired.'}
            </Alert>
            <Button variant="primary" icon={RotateCcw} onClick={() => navigate('/scan')}>
              Run a New Website Scan
            </Button>
          </div>
        )}

        {report && !isLoading && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Report Header Bar */}
            <ReportHeader report={report} />

            {/* Real-time Search & Filter Bar (Domain, Category, Severity) */}
            <FindingSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              domainFilter={domainFilter}
              onDomainChange={setDomainFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              severityFilter={severityFilter}
              onSeverityChange={setSeverityFilter}
              onResetFilters={handleResetFilters}
              totalCount={totalCount}
              filteredCount={filteredCount}
            />

            {/* Action Center Card */}
            {report.actionCenter && (
              <ActionCenterCard
                actionCenterData={{
                  ...report.actionCenter,
                  summary: {
                    ...report.actionCenter.summary,
                    actionable: filteredActionCenterItems.length,
                  },
                  items: filteredActionCenterItems,
                }}
              />
            )}

            {/* 8 Modular Category Cards */}
            <div className="space-y-8">
              <SeoFindingsCard seoData={getFilteredCategoryData('seo', report.categories.seo)} />
              <SecurityHeadersCard securityData={getFilteredCategoryData('securityHeaders', report.categories.securityHeaders)} />
              <CrawlabilityCard crawlabilityData={getFilteredCategoryData('crawlability', report.categories.crawlability)} />
              <TechnicalDetailsCard technicalData={getFilteredCategoryData('technical', report.categories.technical)} />
              <PerformanceCard performanceData={getFilteredCategoryData('performance', report.categories.performance)} />
              <AccessibilityCard accessibilityData={getFilteredCategoryData('accessibility', report.categories.accessibility)} />
              <MobileReadinessCard mobileData={getFilteredCategoryData('mobile', report.categories.mobile)} />
              <ContentQualityCard contentData={getFilteredCategoryData('content', report.categories.content)} />
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
};
