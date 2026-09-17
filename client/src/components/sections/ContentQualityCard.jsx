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

const formatValueDisplay = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    return (
      <div className="mt-2 text-xs font-mono bg-surface-muted p-2 rounded border border-border text-foreground space-y-1">
        {Object.entries(value).map(([key, val]) => {
          let displayVal = val;
          if (Array.isArray(val)) {
            displayVal = val.length === 0 ? 'None' : val.join(', ');
          } else if (typeof val === 'boolean') {
            displayVal = val ? 'Yes' : 'No';
          }
          return (
            <div key={key} className="flex flex-wrap justify-between gap-2">
              <span className="text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
              <span className="font-semibold text-foreground">{String(displayVal)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return <span className="font-mono text-xs text-foreground font-semibold">{String(value)}</span>;
};

export const ContentQualityCard = ({ contentData }) => {
  const [filter, setFilter] = useState('all');

  if (!contentData) return null;

  const { summary = {}, findings = [] } = contentData;

  const filteredFindings = findings.filter((f) => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  return (
    <Card>
      <CardHeader
        title="Passive Content & Technical HTML Quality Analysis"
        subtitle="Body visible text volume, duplicate block text, HTML structure tags, duplicate element IDs, link classification, resource src validity, and image dimensions"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted mr-1">Summary:</span>
            <Badge variant="pass">{summary.pass || 0} Pass</Badge>
            <Badge variant="warn">{summary.warn || 0} Warn</Badge>
            {summary.fail > 0 && <Badge variant="danger">{summary.fail} Fail</Badge>}
            <Badge variant="info">{summary.info || 0} Info</Badge>
          </div>
        }
      />
      <CardContent className="space-y-6">
        {/* Explicit 5-Button Filter Tabs: All, Pass, Warn, Fail, Info */}
        <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
          <span className="font-semibold text-muted">Filter:</span>
          {['all', 'pass', 'warn', 'fail', 'info'].map((type) => (
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
              No content findings match the selected filter.
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

                <p className="text-sm text-muted leading-relaxed">{finding.message}</p>

                {formatValueDisplay(finding.value)}

                {finding.recommendation && (
                  <p className="text-xs text-muted/80 pt-1">
                    <span className="font-semibold text-foreground">Recommendation:</span>{' '}
                    {finding.recommendation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

ContentQualityCard.propTypes = {
  contentData: PropTypes.shape({
    status: PropTypes.string,
    summary: PropTypes.shape({
      pass: PropTypes.number,
      warn: PropTypes.number,
      fail: PropTypes.number,
      info: PropTypes.number,
    }),
    findings: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        category: PropTypes.string,
        status: PropTypes.string.isRequired,
        severity: PropTypes.string,
        title: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        value: PropTypes.any,
        recommendation: PropTypes.string,
      })
    ),
  }),
};

export default ContentQualityCard;
