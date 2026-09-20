# Changelog

All notable changes to HMWebDoctor will be documented in this file.

## Milestone 10: Report Sharing & Export Hardening

### Added
- **Report Sharing UX & Clipboard Feedback (`ReportHeader.jsx`)**:
  - Added dedicated "Copy Scan ID" button alongside "Share Link" action button.
  - Implemented stateful success and failure feedback (`copiedLink`, `copiedId`) for both "Share Link" (`/reports/:scanId`) and "Copy Scan ID" (`report.scanId`).
  - Added explicit, accessible `aria-label` attributes across all action buttons (`Copy public report link`, `Copy scan ID`, `Export report as JSON`, `Export report findings as CSV`, `Print scan report`, `Start new website scan`).
- **CSV Export Hardening (`exportUtils.js`)**:
  - Enforced exact 8-column header and row layout starting with `Finding ID` (`Finding ID`, `Category`, `Status`, `Severity`, `Title`, `Message`, `Value`, `Recommendation`).
  - Formula injection mitigation (`sanitizeCsvCell`): Prefixes cell strings starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with `'` (single quote) and escapes double quotes.
- **Structured Report Error States (`ReportPage.jsx`)**:
  - Distinct alert views and messages for HTTP 400 (`INVALID_SCAN_ID`), HTTP 404 (`NOT_FOUND`), HTTP 429 (`REPORT_RATE_LIMITED`), and HTTP 503 (`DATABASE_UNAVAILABLE`).
  - Safe error rendering without leaking internal MongoDB stack traces or connection strings; HTTP 503 renders "Service Temporarily Unavailable" and is strictly prevented from collapsing into 404.
- **Native Print & Focus Management Enhancements**:
  - Scoped `@media print` rules: Preserves main report header card, title, sanitized target URL, scan date, status, categories, findings, and Action Center items while hiding action buttons, search controls, navigation header, footer, and slide-over drawers via `.no-print`.
  - Added `.no-print` class to `RemediationDrawer.jsx`.
- **Automated Verification Test Suites**:
  - Updated `exportUtils.test.js` asserting exact M10 8-column order starting with `Finding ID` and formula injection neutralization.
  - Updated `ReportPage.test.jsx` verifying Copy Link and Copy ID clipboard feedback, aria-label attributes, and distinct 400, 404, 429, and 503 error state renderings.

## Milestone 9: Shareable Scan Reports, Persistence & Data Export

### Added
- **MongoDB Report Schema & Model (`Scan.js`)**:
  - Strict Mongoose schema (`strict: true`, `bufferCommands: false`) with sub-schemas for baseline metadata, categories, findings, and Action Center items.
  - Standardized unique `scanId` field matching `/^scan_[a-f0-9]{16}$/` with unique database index.
  - 30-day retention TTL index (`expireAfterSeconds: 2592000`) on `createdAt` field for automatic database cleanup.
- **Public Report DTO Security Boundary (`buildPublicReportDto`)**:
  - Single canonical DTO conversion pipeline in `scanService.js` enforcing strict field allowlist.
  - Strips MongoDB internal fields (`_id`, `__v`), raw HTML content, raw HTTP headers, cookies/tokens, and M3 internal destination IP metadata (`destinationIp`, `resolvedIps`).
  - Strict URL Sanitization (`sanitizePublicUrl`): Strips user credentials (`user:pass@`), ENTIRE query string (`?token=...`), and ENTIRE fragment/hash (`#section`) 100%.
- **Bounded Write Timeout & Degraded Persistence Mode**:
  - 2000ms request-side write timeout enforced via `Promise.race` on `Scan.create`.
  - Direct `.catch()` rejection handler attached to `Scan.create()` promise to swallow late DB rejections and prevent unhandled promise rejections.
  - 5MB application payload boundary check (`Buffer.byteLength(JSON.stringify(publicDto), 'utf8') <= 5MB`).
  - Degraded mode fallback (`isPersisted: false`): If DB is offline, write times out (>2000ms), or payload > 5MB, scan execution completes with HTTP 200 and frontend displays an honest degraded persistence warning without failing the user scan request.
