import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { UrlScannerForm } from '../components/sections/UrlScannerForm';
import { ScanResultView } from '../components/sections/ScanResultView';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { executeScan } from '../services/api';
import { Loader2, ShieldCheck, Layers } from 'lucide-react';

export const ScanPage = () => {
  const [searchParams] = useSearchParams();
  const rawUrlParam = searchParams.get('url') || '';

  const [currentUrl, setCurrentUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  const runScanPipeline = async (urlToScan) => {
    if (!urlToScan) return;
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setCurrentUrl(urlToScan);

    const result = await executeScan(urlToScan);
    setIsScanning(false);

    if (result.success && result.data) {
      setScanResult(result.data);
    } else {
      setScanError(
        result.error || {
          code: 'SCAN_FAILED',
          message: 'An error occurred while scanning the target URL.',
        }
      );
    }
  };

  useEffect(() => {
    if (rawUrlParam && !scanResult && !isScanning) {
      setCurrentUrl(rawUrlParam);
      runScanPipeline(rawUrlParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawUrlParam]);

  const handleValidSubmit = (normalized) => {
    runScanPipeline(normalized);
  };

  const handleResetScan = () => {
    setScanResult(null);
    setScanError(null);
    setIsScanning(false);
  };

  return (
    <>
      <SeoHead
        title="Scan Website — HMWebDoctor Infrastructure Diagnosis"
        description="Enter any public website URL to execute SSRF-validated HTTP fetching and inspect baseline HTML document structure with HMWebDoctor."
        canonicalPath="/scan"
      />

      <PageContainer>
        <PageHeader
          title="Scan & Diagnose Website"
          subtitle="Enter a public website URL below to execute secure SSRF-checked retrieval and baseline HTML document analysis."
          badgeText="Infrastructure Scanner"
        />

        <div className="max-w-4xl mx-auto space-y-8 mb-12">
          {/* Main URL Form Container */}
          {!scanResult && (
            <Card>
              <CardHeader
                title="Target Website Input"
                subtitle="Supported protocols: HTTP & HTTPS. Local IPs and private networks blocked."
              />
              <CardContent className="space-y-6">
                <UrlScannerForm
                  initialUrl={currentUrl}
                  buttonText={isScanning ? 'Scanning Target...' : 'Start Scan'}
                  onValidSubmit={handleValidSubmit}
                  disabled={isScanning}
                />
              </CardContent>
            </Card>
          )}

          {/* Indeterminate Honest Loading State */}
          {isScanning && (
            <Card className="border-primary/30">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    Scanning Target Website...
                  </h3>
                  <p className="text-sm text-muted max-w-md">
                    Performing DNS resolution, SSRF security checks, HTTP header inspection, and baseline HTML document parsing.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert Display */}
          {scanError && !isScanning && (
            <Alert
              variant="error"
              title={`Scan Failed — ${scanError.code || 'ERROR'}`}
            >
              <p className="mt-1 leading-relaxed text-sm">
                {scanError.message || 'Unable to complete scan for the requested URL.'}
              </p>
            </Alert>
          )}

          {/* Scan Results View */}
          {scanResult && !isScanning && (
            <ScanResultView scanData={scanResult} onNewScan={handleResetScan} />
          )}

          {/* Scope & Capability Callout */}
          <Card className="bg-surface-muted/50 border-border">
            <CardContent className="p-6">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-primary" />
                Milestone 3 Infrastructure Capabilities
              </h4>
              <p className="text-xs text-muted leading-relaxed mb-3">
                This scan performs secure server-side fetching, DNS rebinding prevention, redirect policy enforcement, stream size limiting, and baseline HTML document parsing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-pass" />
                  SSRF & Private IP Protection
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-pass" />
                  Streaming HTML Content Verification
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-pass" />
                  Redirect Loop Interception
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-pass" />
                  Baseline Metadata Extraction
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
};
