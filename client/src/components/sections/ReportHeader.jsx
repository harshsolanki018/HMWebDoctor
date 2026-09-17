import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Share2, Download, FileText, Printer, RotateCcw, Check, Globe, Clock, ShieldCheck } from 'lucide-react';
import { exportReportToJson, exportReportToCsv } from '../../utils/exportUtils';

export const ReportHeader = ({ report }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/reports/${report.scanId}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = report.createdAt || report.timing?.fetchedAt
    ? new Date(report.createdAt || report.timing?.fetchedAt).toLocaleString()
    : 'Recently scanned';

  return (
    <Card className="border-primary/20 bg-surface shadow-md no-print mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" className="font-mono text-xs">
                {report.scanId}
              </Badge>
              <Badge variant={report.statusCode === 200 ? 'success' : 'warn'} className="text-xs">
                HTTP {report.statusCode}
              </Badge>
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>

            <div className="flex items-center gap-2 text-foreground font-semibold text-xl break-all">
              <Globe className="w-5 h-5 text-primary shrink-0" />
              <span>{report.finalUrl || report.targetUrl}</span>
            </div>

            {report.targetUrl !== report.finalUrl && (
              <p className="text-xs text-muted">
                Original target: <span className="font-mono">{report.targetUrl}</span>
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted pt-1">
              <span>Duration: <strong className="text-foreground">{report.timing?.durationMs || 0} ms</strong></span>
              <span>Content Length: <strong className="text-foreground">{report.document?.contentLengthBytes || 0} bytes</strong></span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Public Shareable Report
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <Button
              variant={copied ? 'success' : 'primary'}
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Share Link'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportReportToJson(report)}
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportReportToCsv(report)}
              className="flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Export CSV
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/scan')}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              New Scan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

ReportHeader.propTypes = {
  report: PropTypes.shape({
    scanId: PropTypes.string.isRequired,
    targetUrl: PropTypes.string,
    finalUrl: PropTypes.string,
    statusCode: PropTypes.number,
    createdAt: PropTypes.string,
    timing: PropTypes.shape({
      durationMs: PropTypes.number,
      fetchedAt: PropTypes.string,
    }),
    document: PropTypes.shape({
      contentLengthBytes: PropTypes.number,
    }),
  }),
};