- **Public Report Retrieval API (`GET /api/scans/:scanId`)**:
  - Secure report lookup route with Zod regex validation (`/^scan_[a-f0-9]{16}$/`).
  - Rate limited via `reportRateLimiter` middleware (60 req/15m per IP).
  - Returns HTTP 200 with sanitized public report DTO, HTTP 400 for malformed IDs (consuming quota), HTTP 404 for missing/expired reports or offline DB, and HTTP 429 for rate limit.
- **Client-Side Export Utilities (`exportUtils.js`)**:
  - `exportReportToJson(report)`: Downloads `<scanId>.json` containing formatted public report DTO.
  - `exportReportToCsv(report)`: Downloads `<scanId>-findings.csv` containing flat finding rows across all 8 categories.
  - CSV Injection Protection (`sanitizeCsvCell`): Mitigates formula injection in Excel/Google Sheets by prefixing cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` with `'` (single quote) and escaping double quotes.
- **Shareable Public Report Page & Search Component**:
  - `ReportPage.jsx`: Shareable report route at `/reports/:scanId` configured with `<meta name="robots" content="noindex, nofollow" />` via `SeoHead` to prevent search engine indexing.
  - `ReportHeader.jsx`: Sanitized URL display, status badge, metadata, share link copy button with feedback state, JSON/CSV export triggers, and native print trigger.
  - `FindingSearchBar.jsx`: Real-time text search (OR across finding ID, title, description, recommendation, value) and multi-group filters (AND across groups: category, severity, status).
  - Native `@media print` stylesheet rules in `index.css` hiding headers, footers, and action controls during printing.
- **Automated Verification Test Suites**:
  - `Scan.model.test.js`: Schema validation, strict mode, bufferCommands setting, regex pattern match, and TTL index configuration.
  - `publicDto.test.js`: URL sanitization (credentials/query/fragment stripping) and DTO allowlist non-leakage verification.
  - `persistenceTimeout.test.js`: Bounded 2000ms timeout, attached catch rejection handler, 5MB boundary check, and offline degraded mode fallback.
  - `scansApiM9.test.js`: `GET /api/scans/:scanId` HTTP 200, 400 (malformed ID), 404 (not found/offline DB), and DTO security boundary verification.
  - `exportUtils.test.js`: CSV injection protection, double quote escaping, JSON/CSV file generation, and download trigger safety.
  - `ReportPage.test.jsx`: React component tests for `noindex, nofollow` meta tag, header metadata, action buttons, real-time search filtering, and 404 empty states.

## Milestone 8: Action Center, Cross-Category Finding Prioritization & Deterministic Remediation Engine

### Added
- **Static Code Remediation Registry (`remediationRegistry.js`)**:
  - 100% static, deterministic code fix registry mapping all **55 exact source-derived finding IDs** across M4–M7 scanners (`seo`: 8, `securityHeaders`: 8, `crawlability`: 3, `technical`: 5, `performance`: 6, `accessibility`: 10, `mobile`: 5, `content`: 10).
  - Validated via Zod `remediationSchema` (`summary`, `impact`, `codeFix`, `steps`, `verification`).
  - ZERO parameter interpolation, ZERO network requests, ZERO external dependencies, and ZERO fake metric scores or grades.
- **Remediation Engine (`remediationEngine.js`)**:
  - `getRemediationForFinding(finding)` static lookup module attaching structured remediation guides to actionable findings.
