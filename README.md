# HMWebDoctor

> **Diagnose your website. Fix what matters.**

HMWebDoctor is a production-ready website health and diagnosis platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Stack Overview
- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Testing**: Vitest, Supertest, React Testing Library
- **Linting**: ESLint

## Repository Structure
```
HMWebDoctor/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── docs/            # Product & architecture documentation
├── assets/          # Brand & logo assets
├── package.json     # Monorepo scripts
├── .gitignore       # Git ignore rules
├── .env.example     # Environment template pointer
├── README.md        # Project documentation
├── CHANGELOG.md     # Milestone & feature changelog
├── DECISIONS.md     # Architecture decisions
└── MILESTONE_STATUS.md # Implementation milestone status
```

## Quick Start

### 1. Installation
```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Environment Setup
Create environment files from templates:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Running Development Servers
Run client and server concurrently:
```bash
npm run dev
```

Or run services individually:
```bash
npm run dev:server   # Starts Express API on http://localhost:5000
npm run dev:client   # Starts Vite React App on http://localhost:5173
```

### 4. Running Tests
```bash
npm run test          # Run server and client tests
npm run test:server   # Run server tests
npm run test:client   # Run client tests
```

### 5. Linting & Building
```bash
npm run lint          # Run ESLint across server and client
npm run build         # Build client for production and verify backend
```

## Health Verification Endpoint
The backend provides a health check endpoint at `/api/health`:
- **Healthy**: `{ "success": true, "data": { "status": "healthy", "services": { "api": "healthy", "database": "healthy" } }, "error": null }`
- **Degraded**: `{ "success": true, "data": { "status": "degraded", "services": { "api": "healthy", "database": "unavailable" } }, "error": null }`

## Scan Infrastructure & Passive Analyzers (`POST /api/scans`)
The backend provides a secure diagnostic website scanning endpoint at `POST /api/scans`:
- **Request**: `{ "url": "https://example.com" }`
- **SSRF Protection**: Socket-level DNS rebinding prevention, loopback & private IP blocking, cloud metadata blocking, and port whitelisting (80, 443, 8080, 8443).
- **Safety Limits**: Manual 5-hop redirect loop validation, 5MB response size cutoff, 30s timeout enforcement, and rate limiting (10 req/15m).
- **Baseline Metadata**: HTML title, lang attribute, charset, meta description, document byte size, and DOCTYPE declaration.
- **Passive Diagnostic Scanners (M4–M7)**:
  - **SEO (M4)**: Title length (30-60 chars), meta description length (50-160 chars), canonical URL matching, meta robots directives, viewport configuration, heading hierarchy sequence, and Open Graph tags.
  - **Security Headers (M4)**: HTTPS transport, HSTS (max-age >= 180d), CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and non-sensitive Set-Cookie flags.
  - **Crawlability (M4)**: X-Robots-Tag, HTML sitemap link tags, and bounded single fetch to `<origin>/robots.txt`.
  - **Technical (M4)**: HTTP status codes, payload compression (gzip/br), cache controls, charset consistency, DOCTYPE, and payload size.
  - **Performance (M5)**: Transfer size, HTML document parsing latency, resource counts (script, stylesheet, img), inline script/style counts, render-blocking scripts, and image format optimization.
  - **Accessibility (M6)**: `lang` attribute, image `alt` attributes, heading structure, form label association, button accessible names, link text quality, ARIA roles, table headers, iframe titles, and viewport scaling.
  - **Mobile Responsiveness (M6)**: Viewport meta tag presence, viewport scale restrictions, horizontal overflow risk markup, tap target sizes, and responsive media tags.
  - **Content & HTML Quality (M7)**: Body-only visible text extraction, character count, word count, low content warnings, empty page detection, repeated text signals, missing structural tags (`html`, `head`, `body`), duplicate IDs, empty/invalid `href`, and empty/invalid `src` attributes.
- **Action Center & Remediation Engine (M8)**:
  - **Prioritized Finding Aggregation**: Aggregates actionable (`fail`, `warn`) findings across all 8 scanner categories.
  - **5-Tier Deterministic Ranking**: Severity (`high` > `medium` > `low`) $\rightarrow$ Technical Domain (`security` > `accessibility` > `performance` > `seo_crawlability` > `markup_structure`) $\rightarrow$ Category Rank $\rightarrow$ Finding ID Alphabetical $\rightarrow$ Discovery Index.
  - **100% Static Code Fixes**: Static code snippet recommendations for all 55 exact source-derived finding IDs with zero parameter interpolation, zero external dependencies, and zero fake scores/grades.
  - **Remediation Drawer UX**: Accessible slide-over drawer with focus management, plain-text code snippet rendering, and copy-to-clipboard functionality.

## Shareable Scan Reports, Persistence & Data Export (`GET /api/scans/:scanId`) (M9)
- **Public Report Endpoint (`GET /api/scans/:scanId`)**:
  - Secure report retrieval endpoint returning sanitized public report DTOs for valid `scanId` identifiers (`/^scan_[a-f0-9]{16}$/`). Rate limited via `reportRateLimiter` (60 req/15m/IP).
- **Public Report DTO Security Boundary**:
  - Enforces strict field allowlist stripping MongoDB internal fields (`_id`, `__v`), raw HTML content, raw HTTP headers, cookies/tokens, and M3 internal destination IP metadata (`destinationIp`, `resolvedIps`).
- **URL Privacy Sanitization**:
  - Strips user credentials (`user:pass@`), the ENTIRE query string (`?token=...`), and the ENTIRE fragment (`#hash`) 100% for public persistence and reporting while preserving exact target URLs for scanning in M3.
