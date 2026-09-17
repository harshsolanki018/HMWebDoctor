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

export const ReportPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
    setCategoryFilter('all');
    setSeverityFilter('all');
    setStatusFilter('all');
  };

  // Helper to filter findings within a single category
  const getFilteredCategoryData = (catKey, catObj) => {
    if (!catObj || !Array.isArray(catObj.findings)) return catObj;

    if (categoryFilter !== 'all' && categoryFilter !== catKey) {
      return { ...catObj, findings: [] };
    }

    const query = searchTerm.trim().toLowerCase();

    const filtered = catObj.findings.filter((finding) => {
      if (severityFilter !== 'all' && finding.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && finding.status !== statusFilter) return false;
      if (query) {
        const matchId = finding.id?.toLowerCase().includes(query);
        const matchTitle = finding.title?.toLowerCase().includes(query);
        const matchMessage = finding.message?.toLowerCase().includes(query);
        const matchRec = finding.recommendation?.toLowerCase().includes(query);
        const matchVal = finding.value !== null && finding.value !== undefined ? String(finding.value).toLowerCase().includes(query) : false;
        return matchId || matchTitle || matchMessage || matchRec || matchVal;
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

            {/* Real-time Search & Multi-Group Filters */}
            <FindingSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              severityFilter={severityFilter}
              onSeverityChange={setSeverityFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onResetFilters={handleResetFilters}
              totalCount={totalCount}
              filteredCount={filteredCount}
            />

            {/* Action Center Card */}
            {report.actionCenter && (
              <ActionCenterCard
                actionCenterData={{
                  ...report.actionCenter,
                  items: report.actionCenter.items?.filter((item) => {
                    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
                    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
                    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
                    if (searchTerm.trim()) {
                      const q = searchTerm.trim().toLowerCase();
                      const matchId = item.findingId?.toLowerCase().includes(q);
                      const matchTitle = item.title?.toLowerCase().includes(q);
                      const matchMessage = item.message?.toLowerCase().includes(q);
                      return matchId || matchTitle || matchMessage;
                    }
                    return true;
                  }),
                }}
              />
            )}

            {/* 8 Modular Category Cards */}
            <div className="space-y-8">
              <SeoFindingsCard seoData={getFilteredCategoryData('seo', report.categories.seo)} />
              <SecurityHeadersCard securityHeadersData={getFilteredCategoryData('securityHeaders', report.categories.securityHeaders)} />
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
