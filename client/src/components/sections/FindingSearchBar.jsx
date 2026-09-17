import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, X, Filter } from 'lucide-react';

const DOMAIN_OPTIONS = [
  { value: 'all', label: 'All Domains' },
  { value: 'security', label: 'Security' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'performance', label: 'Performance' },
  { value: 'seo_crawlability', label: 'SEO & Crawlability' },
  { value: 'markup_structure', label: 'Markup & Structure' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'seo', label: 'SEO' },
  { value: 'securityHeaders', label: 'Security Headers' },
  { value: 'crawlability', label: 'Crawlability' },
  { value: 'technical', label: 'Technical' },
  { value: 'performance', label: 'Performance' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'mobile', label: 'Mobile Readiness' },
  { value: 'content', label: 'Content Quality' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];

export const FindingSearchBar = ({
  searchTerm,
  onSearchChange,
  domainFilter,
  onDomainChange,
  categoryFilter,
  onCategoryChange,
  severityFilter,
  onSeverityChange,
  onResetFilters,
  totalCount,
  filteredCount,
}) => {
  const isFiltered = Boolean(
    searchTerm.trim() ||
    domainFilter !== 'all' ||
    categoryFilter !== 'all' ||
    severityFilter !== 'all'
  );

  return (
    <div className="bg-surface-elevated border border-primary/20 rounded-xl p-4 mb-6 shadow-sm no-print">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            type="text"
            placeholder="Search findings by ID, title, description, or recommendation..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters: Domain, Category, Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
          <Select
            value={domainFilter}
            onChange={(e) => onDomainChange(e.target.value)}
            options={DOMAIN_OPTIONS}
            aria-label="Filter findings by technical domain"
          />
          <Select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={CATEGORY_OPTIONS}
            aria-label="Filter findings by category"
          />
          <Select
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            options={SEVERITY_OPTIONS}
            aria-label="Filter findings by severity"
          />
        </div>

        {/* Reset & Stats */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0">
          <Badge variant={isFiltered ? 'primary' : 'secondary'} className="text-xs py-1.5 px-3">
            <Filter className="w-3 h-3 mr-1 inline" />
            Showing {filteredCount} of {totalCount}
          </Badge>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-muted hover:text-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

FindingSearchBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  domainFilter: PropTypes.string.isRequired,
  onDomainChange: PropTypes.func.isRequired,
  categoryFilter: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  severityFilter: PropTypes.string.isRequired,
  onSeverityChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  filteredCount: PropTypes.number.isRequired,
};