- **Bounded Write Timeout & Degraded Mode**:
  - 2000ms write timeout (`Promise.race`) with direct `.catch()` rejection handling and 5MB payload limit. If DB is offline or times out, returns HTTP 200 with `isPersisted: false` and displays an honest degraded persistence warning.
- **Shareable Report View & Privacy**:
  - Accessible report view at `/reports/:scanId` configured with `<meta name="robots" content="noindex, nofollow" />` via `SeoHead` to prevent search engine indexing.
- **Real-time Search & Multi-Group Filtering**:
  - Text search (OR across finding ID, title, description, recommendation, value) and multi-group filter dropdowns (AND across category, severity, status).
- **Client Data Export Utilities**:
  - Export full report as `<scanId>.json` or flat findings as `<scanId>-findings.csv` with CSV formula injection protection (`sanitizeCsvCell`). Native `@media print` print styles for clean PDF/paper printing.

## Report Sharing & Export Hardening (M10)
- **Enhanced Sharing UX & Clipboard Feedback**:
  - Dedicated "Copy Scan ID" button alongside "Share Link" (`/reports/:scanId`) with stateful success/failure feedback (`copiedLink`, `copiedId`) and explicit `aria-label` attributes on all action controls.
- **Standardized CSV Export Layout**:
  - Exact 8-column header and row layout starting with `Finding ID` (`Finding ID`, `Category`, `Status`, `Severity`, `Title`, `Message`, `Value`, `Recommendation`) with single-quote formula injection protection for `=`, `+`, `-`, `@`, `\t`, `\r`.
- **Structured Error State Handling**:
  - Distinct alert views and messages for HTTP 400 (`INVALID_SCAN_ID`), HTTP 404 (`NOT_FOUND`), HTTP 429 (`REPORT_RATE_LIMITED`), and HTTP 503 (`DATABASE_UNAVAILABLE`). 503 errors render "Service Temporarily Unavailable" and never fall back to 404.
- **Native Print & Focus Management**:
  - Scoped `@media print` CSS preserving main report header card and findings while hiding action buttons, search bar, navigation headers, footers, and slide-over remediation drawers (`RemediationDrawer.jsx`). Focus trap and restoration on drawer controls.

## Documentation
See [HMWebDoctor_V1_Antigravity_Build_Package](./HMWebDoctor_V1_Antigravity_Build_Package/00_README.md) for full specifications.
