# Changelog

All notable changes to HMWebDoctor will be documented in this file.

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
