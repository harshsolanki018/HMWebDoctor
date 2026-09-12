# Product Requirements — HMWebDoctor V1

## Product positioning
HMWebDoctor is a professional website health and diagnosis platform.

## Primary audience
- Developers
- Freelancers
- Small businesses
- Website owners
- Agencies using it as an audit utility

## Primary flow
1. Visit homepage.
2. Enter a public URL.
3. Validate URL in browser.
4. Submit to backend.
5. Backend performs SSRF-safe validation.
6. Create scan job.
7. Worker examines the website.
8. Show scan progress.
9. Calculate deterministic category and overall health scores.
10. Generate diagnosis.
11. Show report.
12. Allow safe sharing/revisiting of a public report.

## V1 examination categories
- SEO
- Performance
- Security
- Accessibility
- Mobile
- Images
- Links
- Best Practices

## Diagnosis output
Every meaningful finding should explain:
- What was detected
- Severity
- Why it matters
- How to fix it
- Evidence
- Affected resource/selector when safely available
- Confidence/applicability where useful

## Severity
- Critical
- High
- Medium
- Low
- Info

## Status
- PASS
- FAIL
- WARNING
- NOT_TESTED
- NOT_APPLICABLE

Never convert an unavailable measurement into a fake pass or fail.

## V1 report features
- Overall health score
- Category scores
- Issue counts
- Prioritized treatment list
- Category findings
- Technical evidence
- Re-scan
- Shareable public report
- Scan history
- Before/after comparison when two scans are available

## V1 non-goals
- Payments
- Billing
- Agency workspace
- White-label
- Competitor analysis
- AI-generated fixes
- Full-domain crawling
- Penetration testing
- Brute force
- Port scanning
- Exploitation
- Destructive requests
- Public API
