# Architecture Decisions

## ADR-001: Monorepo Repository Structure
- **Context**: HMWebDoctor requires independent execution, testing, and deployment of client and server modules.
- **Decision**: Adopt a light monorepo layout with separate `client/` and `server/` subdirectories and a root `package.json` utilizing `concurrently` for dev scripts.
- **Impact**: Clean separation of concerns, fast script execution, clear dependency boundaries.

## ADR-002: Centralized Environment Configuration
- **Context**: Reading `process.env` across random files risks missing environment variables and makes validation difficult.
- **Decision**: Create `server/src/config/env.js` using Zod schema validation to parse and export all server variables centrally.
- **Impact**: Guaranteed type-safe configuration, safe defaults for local development, instant validation failures at startup if required variables are missing.

## ADR-003: Graceful Database Failure and Health Status Reporting
- **Context**: MongoDB may be offline or unreachable during early development or network disruptions. The server must not crash or leak credentials/stack traces.
- **Decision**: `GET /api/health` evaluates database readiness (`mongoose.connection.readyState`). If MongoDB is unavailable, the API returns HTTP 200 with status `"degraded"` and services status `"database": "unavailable"`.
- **Impact**: Robust operational visibility without exposing internal database errors or credentials.

## ADR-004: Sanitized Logging Utility
- **Context**: Server logs must capture operational events (server start/stop, DB connection state) without accidentally logging passwords, tokens, or URIs with credentials.
- **Decision**: Implement `server/src/utils/logger.js` with structured output and automatic redaction patterns for URIs, keys, and tokens.
- **Impact**: Audit-safe operational logs ready for future scanner job expansion.

## ADR-005: Testing Baseline with Vitest
- **Context**: Fast, unified unit/integration testing engine needed across Node backend and React frontend.
- **Decision**: Use Vitest + Supertest for server testing and Vitest + React Testing Library for client testing.
- **Impact**: Fast test runner with ESM native support and minimal setup overhead.

