# HMWebDoctor — Antigravity Project Documentation

## Purpose
This package is the complete product, UX, architecture, scanner, security, testing, and milestone specification for building HMWebDoctor V1.

HMWebDoctor is the second product in the HM family after the completed HMDevTools project.

## Product promise
**Diagnose your website. Fix what matters.**

A user enters a public website URL. HMWebDoctor safely examines it, calculates an explainable website health score, identifies issues, and provides actionable treatment guidance.

## Required stack
- Frontend: React + Vite + JavaScript
- Styling: Tailwind CSS
- Routing: React Router
- Backend: Node.js + Express + JavaScript
- Database: MongoDB + Mongoose
- HTML parsing: Cheerio
- Browser automation: Playwright
- Performance: Lighthouse where deployment permits
- Accessibility: axe-core
- Icons: Lucide React
- Charts: Recharts where useful
- Validation: Zod or Joi
- Rate limiting: express-rate-limit
- Security headers: Helmet

## Critical build rule
Read ALL files before coding.

Build one milestone at a time. Complete its acceptance criteria, test it, build it, manually verify it, and only then move to the next milestone.

Never break completed milestones while implementing later milestones.

Do not build V2/V3 features during V1 unless they are required for a clean V1 architecture.

## Reference rule
The uploaded FixMyWeb package is a structural reference only. Do not copy its branding, product name, exact wording, design, feature priorities, or assumptions. HMWebDoctor has its own product identity and this package is the source of truth.
