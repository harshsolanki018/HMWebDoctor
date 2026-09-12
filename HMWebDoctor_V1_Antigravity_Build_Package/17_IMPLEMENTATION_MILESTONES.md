# Implementation Milestones

## Milestone 0 — Repository Contract
- Read all docs
- Create monorepo
- Create README/changelog/status files
- Set up client/server
- Environment templates
- Lint/build/test baseline
- Health endpoint
Acceptance: clean install, start, build, lint and health checks.

## Milestone 1 — Brand + Design System
- HMWebDoctor logo assets
- favicon
- theme system
- design tokens
- app shell
- header/footer
Acceptance: professional responsive shell works in system/light/dark.

## Milestone 2 — Public Product Pages
- Home
- How It Works
- About
- Contact
- Privacy
- Terms
- 404
Acceptance: all routes, metadata, forms, responsive behavior and accessibility basics pass.

## Milestone 3 — Scan Infrastructure
- URL normalization
- SSRF validation
- safe fetching
- scan lifecycle
- worker abstraction
- Mongo persistence
- scan status API
Acceptance: hostile targets are blocked; timeouts/limits work.

## Milestone 4 — SEO + Passive Security
- SEO scanner
- security scanner
- structured finding model
- tests
Acceptance: real evidence and no fake results.

## Milestone 5 — Performance + Browser Layer
- Playwright
- Lighthouse where practical
- performance metrics
- resource analysis
Acceptance: controlled browser scan with bounded resources.

## Milestone 6 — Accessibility + Mobile
- axe-core
- mobile profile
- accessibility/mobile findings
Acceptance: real browser checks and clear limitations.

## Milestone 7 — Links + Images + Best Practices
- controlled same-origin link checking
- image analysis
- best-practice checks
Acceptance: bounded crawl/check behavior.

## Milestone 8 — Scoring + Diagnosis
- versioned score engine
- category scores
- health label
- severity
- treatment mapping
Acceptance: deterministic scoring rules are tested/documented.

## Milestone 9 — Scanner UX + Report
- progress UI
- report dashboard
- findings
- filters/search
- technical evidence
Acceptance: complete scan-to-report journey.

## Milestone 10 — Public Reports + History
- public report IDs
- shareable reports
- persistent history
- before/after comparison
Acceptance: safe public data exposure and stable historical reports.

## Milestone 11 — Production Hardening
- security review
- SSRF tests
- accessibility audit
- performance review
- deployment configuration
- logging/health monitoring
- final documentation
Acceptance: V1 checklist complete with no critical known issue.

## Mandatory milestone procedure
Before:
1. Read the milestone requirements.
2. Inspect current code.
3. Confirm previous milestone is complete.

During:
4. Implement only current milestone.
5. Add tests.
6. Preserve previous functionality.

After:
7. Run tests.
8. Run lint.
9. Run production build.
10. Manually smoke-test.
11. Inspect git diff.
12. Update MILESTONE_STATUS.md.
13. Update CHANGELOG.md.
14. Record important decisions.
15. Only then mark COMPLETE.

Never silently skip acceptance criteria.