- **Action Center Service (`actionCenterService.js`)**:
  - Aggregates actionable findings (`status === 'fail'` or `status === 'warn'`) across all 8 scanner categories while excluding `info`, `pass`, and `category-error`.
  - Implements 5-tier deterministic sorting algorithm: Severity Rank (`high` > `medium` > `low`) $\rightarrow$ Technical Domain (`security` > `accessibility` > `performance` > `seo_crawlability` > `markup_structure`) $\rightarrow$ Category Rank $\rightarrow$ Finding ID Alphabetical $\rightarrow$ Discovery Index.
  - Safe error boundary returning graceful empty fallback `{ status: "error", summary: { actionable: 0, high: 0, medium: 0, low: 0 }, domainCounts: {...}, items: [] }` on exception without disrupting scan API HTTP 200 response or category findings.
  - Non-leakage data filtering exposing safe UI fields only (`findingId`, `category`, `status`, `severity`, `domain`, `title`, `remediation`, `recommendation`).
- **Frontend Action Center Components (`ActionCenterCard.jsx` & `RemediationDrawer.jsx`)**:
  - `ActionCenterCard.jsx`: Summary overview card displaying actionable counts by severity badge, technical domain filter tabs (*All*, *Security*, *Accessibility*, *Performance*, *SEO & Crawlability*, *Markup & Quality*), severity filter tabs, action item cards, and drawer triggers.
  - `RemediationDrawer.jsx`: Accessible slide-over drawer with focus trap & restoration, backdrop dismiss, Escape key dismiss, plain-text `<pre><code>` code snippet rendering, and copy-to-clipboard button with toast feedback.
  - Integrated `ActionCenterCard` into `ScanResultView.jsx` above category cards.
- **Automated Test Suites**:
  - `remediationRegistry.test.js`: 7 unit tests enforcing 55 exact finding ID coverage, 0 stale entries, static content, non-leakage, and Zod schema validation.
  - `actionCenterService.test.js`: 6 unit tests enforcing actionability inclusion rules, 55 ID domain mappings, 5-tier sorting, non-mutation of category findings, unknown ID handling, and error isolation.
  - `scansApiM8.test.js`: 3 API integration tests verifying `data.actionCenter` payload structure, 8 categories preserved, dynamic scan IDs, error boundary isolation keeping HTTP 200, zero network calls, sensitive token non-leakage, and no score/grade fields.
  - `ActionCenterCard.test.jsx` & `RemediationDrawer.test.jsx`: 15 React Testing Library tests covering Action Center card rendering, domain filtering, severity filtering, drawer open/close, focus management, code snippet rendering, and copy interactions.

## Milestone 7: Content & Technical HTML Quality Analysis

### Added
- **Passive Content & Technical HTML Quality Analyzer (`contentAnalyzer.js`)**:
  - Single-pass `htmlparser2` document inspection operating strictly on already-fetched, already-bounded HTML document.
  - Visible body text volume: body-only text extraction (ignoring `<head>`, `<script>`, `<style>`, `<noscript>`, `<template>`, `<svg>`), Unicode code-point character counting (`Array.from().length`), and whitespace-normalized word counting.
  - Empty page & low volume findings: flags 0 visible words (`content-empty-page`, `warn`), 1–49 words (`content-low-volume`, `warn`), and 50+ words (`content-word-count`, `pass`).
  - Duplicate block-text detection: identifies qualifying block candidate elements (`p`, `div`, `li`, `article`, `section`) $\ge 8$ words repeated $\ge 3$ times (`content-duplicate-paragraphs`, `warn`). Implements nested container false-positive prevention (parent elements without direct text are ignored as wrapper candidates).
  - Document structure 3-state evaluation: checks presence of `<html>`, `<head>`, and `<body>`. Passes if all 3 present (`content-document-structure`), warns and explicitly identifies missing tags if any are absent.
  - Duplicate element IDs: tracks `id` attribute values across document. Passes if 0 duplicates (`content-duplicate-ids`), warns if duplicates found with bounded array (max 10 ID values), aggregate total count, and `hasMoreDuplicates` boolean.
  - Link classification & href markup: classifies links into internal, external, anchor, mailto, tel, javascript, and empty/placeholder categories (`content-link-classification`). Evaluates empty/placeholder link thresholds: 0 (pass), 1–2 (info), 3+ (warn) (`content-href-markup`). Prevents raw href string dumps and handles malformed URL strings safely without crashing.
  - Resource `src` markup validity: inspects `img`, `iframe`, `script`, `audio`, `video` elements for missing/empty/placeholder `src` attributes (`content-src-markup`, `warn`).
  - Image width/height dimensional hints: checks `<img>` tags for valid positive integer `width` and `height` attributes (`/^\d+$/` > 0). Passes if all images specify valid dimensions (`content-image-dimensions`), warns if any are missing or invalid, returns `info` if 0 images present.
