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

## Scan Infrastructure Endpoint
The backend provides a secure baseline website scanning endpoint at `POST /api/scans`:
- **Request**: `{ "url": "https://example.com" }`
- **SSRF Protection**: Socket-level DNS rebinding prevention, loopback & private IP blocking, cloud metadata blocking, and port whitelisting (80, 443, 8080, 8443).
- **Safety Limits**: Manual 5-hop redirect loop validation, 5MB response size cutoff, and 30s timeout enforcement.
- **Baseline Extraction**: HTML title, lang attribute, charset, meta description, document byte size, and DOCTYPE declaration.

## Documentation
See [HMWebDoctor_V1_Antigravity_Build_Package](./HMWebDoctor_V1_Antigravity_Build_Package/00_README.md) for full specifications.
