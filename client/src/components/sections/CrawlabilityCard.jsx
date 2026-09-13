import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pass':
      return 'pass';
    case 'warn':
      return 'warn';
    case 'fail':
      return 'danger';
    case 'info':
    default:
      return 'info';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="w-4 h-4 text-pass shrink-0" />;
    case 'warn':
    case 'fail':
      return <AlertTriangle className="w-4 h-4 text-warn shrink-0" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-info shrink-0" />;
  }
};

export const CrawlabilityCard = ({ crawlabilityData }) => {
  const [filter, setFilter] = useState('all');

  if (!crawlabilityData) return null;

  const { summary = {}, findings = [] } = crawlabilityData;

  const filteredFindings = findings.filter((f) => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  return (
    <Card>
      <CardHeader
        title="Crawlability & Indexability"
        subtitle="X-Robots-Tag directives, HTML sitemap link declarations, and bounded robots.txt inspection"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted mr-1">Summary:</span>
            <Badge variant="pass">{summary.pass || 0} Pass</Badge>
            <Badge variant="warn">{summary.warn || 0} Warn</Badge>
            <Badge variant="info">{summary.info || 0} Info</Badge>
          </div>
        }
      />
      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
          <span className="font-semibold text-muted">Filter:</span>
          {['all', 'pass', 'warn', 'info'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2.5 py-1 rounded-md transition-colors capitalize font-medium ${
                filter === type
                  ? 'bg-primary text-primary-contrast'
                  : 'bg-surface-muted text-muted hover:text-foreground'
              }`}
            >
              {type} {type !== 'all' && `(${summary[type] || 0})`}
            </button>
          ))}
        </div>

        {/* Findings List */}
        <div className="space-y-4">
          {filteredFindings.length === 0 ? (
            <p className="text-sm text-muted italic py-4 text-center">
              No crawlability findings match the selected filter.
            </p>
          ) : (
            filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-4 rounded-xl bg-surface border border-border space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(finding.status)}
                    <h4 className="text-sm font-semibold text-foreground">{finding.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {finding.severity && finding.severity !== 'info' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-muted text-muted border border-border">
                        {finding.severity}
                      </span>
                    )}
                    <Badge variant={getStatusBadgeVariant(finding.status)}>
                      {finding.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed">{finding.message}</p>

                {/* Display Value */}
                {finding.value !== null && finding.value !== undefined && (
                  <div className="p-2.5 rounded-lg bg-surface-muted font-mono text-xs text-foreground overflow-x-auto">
                    {typeof finding.value === 'object' ? (
                      <pre className="text-[11px] font-mono leading-tight">
                        {JSON.stringify(finding.value, null, 2)}
                      </pre>
                    ) : (
                      <span>{String(finding.value)}</span>
                    )}
                  </div>
                )}

                {/* Actionable Recommendation */}
                {finding.recommendation && (
                  <div className="p-3 rounded-lg bg-surface-muted/50 border-l-2 border-primary text-xs space-y-0.5">
                    <span className="font-semibold text-primary block">Recommendation</span>
                    <p className="text-muted">{finding.recommendation}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

CrawlabilityCard.propTypes = {
  crawlabilityData: PropTypes.shape({
    status: PropTypes.string,
    summary: PropTypes.object,
    findings: PropTypes.array,
  }),
};