- **Category Error Isolation & Service Orchestration**:
  - Integrated `contentAnalyzer` into `scanService.js` under `categories.content` as the 8th category.
  - Category error boundary isolates analyzer exceptions via `createCategoryErrorResult('content')` without failing the HTTP 200 scan response or disrupting the other 7 categories.
  - Summary aggregation updated to sum all 8 category summaries (`seo`, `securityHeaders`, `crawlability`, `technical`, `performance`, `accessibility`, `mobile`, `content`).
- **Frontend Card Component & Integration**:
  - Created `ContentQualityCard.jsx` with 5 explicit filter tabs (`All`, `Pass`, `Warn`, `Fail`, `Info`), formatted aggregate scalar/object values, actionable recommendations, and theme design token compliance.
  - Updated `ScanResultView.jsx` to render `ContentQualityCard`.
- **Automated Verification Test Suites**:
  - `contentAnalyzer.test.js`: 21 unit tests covering body-only text, ignored tags, Unicode counting, 0/1/49/50 word boundaries, duplicate paragraph detection & nested false-positive prevention, document structure 3-state check, duplicate ID bounding, link classification, malformed href safety, link thresholds, resource `src` validity, and image width/height dimensional checks.
  - `scansApiM7.test.js`: 2 integration tests verifying 8-category payload structure, category error isolation, summary consistency, and zero outbound network calls.
  - `ContentQualityCard.test.jsx`: 3 React component tests verifying rendering, summary badges, 5-tab filtering, values, and empty states.

## Milestone 6: Accessibility & Mobile Responsiveness Markup Analysis

