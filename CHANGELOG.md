# Changelog

All notable changes to HMWebDoctor will be documented in this file.

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
