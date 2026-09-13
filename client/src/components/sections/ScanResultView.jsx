import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SeoFindingsCard } from './SeoFindingsCard';
import { SecurityHeadersCard } from './SecurityHeadersCard';
import { CrawlabilityCard } from './CrawlabilityCard';
import { TechnicalDetailsCard } from './TechnicalDetailsCard';
import { PerformanceCard } from './PerformanceCard';
import { AccessibilityCard } from './AccessibilityCard';
import { MobileReadinessCard } from './MobileReadinessCard';
import {
  Globe,
  Clock,
  HardDrive,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Tag,
  ListChecks,
} from 'lucide-react';

export const ScanResultView = ({ scanData, onNewScan }) => {
  if (!scanData) return null;

  const {
    scanId,
    targetUrl,
    finalUrl,
    redirectCount,
    redirectChain = [],
    timing = {},
    document: doc = {},
    categories = {},
    summary = {},
  } = scanData;

  const baseline = doc.baseline || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview Card */}
      <Card>
        <CardHeader
          title="Baseline Scan Summary"
          subtitle={`Scan ID: ${scanId}`}
          action={
            <Button variant="outline" size="sm" icon={RotateCcw} onClick={onNewScan}>
              Scan Another URL
            </Button>
          }
        />
        <CardContent className="space-y-6">
          {/* Main Key-Value Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-muted border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                <Globe className="w-3.5 h-3.5" />
                Status Code
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{doc.statusCode}</span>
                <Badge variant={doc.statusCode >= 200 && doc.statusCode < 300 ? 'pass' : 'warn'}>
                  {doc.statusCode === 200 ? 'OK' : `HTTP ${doc.statusCode}`}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                <Clock className="w-3.5 h-3.5" />
                Fetch Latency
              </div>
              <div className="text-xl font-bold text-foreground">
                {timing.durationMs ? `${timing.durationMs} ms` : 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                Document Size
              </div>
              <div className="text-xl font-bold text-foreground">
                {doc.contentLengthBytes
                  ? `${(doc.contentLengthBytes / 1024).toFixed(1)} KB`
                  : 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pass" />
                SSRF Validation
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-pass">Verified Safe Target</span>
              </div>
            </div>
          </div>

          {/* Overall Diagnostic Finding Counts */}
          {summary && (typeof summary.pass === 'number' || typeof summary.warn === 'number') && (
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <ListChecks className="w-4 h-4 text-primary" />
                Total Scan Finding Counts
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="pass" size="md">
                  {summary.pass || 0} Passed Checks
                </Badge>
                <Badge variant="warn" size="md">
                  {summary.warn || 0} Warnings
                </Badge>
                <Badge variant="info" size="md">
                  {summary.info || 0} Informational
                </Badge>
                {summary.fail > 0 && (
                  <Badge variant="danger" size="md">
                    {summary.fail} Failures
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* URLs and Redirect Information */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-muted">Target URL</span>
              <span className="font-mono text-primary truncate max-w-xl">{targetUrl}</span>
            </div>

            {finalUrl && finalUrl !== targetUrl && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-semibold text-muted flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-pass" />
                  Final Destination (after {redirectCount} redirect{redirectCount > 1 ? 's' : ''})
                </span>
                <span className="font-mono text-foreground truncate max-w-xl">{finalUrl}</span>
              </div>
            )}

            {redirectChain.length > 0 && (
              <div className="p-3 rounded-lg bg-surface border border-border text-xs space-y-1">
                <span className="font-semibold text-muted block mb-1">Redirect Chain:</span>
                {redirectChain.map((hop, idx) => (
                  <div key={idx} className="font-mono text-muted flex items-center gap-2 pl-2">
                    <span className="text-primary font-bold">{idx + 1}.</span>
                    <span>{hop.url}</span>
                    <Badge variant="info">{hop.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HTML Document Baseline Analysis */}
      <Card>
        <CardHeader
          title="Baseline Document Metadata"
          subtitle="Passively parsed document structure and HTML meta tags"
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Tag className="w-3.5 h-3.5" />
                Document Title
              </div>
              <p className="text-sm font-semibold text-foreground">
                {baseline.title ? (
                  baseline.title
                ) : (
                  <span className="text-muted italic">No &lt;title&gt; tag found</span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <FileCode2 className="w-3.5 h-3.5" />
                Content Type & Encoding
              </div>
              <div className="flex items-center gap-2 text-sm font-mono text-foreground">
                <span>{doc.contentType || 'N/A'}</span>
                {baseline.charset && <Badge variant="info">{baseline.charset}</Badge>}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Globe className="w-3.5 h-3.5" />
                HTML Language (`lang` attribute)
              </div>
              <div className="flex items-center gap-2">
                {baseline.lang ? (
                  <>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {baseline.lang}
                    </span>
                    <Badge variant="pass" icon={CheckCircle2}>
                      Specified
                    </Badge>
                  </>
                ) : (
                  <Badge variant="warn" icon={AlertTriangle}>
                    Missing `lang` attribute
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <FileCode2 className="w-3.5 h-3.5" />
                DOCTYPE Declaration
              </div>
              <div className="flex items-center gap-2">
                {baseline.hasDoctype ? (
                  <Badge variant="pass" icon={CheckCircle2}>
                    Valid &lt;!DOCTYPE html&gt;
                  </Badge>
                ) : (
                  <Badge variant="warn" icon={AlertTriangle}>
                    Missing DOCTYPE
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Meta Description Box */}
          <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
            <span className="text-xs font-semibold text-muted block">Meta Description</span>
            <p className="text-sm text-foreground">
              {baseline.description ? (
                baseline.description
              ) : (
                <span className="text-muted italic">No meta description found</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Analyzer Cards */}
      {categories.seo && <SeoFindingsCard seoData={categories.seo} />}
      {categories.securityHeaders && (
        <SecurityHeadersCard securityData={categories.securityHeaders} />
      )}
      {categories.crawlability && (
        <CrawlabilityCard crawlabilityData={categories.crawlability} />
      )}
      {categories.technical && (
        <TechnicalDetailsCard technicalData={categories.technical} />
      )}
      {categories.performance && (
        <PerformanceCard performanceData={categories.performance} />
      )}
      {categories.accessibility && (
        <AccessibilityCard accessibilityData={categories.accessibility} />
      )}
      {categories.mobile && (
        <MobileReadinessCard mobileData={categories.mobile} />
      )}
    </div>
  );
};

ScanResultView.propTypes = {
  scanData: PropTypes.shape({
    scanId: PropTypes.string,
    targetUrl: PropTypes.string,
    finalUrl: PropTypes.string,
    redirectCount: PropTypes.number,
    redirectChain: PropTypes.array,
    timing: PropTypes.object,
    document: PropTypes.object,
    summary: PropTypes.object,
    categories: PropTypes.object,
  }),
  onNewScan: PropTypes.func.isRequired,
};