### Added
- **Branding Asset Update**:
  - Replaced SVG logo implementations in `Logo.jsx` and `BrandMark.jsx` with the primary `HMLogo.png` asset ([`client/src/assets/logo/HMLogo.png`](file:///d:/testProjects/HmWebDoctor/client/src/assets/logo/HMLogo.png)) via Vite's ES module import pipeline.
  - Preserved responsive scaling, flex alignment, and light/dark theme compatibility across Header, Footer, Mobile Navigation, and Design Showcase.
- **Passive Accessibility Markup Analyzer (`accessibilityAnalyzer.js`)**:
  - Single-pass `htmlparser2` document inspection over already-fetched HTML.
  - Image `alt` attribute analysis: missing `alt` (`warn`), empty `alt=""` (`info` decorative state), and non-empty `alt="text"` (`pass` markup completeness).
  - Iframe `title` attribute inspection: missing/empty `title` (`warn`) vs valid `title` (`pass`).
  - Form control label association inspection: checks `<input>` (excluding `hidden`, `submit`, `button`, `reset`, `image`), `<textarea>`, and `<select>` for `aria-label`, `aria-labelledby`, explicit `<label for="id">` match, or ancestor `<label>` wrappers (`warn` if unlabeled).
  - Button & link accessible name signals: inspects `<button>` and `<a>` for text content, `aria-label`, `aria-labelledby`, or nested image `alt` text. Treats `title` as a fallback informational signal only.
  - Empty ARIA attribute inspection: detects empty `aria-label=""`, `aria-labelledby=""`, or `aria-describedby=""` (`warn`).
  - Document landmark inspection: checks presence of primary `<main>` content landmark (`pass`/`info`).
  - Data table header inspection: checks `<table>` tags for `<th>` header elements (`pass`/`info`).
  - Keyboard focus order inspection: detects positive `tabindex` values (`tabindex > 0`) (`warn`).
  - Document language attribute inspection: checks `baseline.lang` for language code presence (`pass`/`warn`).
- **Passive Mobile Responsiveness Markup Analyzer (`mobileAnalyzer.js`)**:
  - Viewport pinch-to-zoom restriction inspection: flags `user-scalable=no` or `maximum-scale=1.0` parameters (`warn`).
  - Mobile touch keyboard input type evaluation: counts specialized mobile input types (`tel`, `email`, `number`, `url`, `search`, `date`) without classifying generic `type="text"` as an error (`pass`/`info`).
  - Virtual keyboard `inputmode` hints (`info`/`pass`).
  - Form `autocomplete` tokens for mobile autofill (`info`).
  - Mobile browser presentation metadata (`theme-color`, `apple-mobile-web-app-capable`) (`info`).
- **Category Error Isolation & Service Orchestration**:
  - Updated `scanService.js` to execute `accessibilityAnalyzer` and `mobileAnalyzer` with isolated `try/catch` error boundaries per category.
  - Standardized overall summary aggregation matching sum of category summaries across all 7 active category analyzers (`seo`, `securityHeaders`, `crawlability`, `technical`, `performance`, `accessibility`, `mobile`).
- **Frontend Category Cards & Scan Results Integration**:
  - Created `AccessibilityCard.jsx` and `MobileReadinessCard.jsx` displaying findings with 5 explicit filter tabs (`All`, `Pass`, `Warn`, `Fail`, `Info`), formatted scalar/object values, actionable recommendations, and theme-compliant design tokens.
  - Updated `ScanResultView.jsx` to render `AccessibilityCard` and `MobileReadinessCard`.
- **Automated Verification Test Suites**:
  - `accessibilityAnalyzer.test.js`: 10 unit tests covering image alt states, iframe titles, form labels, button/link accessible names, empty ARIA, landmarks, tables, positive tabindex, and document language.
  - `mobileAnalyzer.test.js`: 5 unit tests covering viewport zoom restrictions, mobile input types, inputmode hints, autocomplete tokens, and mobile presentation metadata.
  - `scansApiM6.test.js`: 4 API integration tests verifying 7-category payload structure, category error boundaries, summary consistency, and zero outbound network calls.
  - `AccessibilityCard.test.jsx` & `MobileReadinessCard.test.jsx`: Component tests verifying rendering, summary badges, 5-tab filtering, values, and empty states.

## Milestone 5: Passive Resource & Performance Analysis

### Added
- **Passive Performance & Resource Analyzer Engine (`performanceAnalyzer.js`)**:
  - Single-pass `htmlparser2` document inspection over already-fetched HTML.
  - Script loading classification: total script count, synchronous head scripts (`headSynchronousScripts`), `async`, `defer`, `type="module"`, and inline script counts.
  - Stylesheet & CSS footprint evaluation: external `<link rel="stylesheet">` count, inline `<style>` count, aggregate inline CSS byte size, and $> 20\text{KB}$ aggregate inline CSS finding (`perf-inline-css`).
  - Browser resource hint declaration inspection: `<link rel="preconnect">`, `<link rel="dns-prefetch">`, `<link rel="preload">`, `<link rel="modulepreload">` (`perf-resource-hints`). Performs **zero secondary network requests**.
  - DOM element footprint & resource counts: total DOM elements, `img`, `video`, `audio`, `iframe` counts, and $> 1,500$ DOM element complexity threshold (`perf-dom-footprint`).
  - Image lazy-loading attribute markup observation: explicit `loading="lazy"` attribute declaration counts vs eager/unspecified images (`perf-image-lazyloading`).
- **Category Error Isolation & Service Orchestration**:
  - Updated `scanService.js` to execute `performanceAnalyzer` via module reference with isolated `try/catch` error boundary (`status: "error"`, generic `category-error` finding, zeroed category summary `{ pass: 0, warn: 0, fail: 1, info: 0 }`).
- **Frontend Card & Filtering Component**:
  - Created `PerformanceCard.jsx` displaying findings, severity badges, formatted scalar/object values, actionable recommendations, and explicit 5-button filter tabs (`All`, `Pass`, `Warn`, `Fail`, `Info`). Reuses M1/M4 semantic tokens and ThemeContext without hardcoded color classes.
  - Updated `ScanResultView.jsx` to render `PerformanceCard`.
- **Automated Test Suites**:
  - `performanceAnalyzer.test.js`: 11 unit tests covering all script classifications, stylesheet/CSS thresholds, resource hints, DOM element footprints, lazy-loading markup, summary consistency, and malformed HTML handling.
  - `scansApiM5.test.js`: API pipeline integration tests verifying `categories.performance` payload structure, error isolation, zero network calls, and non-exposure of stack traces.
  - `PerformanceCard.test.jsx`: React testing library component tests covering findings, 5-tab filtering, values, and empty states.

## Milestone 4: SEO + Passive Security Analysis

### Added
- **4 Modular Passive Scanner Engines**:
  - `seoAnalyzer.js`: Evaluates `<title>` length (30-60 chars), `<meta name="description">` length (50-160 chars), canonical URL normalization & match against final target URL, `<meta name="robots">` directives, `<meta name="viewport">` mobile optimization, heading hierarchy sequence (`<h1>`-`<h6>`), and Open Graph social preview completeness.
  - `securityHeadersAnalyzer.js`: Inspects HTTPS encryption protocol enforcement, Strict-Transport-Security (HSTS max-age >= 180 days), Content-Security-Policy (CSP default-src / script-src directives), X-Frame-Options (DENY / SAMEORIGIN), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, and Set-Cookie security flags (`Secure`, `HttpOnly`, `SameSite`) without exposing raw cookie names, values, or session tokens.
  - `crawlabilityAnalyzer.js`: Evaluates `X-Robots-Tag` headers, HTML sitemap link tag references (`<link rel="sitemap">`), and executes a strictly bounded single fetch to `<origin>/robots.txt` using M3 `fetchSafeUrl` with full SSRF, DNS rebinding, streaming limit, and timeout protections.
  - `technicalAnalyzer.js`: Observes HTTP status code classification (200 OK, redirects, 4xx, 5xx), HTTP payload compression (`Content-Encoding: gzip/br`), cache controls (`Cache-Control`, `ETag`), character set encoding, HTML DOCTYPE declaration, and raw payload sizes.
- **Category Error Isolation & Summary Aggregation**:
  - Updated `scanService.js` to execute all 4 analyzers with isolated try/catch boundaries per category (`status: "error"` on unexpected failure without failing overall scan or outputting fake passes).
  - Derived standardized summary counts (`pass`, `warn`, `fail`, `info`) calculated directly from category finding lists without total health scores, percentages, letter grades (A/B/C), or rating meters.
- **Frontend Category Cards & Scan Results Integration**:
  - `SeoFindingsCard.jsx`: Interactive card presenting SEO findings with status badges, severity tags, filter controls (Pass, Warn, Info), raw string/object values, and actionable remediation boxes.
  - `SecurityHeadersCard.jsx`: Card presenting transport and security header checks.
  - `CrawlabilityCard.jsx`: Card presenting crawlability directives and bounded robots.txt status.
  - `TechnicalDetailsCard.jsx`: Card presenting HTTP technical response details.
  - Updated `ScanResultView.jsx` to render overall summary count pills and category cards.
- **Automated Verification Test Suite**:
  - Created backend unit test suites (`seoAnalyzer.test.js`, `securityHeadersAnalyzer.test.js`, `crawlabilityAnalyzer.test.js`, `technicalAnalyzer.test.js`).
  - Created API integration test suite (`scansApiM4.test.js`).
  - Created frontend integration test suite (`ScanIntegrationM4.test.jsx`).

## Milestone 3: Scan Infrastructure

### Added
- **Defense-in-Depth SSRF Protection Architecture**:
  - `ipValidator.js`: Centralized IP validator evaluating IPv4 and IPv6 addresses against loopback (`127.0.0.0/8`, `::1`), private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`, `fe80::/10`), carrier-grade NAT, unique local IPv6 (`fc00::/7`), cloud metadata (`169.254.169.254`), multicast, and unwrapping IPv4-mapped IPv6 addresses.
  - `safeDnsLookup.js`: Custom DNS lookup agent hooking Node's socket creation (`lookup` option) to resolve hostnames and validate resolved IP addresses against `ipValidator` prior to socket connection, preventing DNS rebinding (TOCTOU) while preserving TLS SNI and HTTP `Host` headers.
- **Secure Server-Side Website Fetcher (`safeFetcher.js`)**:
  - Protocol whitelist (`http:`, `https:`), port whitelist (`80`, `443`, `8080`, `8443`), and credentials check.
  - Manual redirect loop interception (`MAX_REDIRECTS = 5`), resolving relative redirect paths and re-evaluating IP safety before each hop.
  - Streaming response size limiting (`MAX_SCAN_RESPONSE_BYTES = 5MB`), cutting off stream connections immediately if limit is exceeded.
  - `Content-Type` whitelist enforcement (`text/html`, `application/xhtml+xml`, `text/xml`).
  - Request and connection timeouts (`SCAN_TIMEOUT_MS = 30s`, `SCAN_CONNECT_TIMEOUT_MS = 5s`).
  - Machine-readable error taxonomy (`ScannerFetchError`) producing safe, structured error responses with zero internal detail leakage.
- **Baseline HTML Document Analyzer (`baselineAnalyzer.js`)**:
  - Streaming HTML parsing via `htmlparser2`.
  - Passive metadata extraction: `<title>`, `<html lang>`, charset (`<meta charset>` / `Content-Type`), `<meta name="description">`, `og:description`, raw document byte size, and `<!DOCTYPE>` declaration.
- **Scan API Route (`POST /api/scans`)**:
  - `scanValidator.js`: Zod schema validation for incoming target URL.
  - `scanRateLimiter.js`: IP rate limiting middleware enforcing 10 requests per 15-minute window (`SCAN_RATE_LIMIT_WINDOW_MS = 900000`, `SCAN_RATE_LIMIT_MAX = 10`).
  - `scanService.js`: Scan orchestration building ephemeral scan results with unique IDs (`scan_${randomHex}`) without MongoDB persistence.
- **Frontend Integration (`/scan`)**:
  - `ScanPage.jsx`: Connected real `POST /api/scans` backend API with honest indeterminate loading state and structured error handling.
  - `ScanResultView.jsx`: Rich baseline scan report presenting status code, response time, document size, resolved IP, redirect chain, and extracted HTML metadata.
- **Automated Verification Test Suite**:
  - `ssrf.test.js`: SSRF and safe fetcher unit test suite covering private IPs, loopback, AWS metadata, non-HTTP protocols, and restricted ports.
  - `baselineAnalyzer.test.js`: HTML parser unit test suite verifying title, lang, charset, description, and doctype extraction.
  - `scansApi.test.js`: Integration test suite for `POST /api/scans` validating error codes, rate limiting, and successful scan payloads.
  - `ScanIntegration.test.jsx`: React testing library suite verifying `/scan` page scan execution, baseline report rendering, and error alerts.

## Milestone 2: Public Product Pages

### Added
- **React Router Integration**:
  - Configured `react-router-dom@^6.28.0` in `client/` with `BrowserRouter`, `Routes`, `Route`, and `ScrollToTop` restoration component.
- **8 Public Product Pages**:
  - `HomePage.jsx` (`/`): Hero headline, primary URL input form, feature highlights, diagnostic workflow steps, product principles, and CTA.
  - `HowItWorksPage.jsx` (`/how-it-works`): 3-step diagnostic walkthrough, passive analysis guarantee, and category breakdown.
  - `AboutPage.jsx` (`/about`): HMWebDoctor mission, engineering philosophy, and scope boundaries.
  - `ContactPage.jsx` (`/contact`): Inquiry contact form with preview feedback state ("Contact submission is currently in preview mode.") without claiming fake email delivery.
  - `PrivacyPage.jsx` (`/privacy`): Passive scan privacy policy and data collection transparency.
  - `TermsPage.jsx` (`/terms`): Non-destructive diagnostic analysis terms of service.
  - `ScanPage.jsx` (`/scan`): Syntax validation entry shell with client-side normalizer and explicit Milestone 3 boundary notice.
  - `NotFoundPage.jsx` (`*`): Accessible 404 page with return home and scan website actions.
- **Client-Side URL Validation & Normalization UX**:
  - Created `urlValidator.js` to auto-prefix `https://`, validate domain format, reject spaces/credentials/unsupported protocols, and offer instant feedback.
- **SEO Canonical Metadata Component**:
  - Created `SeoHead.jsx` managing per-route titles, meta descriptions, canonical URLs, and OpenGraph tags.
- **Header & Footer Route Navigation**:
  - Updated `Header.jsx`, `Footer.jsx`, `MobileNavigation.jsx`, and `NavLink.jsx` to use React Router `Link` components with active route highlighting.
  - Strictly isolated `/design-system` as an unlinked internal development showcase.
- **Automated Verification Test Suite**:
  - `PublicPages.test.jsx` test suite covering all 8 public routes, URL validation UX, contact form state, active navigation, and scope boundary guards.

## Milestone 1: Brand + Design System

### Added
- **HMWebDoctor Brand Identity & Vector Logos**:
  - `Logo.jsx` (theme-aware wordmark logo with medical cross accent).
  - `BrandMark.jsx` (standalone monogram mark).
  - SVG vector logo assets (`favicon.svg`, `hmwebdoctor-logo.svg`, `hmwebdoctor-mark.svg`).
- **Centralized Design System Tokens**:
  - Configured semantic color tokens (`background`, `foreground`, `surface`, `surface-muted`, `border`, `primary`, `secondary`, `muted`, `success`, `warning`, `danger`, `info`) in `tailwind.config.js` and `index.css`.
  - Defined font scales, border radius scales (`sm`, `md`, `lg`, `xl`), and focus ring utilities.
  - Added accessibility rules for `prefers-reduced-motion`.
- **Global Theme System**:
  - `ThemeContext.jsx` supporting `system`, `light`, and `dark` modes with `localStorage` persistence and system media query listener.
  - `ThemeToggle.jsx` dropdown component.
- **Core Component Library**:
  - **Layout**: `AppShell`, `Header`, `Footer`, `PageContainer`, `PageHeader`.
  - **Navigation**: `NavLink`, `MobileNavigation` drawer.
  - **Controls**: `Button` (primary, secondary, outline, ghost, destructive, link variants with loading/disabled states), `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`.
  - **Feedback**: `Badge`, `Alert`, `ToastProvider` / `useToast`, `Tooltip`, `Skeleton`, `EmptyState`, `ErrorState`.
  - **Content**: `Card` (`CardHeader`, `CardContent`, `CardFooter`), `Divider`.
- **Development Showcase Page**:
  - `DesignShowcase.jsx` previewing brand assets, color swatches, typography scale, control hierarchy, badges, alerts, theme switching, and live Milestone 0 health connectivity.
- **Automated Tests**:
  - `DesignSystem.test.jsx` unit/integration test suite verifying component rendering, theme switching, and accessible labels.

## Milestone 0: Repository Contract

### Added
- Monorepo layout (`client/`, `server/`) with root scripts (`dev`, `build`, `lint`, `test`).
- Express server foundation with Helmet, CORS, 404, global error middleware, and Zod environment validation.
- `GET /api/health` endpoint returning `healthy` or `degraded` status without leaking credentials.
- Graceful shutdown handling for `SIGINT` and `SIGTERM`.