## ADR-006: Semantic Design Tokens & Dual-Theme System
- **Context**: HMWebDoctor requires a modern, technical visual identity with first-class System/Light/Dark theme support without hardcoding colors into individual components.
- **Decision**: Define semantic color tokens (`background`, `foreground`, `surface`, `border`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`) as CSS variables in `index.css` mapped to Tailwind CSS config, managed centrally via `ThemeContext.jsx`.
- **Impact**: Instant, global, flash-free theme switching with complete color consistency across all future page builds.

## ADR-008: Client-Side URL Normalization vs SSRF Boundary
- **Context**: Users entering URLs may omit `https://`, include spaces, or type invalid schemes (`ftp://`). Client-side validation must provide instant UX feedback without substituting for server-side security.
- **Decision**: Implement `urlValidator.js` in `client/src/utils/` to auto-prefix `https://` for protocol-less inputs and reject invalid schemes/credentials. Frame client validation explicitly as UX feedback, leaving security checks to Milestone 3's SSRF DNS/IP pre-flight worker engine.
- **Impact**: Smooth input UX with clear architectural separation between client usability and backend security.

## ADR-009: Strict Isolation of Development Tools & Design Showcase
- **Context**: The `DesignShowcase.jsx` component was created in Milestone 1 for component verification, but internal dev showcases must not bleed into public product navigation.
- **Decision**: Keep `DesignShowcase` routed exclusively at `/design-system`, strictly omit it from public Header/Footer navigation, and configure it as an unlinked internal view.
- **Impact**: Clean public website posture without leaking internal dev/design system tools into marketing or SEO flows.

## ADR-010: Zero Fabricated Metrics Guardrail
- **Context**: Milestone 2 builds the public website shell before backend scanner infrastructure (Milestone 3) or scanner modules (Milestones 4-7) exist.
- **Decision**: Enforce a strict prohibition against fake health scores, simulated progress timers, grade letters, or dummy `/api/scan` responses. On `/scan`, validating a URL displays explicit Milestone 3 boundary notices upon user submission.
- **Impact**: Uncompromising diagnostic integrity and honesty, ensuring users and stakeholders see only verified system capabilities.

## ADR-011: Client-Side Routing with Route-Based SEO Metadata
- **Context**: Single-page React applications require client-side navigation without full browser reloads, while maintaining route-specific document titles and OpenGraph meta tags.
- **Decision**: Use `react-router-dom@^6.28.0` with a dedicated `SeoHead.jsx` component wrapping `react-helmet-async` for route-based metadata management and `ScrollToTop` for scroll position restoration.
- **Impact**: High-performance client navigation with accurate search engine indexing and social sharing tags per page.

## ADR-012: Socket-Level DNS Interception for TOCTOU DNS Rebinding Prevention
- **Context**: Performing DNS resolution prior to HTTP connection leaves a Time-Of-Check To Time-Of-Use (TOCTOU) vulnerability where a malicious DNS server returns a public IP during pre-flight validation and an internal private IP (e.g. `127.0.0.1`) during the actual HTTP connection.
- **Decision**: Implement `createSafeDnsLookup` in `server/src/utils/safeDnsLookup.js` hooking Node's native HTTP/HTTPS socket creation (`lookup` option). Intercept DNS resolution at the exact moment of socket creation to validate all resolved IP addresses against `ipValidator` before connecting, while preserving TLS SNI (`servername`) and HTTP `Host` headers.
- **Impact**: Complete elimination of TOCTOU DNS rebinding attacks without breaking HTTPS certificate validation or virtual hosting.

## ADR-013: Manual Redirect Interception Loop & Per-Hop Policy Validation
- **Context**: Automated HTTP redirect tracking (`followRedirects: true`) risks leading the fetcher to internal/private IPs (SSRF via 302 redirect) or getting stuck in infinite redirect loops.
- **Decision**: Set redirect mode to manual (`[301, 302, 303, 307, 308]`), inspect the `Location` header, resolve relative redirect paths against the current target URL, and re-execute full URL syntax, protocol, port, and IP safety checks before taking each hop up to `MAX_REDIRECTS = 5`.
- **Impact**: Defense-in-depth protection against open redirects, SSRF redirect bypasses, and infinite redirect loops.

## ADR-014: Streaming Size Limit & Early Socket Destruction
- **Context**: Large upstream files (e.g. multi-gigabyte ISOs or video files) returned by target servers can exhaust scanner memory or trigger denial of service. Checking `Content-Length` alone is insufficient as servers may omit the header or use chunked transfer encoding.
- **Decision**: Enforce a streaming byte counter in `safeFetcher.js` (`MAX_SCAN_RESPONSE_BYTES = 5MB`). Check `Content-Length` headers up-front if available, and count incoming chunks during stream downloading. Instantly destroy the HTTP request socket (`req.destroy()`) and reject with `RESPONSE_TOO_LARGE` if the limit is exceeded.
- **Impact**: Safe, bounded resource consumption during website fetching regardless of target server behavior.

## ADR-015: Ephemeral Baseline Scan Results & No MongoDB Persistence in M3
- **Context**: Milestone 3 establishes the secure website-fetching infrastructure and baseline HTML parsing before persistent scan models or diagnosis scoring engines are built.
- **Decision**: Generate ephemeral scan IDs (`scan_${randomHex}`) in `scanService.js` and return structured JSON responses directly to the client without creating MongoDB scan records.
- **Impact**: Zero database pollution during scan infrastructure validation, maintaining a clean boundary until persistence and scoring milestones.

## ADR-016: Modular Passive Analyzers, Category Error Isolation, and Strict Summary Aggregation
- **Context**: Milestone 4 introduces four passive diagnostic analyzers (SEO, Security Headers, Crawlability, Technical Details). Each category must execute independently without unexpected exceptions crashing the overall scan, and finding summaries must reflect honest check counts without introducing premature calculated health scores or grades.
- **Decision**: Implement analyzers as decoupled modules (`seoAnalyzer.js`, `securityHeadersAnalyzer.js`, `crawlabilityAnalyzer.js`, `technicalAnalyzer.js`). Wrap each category execution in an isolated error boundary in `scanService.js` returning `status: "error"` with a single generic finding if a category fails. Calculate overall `summary` counts (`pass`, `warn`, `fail`, `info`) strictly by summing category finding lists. Enforce a strict prohibition against health scores, percentages, grade letters (A/B/C), or rating meters in API responses and frontend components.
- **Impact**: Maximum scanner resilience, modular expandability, audit-safe response structures, and uncompromising diagnostic integrity.

## ADR-017: Declaration-Based Passive Resource Analysis & Zero Synthetic Performance Scoring Boundary
- **Context**: Milestone 5 extends the scan pipeline to evaluate document resource optimization, script attributes, stylesheet footprints, resource connection hints, and DOM element complexity. Performance analysis must remain 100% passive on the already-fetched HTML document without initiating secondary network requests, browser automation (Puppeteer/Playwright), or synthetic performance scoring.
- **Decision**: Implement `performanceAnalyzer.js` performing linear, single-pass inspection over the already-bounded HTML payload using `htmlparser2`. Restrict resource hint analysis (`preconnect`, `dns-prefetch`, `preload`, `modulepreload`) strictly to declaration markup in HTML, executing zero secondary origin resolution or asset fetching. Prohibit synthetic performance scores, Core Web Vitals numbers, letter grades, or hardcoded status colors in backend payloads and frontend components (`PerformanceCard.jsx`).
- **Impact**: High-performance, zero-overhead document resource inspection with uncompromising security boundaries and complete design-system compliance.

## ADR-018: Passive HTML Accessibility & Mobile Responsiveness Markup Analysis Architecture
- **Context**: Milestone 6 introduces static markup inspection for accessibility compliance (image alt attributes, iframe titles, form label associations, button/link accessible name signals, empty ARIA attributes, landmarks, tables, tabindex focus order, html language) and mobile device readiness (viewport zoom restrictions, touch keyboard input types, virtual keyboard hints, autofill tokens, mobile presentation metadata). Static HTML markup analysis cannot calculate computed visual contrast, render page layouts, or execute browser JavaScript.
- **Decision**: Implement `accessibilityAnalyzer.js` and `mobileAnalyzer.js` executing single-pass/near-linear `htmlparser2` stream parsing over memory-bounded HTML strings without secondary network requests, browser rendering engines (Puppeteer/Playwright), or color-contrast assertions. Enforce a formal M4/M6 non-duplication rule (language owned by baseline, headings owned by M4, viewport presence owned by M4; M6 mobile analyzes *only* zoomability restrictions). Wrap both analyzers in isolated `try/catch` error boundaries in `scanService.js` and render results using theme-compliant frontend cards (`AccessibilityCard.jsx` and `MobileReadinessCard.jsx`) with 5 explicit filter tabs.
- **Impact**: Bounded, deterministic markup inspection providing actionable accessibility and mobile recommendations while strictly preserving security boundaries, summary count consistency, and design system integrity.

## ADR-019: Passive Content & Technical HTML Quality Analysis Architecture (M7)
- **Context**: Milestone 7 introduces server-side content and technical HTML quality analysis as the 8th scan category (`content`). Content quality analysis requires inspecting visible body text volume, repeated block text patterns, document structural tag completeness, duplicate element IDs, link classification/markup quality, resource `src` attribute validity, and image dimensional hints without performing secondary network requests, browser execution, or AI text analysis.
- **Decision**: Implement `contentAnalyzer.js` operating strictly on already-fetched, already-bounded HTML using `htmlparser2`. Restrict visible text extraction to document `<body>` elements (ignoring `<head>`, `<script>`, `<style>`, `<noscript>`, `<template>`, and `<svg>`), utilizing Unicode code-point character counting (`Array.from().length`) and whitespace-normalized word counting. Evaluate block text elements (`p`, `div`, `li`, `article`, `section`) $\ge 8$ words repeated $\ge 3$ times for duplicate paragraph detection while implementing nested container false-positive prevention (wrapper elements without direct text are ignored). Enforce a 3-state document structure evaluation (`html`, `head`, `body`), bound duplicate ID finding lists to max 10 values with a `hasMoreDuplicates` flag, classify links into 7 categories without exposing raw URL strings or making claims about link viability, validate resource `src` attributes, and check image `width`/`height` positive integer attributes (`/^\d+$/` > 0). Integrate into `scanService.js` with category error boundaries and aggregate summaries across all 8 categories.
- **Impact**: Deterministic, zero-network content quality inspection providing precise technical feedback without privacy leaks, secondary requests, or non-deterministic AI processing.

## ADR-020: Deterministic Action Center & Static Code Remediation Architecture (M8)
- **Context**: Milestone 8 introduces cross-category finding prioritization, actionable finding aggregation, and deterministic code remediation guidance across all 8 scanner categories. Remediation must provide developer-actionable code fixes without dynamic parameter interpolation, AI generation, secondary network requests, or fake metric scoring.
- **Decision**: Implement a 100% static remediation registry (`remediationRegistry.js`) validated via Zod (`remediationSchema`) mapping all 55 exact source-derived finding IDs emitted across M4–M7. Build `actionCenterService.js` to aggregate actionable findings (`status === 'fail'` or `status === 'warn'`) and sort them deterministically using a 5-tier ranking algorithm: Severity Rank (`high` > `medium` > `low`) $\rightarrow$ Technical Domain Rank (`security` > `accessibility` > `performance` > `seo_crawlability` > `markup_structure`) $\rightarrow$ Category Rank $\rightarrow$ Finding ID Alphabetical Order $\rightarrow$ Discovery Index. Wrap Action Center execution in a safe error boundary returning a graceful empty payload on exception without disrupting the overall HTTP 200 scan API response or category findings. Render prioritized action items via `ActionCenterCard.jsx` with domain and severity filter tabs, and provide an accessible slide-over `RemediationDrawer.jsx` with focus management, plain-text code snippet rendering, and copy-to-clipboard functionality.
- **Impact**: Developer-first actionable diagnostic prioritization with zero dynamic hallucination, zero external network overhead, and uncompromising design system compliance.

## ADR-021: Shareable Scan Reports, Persistence & Client Data Export Architecture (M9)
- **Context**: Milestone 9 introduces persistent scan storage, shareable public report URLs, real-time search/filtering across findings, and client-side data export capabilities (JSON & CSV). Persistence must remain robust even if MongoDB is offline or overloaded, public URLs must protect target site privacy by stripping sensitive parameters, and data exports must prevent CSV formula injection attacks.
- **Decision**:
  1. **Canonical Public DTO Security Boundary**: Implement `buildPublicReportDto` in `scanService.js` enforcing a strict field allowlist that strips MongoDB internal fields (`_id`, `__v`), raw HTML content, raw headers, cookies/tokens, and M3 internal destination IP metadata. Enforce `sanitizePublicUrl` which strips credentials (`user:pass@`), the ENTIRE query string (`?token=...`), and the ENTIRE fragment (`#hash`) 100% for persisted public reports while preserving exact user URLs for scanning in M3.
  2. **Bounded Persistence Timeout & Degraded Mode**: Disable Mongoose command buffering (`bufferCommands: false`) and wrap `Scan.create()` in a bounded 2000ms `Promise.race` timeout with a direct `.catch()` rejection handler to swallow late DB errors. Enforce a 5MB payload limit (`Buffer.byteLength(JSON.stringify(publicDto), 'utf8') <= 5MB`). If MongoDB is offline, the write times out, or payload > 5MB, return HTTP 200 with `isPersisted: false`. The frontend displays an honest degraded persistence alert without failing the user scan.
  3. **Public Report Retrieval API & Privacy**: Route `GET /api/scans/:scanId` with Zod regex validation (`/^scan_[a-f0-9]{16}$/`) and `reportRateLimiter` (60 req/15m/IP). Render shareable reports at `/reports/:scanId` with `<meta name="robots" content="noindex, nofollow" />` via `SeoHead` to prevent search engine indexing.
  4. **Client-Side Export Utilities & Formula Injection Mitigation**: Implement `exportUtils.js` for JSON and CSV file generation. Apply CSV formula injection protection (`sanitizeCsvCell`) by prefixing cell strings starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with `'` (single quote) and escaping double quotes. Include `@media print` rules in `index.css` hiding non-report UI elements during printing.
- **Impact**: Secure, privacy-compliant, offline-resilient report persistence and export architecture with zero score/grade hallucinations and complete security boundary protection.

## ADR-022: Report Sharing UX, CSV Column Alignment & Error State Hardening Architecture (M10)
- **Context**: Milestone 10 hardens and polishes the `/reports/:scanId` public report experience. Sharing action buttons required dedicated Scan ID clipboard copy actions and accessible labels; CSV export column ordering needed strict alignment starting with `Finding ID`; error responses from the backend (HTTP 400, 404, 429, 503) required distinct, user-friendly frontend alert views; native printing required preserving core report header metadata while hiding action controls.
- **Decision**:
  1. **Sharing UX & Accessibility**: Add a dedicated "Copy Scan ID" button alongside "Share Link" in `ReportHeader.jsx`. Implement stateful feedback states (`copiedLink`, `copiedId`) and explicit `aria-label` attributes across all interactive action buttons.
  2. **CSV Column Standardization**: Reorder CSV headers in `exportUtils.js` to exact 8 columns starting with `Finding ID` (`Finding ID`, `Category`, `Status`, `Severity`, `Title`, `Message`, `Value`, `Recommendation`). Maintain formula injection mitigation (`sanitizeCsvCell`).
  3. **Structured Error Views**: Map backend error codes in `ReportPage.jsx` to distinct alert views: HTTP 400 (`INVALID_SCAN_ID`), HTTP 404 (`NOT_FOUND`), HTTP 429 (`REPORT_RATE_LIMITED`), and HTTP 503 (`DATABASE_UNAVAILABLE`). Strictly prevent 503 (database unavailable) from collapsing into 404 (not found).
  4. **Native Print Experience**: Keep the main `ReportHeader` card visible during print so scan metadata, target URL, duration, and status are preserved, while attaching `.no-print` to the action button container, search bar (`FindingSearchBar.jsx`), navigation headers, footers, and slide-over drawers (`RemediationDrawer.jsx`).
- **Impact**: Polished, accessible, and robust public report sharing and export experience with strict privacy compliance and zero non-leakage compromises.

## ADR-023: Request Correlation, Readiness Probes & Client Error Boundary Architecture (M11)
- **Context**: Milestone 11 introduces production observability, request correlation, readiness probing, hardened operational logging, process-level failure safety, and client-side error boundary protection. Observability and correlation IDs must operate exclusively as transient operational infrastructure without polluting persistent MongoDB scan models, public report DTOs, or data exports.
- **Decision**:
  1. **Request Correlation ID (`requestId.js`)**: Middleware checks `X-Request-Id` headers, validates format (`/^[a-zA-Z0-9\-_]{8,64}$/`), generates safe fallback IDs (`req_${randomUUID}`), exposes `req.id` during request lifecycle, and sets `X-Request-Id` on all HTTP responses. Correlation IDs are strictly excluded from Mongo schemas, Public DTOs, and data exports.
  2. **Hardened Operational Logger (`logger.js`)**: Expands sanitization rules to automatically redact HTTP URL credentials (`https://user:pass@host`), query parameters (`?token=...`), fragments (`#...`), authorization headers, cookies, `destinationIp`, `resolvedIps`, and `rawHtml` from structured JSON log entries.
  3. **Readiness Probe (`GET /api/ready`)**: Adds a separate readiness endpoint evaluating database readiness (`readyState === 1`). Returns HTTP 200 `{ status: "READY", ready: true }` when connected and HTTP 503 `{ status: "NOT_READY", ready: false }` when DB is unavailable, without leaking connection strings or topology details.
  4. **Process Safety & Graceful Shutdown (`server.js`)**: Registers `unhandledRejection` and `uncaughtException` process listeners with sanitized logging. Enforces a 10-second bounded graceful shutdown sequence on `SIGTERM` and `SIGINT` signals.
  5. **Client Error Boundary (`ErrorBoundary.jsx`)**: Implements React `componentDidCatch` error boundary wrapping main application routes. Displays a theme-compliant fallback card with reload action button (`role="alert"`) while strictly suppressing raw Javascript stack traces in production.

## ADR-024: Product Polish, UX Consistency & Production Readiness Architecture (M12)
- **Context**: Milestone 12 brings HMWebDoctor V1 to a consistent, polished, production-ready user experience across all public routes (`/`, `/how-it-works`, `/scan`, `/reports/:scanId`, `/about`, `/contact`, `/privacy`, `/terms`, 404). Frontend UI components, asynchronous loading states, empty search states, keyboard navigation focus controls, report exports, and error state alerts required comprehensive verification and product polish without modifying frozen M0–M11 scanner logic, Public DTO schemas, or persistence boundaries.
- **Decision**:
  1. **Global UX & Design System Tokens**: Enforce theme token consistency (`bg-surface`, `text-foreground`, `border-border`, `primary`, `secondary`, `muted`, `success`, `warning`, `danger`, `info`) across light, dark, and system color modes. Ensure reduced-motion stylesheet rules (`@media (prefers-reduced-motion: reduce)`) disable non-essential animations.
  2. **Navigation & Active Route Highlighting**: Audit desktop and mobile navigation in `Header.jsx` and `Footer.jsx` across all public routes. Ensure active route classes (`text-primary`) highlight correctly. Preserve `/design-system` as an unlinked internal showcase.
  3. **Honest Loading & Empty States**: Maintain honest, indeterminate loading indicators (`Loader2` spinner with descriptive context) on `/scan` and skeleton screens on `/reports/:scanId`. Prohibit fake progress bars, percentage health meters, or simulated progress timers. Render helpful empty search state messages with clear filter actions when finding search queries return 0 matches.
  4. **Keyboard Accessibility & Focus Restoration**: Enforce focus trapping within `RemediationDrawer.jsx` when open, keyboard dismissal on `Escape` key press, and focus restoration to the triggering button upon close. Ensure semantic ARIA roles (`role="dialog"`, `aria-labelledby`, `role="alert"`) and focus rings on interactive elements.
  5. **Structured Error State Alerts**: Preserve distinct error alerts for HTTP 400 (`INVALID_SCAN_ID`), 404 (`NOT_FOUND`), 429 (`REPORT_RATE_LIMITED`), 503 (`DATABASE_UNAVAILABLE`), scan timeout, network failure, and malformed API responses. Strictly prevent collapsing specific backend error semantics into generic error fallbacks.
  6. **Data Export & Privacy Non-Leakage**: Maintain exact CSV export 8-column layout (`Finding ID`, `Category`, `Status`, `Severity`, `Title`, `Message`, `Value`, `Recommendation`) with formula injection mitigation (`sanitizeCsvCell` for `=`, `+`, `-`, `@`, `\t`, `\r`). Maintain JSON DTO purity (`<scanId>.json`) excluding internal database fields (`_id`, `__v`), request correlation IDs (`X-Request-Id`), credentials, or raw HTML. Preserve print stylesheet rules hiding non-report controls.
  7. **Comprehensive Client UX Test Suite**: Add `UXConsistency.test.jsx` (17 tests) covering navigation, scan execution, error alerts, finding search & filter semantics (OR across 4 approved text fields, excluding `value`), remediation drawer focus trap, export rules, and diagnostic posture guards (0 scores, grades, meters).
- **Impact**: Polished, accessible, responsive, and privacy-hardened frontend user experience with 100% test pass rate across all server and client test suites, 0 lint errors, and clean Vite production builds.




