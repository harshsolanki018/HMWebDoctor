import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ShieldAlert, AlertTriangle, ArrowRight, ListFilter } from 'lucide-react';
import { RemediationDrawer } from './RemediationDrawer';

const DOMAIN_LABELS = {
  all: 'All Domains',
  security: 'Security',
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo_crawlability: 'SEO & Crawlability',
  markup_structure: 'Markup & Quality',
};

export const ActionCenterCard = ({ actionCenterData }) => {
  const [domainFilter, setDomainFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeTriggerRef = useRef(null);

  if (!actionCenterData || actionCenterData.status === 'error') return null;

  const { summary = {}, domainCounts = {}, items = [] } = actionCenterData;

  const filteredItems = items.filter((item) => {
    const matchDomain = domainFilter === 'all' || item.domain === domainFilter;
    const matchSeverity = severityFilter === 'all' || item.severity === severityFilter;
    return matchDomain && matchSeverity;
  });

  const handleOpenDrawer = (item, event) => {
    activeTriggerRef.current = event.currentTarget;
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      <Card className="border-primary/20 bg-surface">
        <CardHeader
          title="Action Center & Finding Prioritization"
          subtitle="Cross-category prioritized diagnostic issues ranked by technical severity and developer impact domain"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted mr-1">Actionable:</span>
              <Badge variant="danger">{summary.high || 0} High</Badge>
              <Badge variant="warn">{summary.medium || 0} Medium</Badge>
              <Badge variant="info">{summary.low || 0} Low</Badge>
            </div>
          }
        />
        <CardContent className="space-y-6">
          {/* Domain & Severity Filter Controls */}
          <div className="space-y-3 border-b border-border pb-4">
            {/* Technical Domain Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-muted flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" /> Domain:
              </span>
              {Object.keys(DOMAIN_LABELS).map((domainKey) => {
                const count = domainKey === 'all' ? summary.actionable : (domainCounts[domainKey] || 0);
                return (
                  <button
                    key={domainKey}
                    onClick={() => setDomainFilter(domainKey)}
                    className={`px-2.5 py-1 rounded-md transition-colors font-medium text-xs ${
                      domainFilter === domainKey
                        ? 'bg-primary text-primary-contrast font-semibold'
                        : 'bg-surface-muted text-muted hover:text-foreground'
                    }`}
                  >
                    {DOMAIN_LABELS[domainKey]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-muted">Severity:</span>
              {['all', 'high', 'medium', 'low'].map((sevKey) => {
                const count = sevKey === 'all' ? summary.actionable : (summary[sevKey] || 0);
                return (
                  <button
                    key={sevKey}
                    onClick={() => setSeverityFilter(sevKey)}
                    className={`px-2.5 py-0.5 rounded-md transition-colors capitalize text-xs ${
                      severityFilter === sevKey
                        ? 'bg-surface-muted text-foreground font-semibold border border-border'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {sevKey} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Items List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted italic py-6 text-center bg-surface-muted/30 rounded-xl border border-border">
                No actionable issues match the selected domain or severity filters.
              </p>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={`${item.findingId}-${index}`}
                  className="p-4 rounded-xl bg-surface border border-border space-y-2 hover:border-primary/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.severity === 'high' ? (
                        <ShieldAlert className="w-4 h-4 text-warn shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warn shrink-0" />
                      )}
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <Badge variant={item.severity === 'high' ? 'danger' : item.severity === 'medium' ? 'warn' : 'info'}>
                        {item.severity}
                      </Badge>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-muted text-muted font-mono border border-border">
                        {DOMAIN_LABELS[item.domain] || item.domain}
                      </span>
                    </div>

                    <p className="text-sm text-muted leading-relaxed">{item.message}</p>
                  </div>

                  <div className="shrink-0 pt-2 md:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      onClick={(e) => handleOpenDrawer(item, e)}
                    >
                      View Fix Guide
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slide-Over Remediation Drawer */}
      <RemediationDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        item={selectedItem}
        triggerRef={activeTriggerRef}
      />
    </>
  );
};

ActionCenterCard.propTypes = {
  actionCenterData: PropTypes.shape({
    status: PropTypes.string,
    summary: PropTypes.shape({
      actionable: PropTypes.number,
      high: PropTypes.number,
      medium: PropTypes.number,
      low: PropTypes.number,
    }),
    domainCounts: PropTypes.object,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        findingId: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        severity: PropTypes.string.isRequired,
        domain: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        message: PropTypes.string,
        recommendation: PropTypes.string,
        remediation: PropTypes.object,
      })
    ),
  }),
};

export default ActionCenterCard;
