import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Search,
  Send,
  Server,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { BrandMark } from '../components/brand/BrandMark';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Divider } from '../components/ui/Divider';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../components/ui/Toast';
import { fetchHealth } from '../services/api';

export const DesignShowcase = () => {
  const { addToast } = useToast();

  // Form states
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [textareaVal, setTextareaVal] = useState('');
  const [selectVal, setSelectVal] = useState('option1');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [switchVal, setSwitchVal] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Milestone 0 Health State
  const [healthState, setHealthState] = useState({ loading: true, data: null, error: null });

  const loadHealth = async () => {
    setHealthState((prev) => ({ ...prev, loading: true }));
    const res = await fetchHealth();
    if (res && res.success) {
      setHealthState({ loading: false, data: res.data, error: null });
    } else {
      setHealthState({
        loading: false,
        data: null,
        error: res?.error?.message || 'Connection failed',
      });
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const triggerToast = (type) => {
    addToast({
      title: `${type.toUpperCase()} Notification`,
      message: `This is a sample ${type} toast notification from HMWebDoctor Design System.`,
      type,
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="HMWebDoctor Design System & Component Showcase"
        subtitle="Internal development preview establishing brand assets, design tokens, color palette, responsive controls, accessibility, and backend health status."
        badgeText="Milestone 1 Preview"
        actions={
          <Button
            size="sm"
            icon={Activity}
            onClick={() => {
              loadHealth();
              triggerToast('info');
            }}
          >
            Re-check Health Status
          </Button>
        }
      />

      <div className="space-y-12 pb-16">
        {/* SECTION 0: Milestone 0 Backend Health Verification Card */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Backend Connectivity Baseline (Milestone 0 Check)
          </h2>
          <Card>
            <CardHeader
              title="API & Database Readiness"
              subtitle="Verifies frontend connectivity to GET /api/health endpoint"
            />
            <CardContent>
              {healthState.loading ? (
                <div className="space-y-2">
                  <Skeleton height="20px" width="100%" />
                  <Skeleton height="20px" width="60%" />
                </div>
              ) : healthState.error ? (
                <Alert variant="danger" title="Backend Unreachable">
                  {healthState.error}
                </Alert>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-surface-muted border border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-muted">Overall Health:</span>
                    <Badge variant={healthState.data?.status === 'healthy' ? 'pass' : 'warning'}>
                      {healthState.data?.status}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-muted border border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-muted">API Service:</span>
                    <Badge variant="pass">{healthState.data?.services?.api}</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-muted border border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-muted">Database Service:</span>
                    <Badge
                      variant={
                        healthState.data?.services?.database === 'healthy' ? 'pass' : 'warning'
                      }
                    >
                      {healthState.data?.services?.database}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Divider />

        {/* SECTION 1: Brand & Logo Assets */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Brand Assets & Monogram
          </h2>
          <Card>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border flex flex-col items-center justify-center space-y-3">
                  <span className="text-xs uppercase tracking-wider text-muted font-semibold">
                    Wordmark Logo
                  </span>
                  <Logo className="h-10" />
                </div>
                <div className="p-6 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border flex flex-col items-center justify-center space-y-3">
                  <span className="text-xs uppercase tracking-wider text-muted font-semibold">
                    Standalone Brand Mark
                  </span>
                  <BrandMark className="w-12 h-12 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Divider label="Color Tokens" />

        {/* SECTION 2: Palette Swatches */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Semantic Color Palette Tokens</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Primary', bg: 'bg-primary', text: 'text-primary-foreground' },
              { label: 'Secondary', bg: 'bg-secondary', text: 'text-secondary-foreground' },
              { label: 'Background', bg: 'bg-background border border-border', text: 'text-foreground' },
              { label: 'Surface', bg: 'bg-surface border border-border', text: 'text-foreground' },
              { label: 'Success', bg: 'bg-success', text: 'text-white' },
              { label: 'Warning', bg: 'bg-warning', text: 'text-white' },
              { label: 'Danger', bg: 'bg-danger', text: 'text-white' },
              { label: 'Info', bg: 'bg-info', text: 'text-white' },
              { label: 'Muted', bg: 'bg-muted', text: 'text-white' },
            ].map((token) => (
              <div
                key={token.label}
                className={`p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 ${token.bg}`}
              >
                <span className={`text-xs font-semibold ${token.text}`}>{token.label}</span>
              </div>
            ))}
          </div>
        </section>

        <Divider label="Typography Scale" />

        {/* SECTION 3: Typography */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Typography Scale</h2>
          <Card>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-muted font-mono block">Display</span>
                <p className="text-4xl font-extrabold tracking-tight text-foreground">
                  Diagnose your website.
                </p>
              </div>
              <div>
                <span className="text-xs text-muted font-mono block">Heading 1 (H1)</span>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Website Health Diagnosis Report
                </h1>
              </div>
              <div>
                <span className="text-xs text-muted font-mono block">Heading 2 (H2)</span>
                <h2 className="text-2xl font-semibold text-foreground">
                  Category Examination & Findings
                </h2>
              </div>
              <div>
                <span className="text-xs text-muted font-mono block">Heading 3 (H3)</span>
                <h3 className="text-lg font-semibold text-foreground">
                  Security & Passive Header Audit
                </h3>
              </div>
              <div>
                <span className="text-xs text-muted font-mono block">Body</span>
                <p className="text-sm text-foreground leading-relaxed">
                  HMWebDoctor evaluates performance, SEO, passive security headers, accessibility compliance, and mobile readiness.
                </p>
              </div>
              <div>
                <span className="text-xs text-muted font-mono block">Code / Technical</span>
                <code className="text-xs font-mono bg-surface-muted px-2 py-1 rounded text-primary border border-border">
                  GET /api/health {"->"} 200 OK
                </code>
              </div>
            </CardContent>
          </Card>
        </section>

        <Divider label="Buttons & Controls" />

        {/* SECTION 4: Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Button Hierarchy & States</h2>
          <Card>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link Button</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" icon={Send}>
                  Small with Icon
                </Button>
                <Button size="md" icon={Send}>
                  Medium Button
                </Button>
                <Button size="lg" icon={Send}>
                  Large Button
                </Button>
                <Button
                  loading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 2000);
                  }}
                >
                  {btnLoading ? 'Processing...' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled</Button>
                <IconButton icon={Search} label="Search" variant="outline" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Divider label="Form Controls" />

        {/* SECTION 5: Form Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Form Components</h2>
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Target Website URL"
                placeholder="https://example.com"
                icon={Search}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                description="Enter any public HTTP/HTTPS URL for diagnosis."
                endAction={
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!inputValue.startsWith('http')) {
                        setInputError('Please enter a valid HTTP/HTTPS URL.');
                      } else {
                        setInputError('');
                        triggerToast('success');
                      }
                    }}
                  >
                    Validate
                  </Button>
                }
                error={inputError}
              />

              <Select
                label="Scan Category Scope"
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                options={[
                  { value: 'option1', label: 'All Examinations (SEO, Security, Performance)' },
                  { value: 'option2', label: 'SEO & Content Assessment Only' },
                  { value: 'option3', label: 'Passive Security Audit Only' },
                ]}
              />

              <Textarea
                label="Additional Notes / Scope Restrictions"
                placeholder="Optional notes or scanner hints..."
                value={textareaVal}
                onChange={(e) => setTextareaVal(e.target.value)}
              />

              <div className="space-y-4 pt-2">
                <Checkbox
                  label="Accept Safe Passive Scan Terms"
                  description="HMWebDoctor performs safe HTTP requests only."
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                />

                <Switch
                  label="Enable Detailed Diagnostics"
                  description="Include technical resource breakdowns."
                  checked={switchVal}
                  onChange={setSwitchVal}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <Divider label="Feedback & Alerts" />

        {/* SECTION 6: Badges & Alerts */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Badges, Alerts & Toasts</h2>
          <Card>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="pass" icon={CheckCircle}>
                  PASS: 100
                </Badge>
                <Badge variant="fail" icon={AlertTriangle}>
                  FAIL: Critical
                </Badge>
                <Badge variant="warning">WARNING: High</Badge>
                <Badge variant="info">INFO: SSL Valid</Badge>
                <Badge variant="neutral">NOT_TESTED</Badge>
                <Badge variant="primary">HM MONOGRAM</Badge>
              </div>

              <div className="space-y-3">
                <Alert variant="success" title="Diagnosis Complete">
                  Website health evaluation completed cleanly. 0 critical security issues found.
                </Alert>

                <Alert variant="warning" title="Performance Optimization Needed">
                  Large render-blocking JavaScript bundles detected on homepage.
                </Alert>

                <Alert variant="danger" title="Security Header Missing">
                  Strict-Transport-Security (HSTS) header is missing from HTTPS response.
                </Alert>

                <Alert variant="info" title="Toast Controls">
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => triggerToast('success')}>
                      Success Toast
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => triggerToast('warning')}>
                      Warning Toast
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => triggerToast('danger')}>
                      Danger Toast
                    </Button>
                  </div>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </section>

        <Divider label="Content Cards & States" />

        {/* SECTION 7: States & Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Card Containers, Skeletons & States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hover>
              <CardHeader title="Sample Interactive Card" subtitle="Hover for shadow transition" />
              <CardContent className="space-y-2">
                <p className="text-xs text-muted">
                  Cards wrap content cleanly with consistent radius and subtle borders.
                </p>
                <Skeleton height="16px" width="80%" />
                <Skeleton height="16px" width="60%" />
              </CardContent>
              <CardFooter>
                <span className="text-xs text-muted">Card Footer</span>
                <Button size="sm" variant="ghost">
                  Details
                </Button>
              </CardFooter>
            </Card>

            <EmptyState
              title="No Scan History Found"
              description="Enter a website URL above to generate your first health report."
              actionLabel="Run First Scan"
              onAction={() => triggerToast('info')}
            />
          </div>

          <ErrorState
            title="Unable to Reach Domain"
            message="The requested domain timed out or DNS resolution failed."
            onRetry={loadHealth}
          />
        </section>
      </div>
    </PageContainer>
  );
};
