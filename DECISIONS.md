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

