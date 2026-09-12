# ANTIGRAVITY MASTER BUILD PROMPT — HMWebDoctor V1

You are the lead engineer building HMWebDoctor V1.

HMDevTools is already a completed sibling project. HMWebDoctor must meet a comparable production-quality bar while remaining a separate product.

## SOURCE OF TRUTH
Read every document in this package before writing code:
00_README.md through 18_FUTURE_ROADMAP.md, plus assets/LOGO_ASSET_INSTRUCTIONS.md.

The reference FixMyWeb package supplied by the user is structural inspiration only. Do not copy its branding or exact product implementation.

## NON-NEGOTIABLE RULES
1. Use MERN with JavaScript.
2. React + Vite.
3. Node + Express.
4. MongoDB + Mongoose.
5. Tailwind CSS.
6. Build real functionality, not static mockups.
7. Do not use fake scanner results.
8. Scanner results must come from actual analysis.
9. Keep scanner modules independent.
10. Build one milestone at a time.
11. Never break a completed milestone.
12. Do not silently change requirements.
13. Treat every user URL as untrusted.
14. Implement SSRF protection before arbitrary outbound scanning.
15. Use safe passive web analysis only.
16. Do not perform penetration testing, exploitation, brute force, port scanning, or destructive requests.
17. Support System/Light/Dark theme.
18. Do not hardcode a single brand/accent color into individual components.
19. Make UI simple, professional, responsive and accessible.
20. Include all required professional pages.
21. Add loading, empty, error, partial and success states.
22. Never show PASS for a check that failed, timed out, was not tested, or is unavailable.
23. Version scanner and scoring logic.
24. Keep documentation current.
25. Do not implement V2/V3 scope during V1.

## BRAND
Name: HMWebDoctor
Tagline: Diagnose your website. Fix what matters.

Logo requirements are in assets/LOGO_ASSET_INSTRUCTIONS.md.
Use the provided logo assets as a starting point and refine only if necessary.

## REQUIRED PAGES
Home
How It Works
Scan Website
Report
About
Contact
Privacy Policy
Terms of Service
404

Optional dashboard/history/auth only if it can be completed without compromising the core V1.

## CORE SCANNING
SEO
Performance
Security
Accessibility
Mobile
Images
Links
Best Practices

## DIAGNOSIS
Every finding should have:
- status
- severity
- title
- summary
- why it matters
- recommendation/treatment
- evidence
- optional affected URL/selector
- applicability/confidence where useful

## SCORING
Use the centralized score model.
Store scannerVersion and scoreModelVersion.
Never scatter magic scoring constants throughout modules.

## SECURITY
Implement URL validation and SSRF protection before enabling arbitrary user URL fetching:
- HTTP/HTTPS only
- reject credentials
- DNS/IP validation
- block private/loopback/link-local/reserved/multicast/metadata destinations
- redirect validation
- redirect limits
- response limits
- timeout limits
- rate limiting

## WORKER
Do not keep an HTTP request open for a long browser scan. Use a job/worker abstraction.
Polling is acceptable for V1.

## QUALITY BAR
After every milestone:
- tests
- lint
- build
- smoke test
- inspect diff
- update milestone status
- update changelog
- document decisions

If a milestone fails, fix it before starting the next one.

## FIRST ACTION
Do NOT build the entire product immediately.

Start with Milestone 0 only.
First inspect the repository and documentation, then implement the repository contract and baseline.

At the end of Milestone 0, report:
- files created/changed
- commands run
- test/lint/build results
- acceptance criteria status
- any blockers
- exact next milestone

Do not begin Milestone 1 until Milestone 0 is complete.
