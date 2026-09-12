# Testing Checklist

## URL/SSRF
- Valid HTTPS
- Valid HTTP
- Trailing slash
- Query string
- Invalid URL
- Credentials in URL
- localhost
- loopback IPv4/IPv6
- private IPv4
- private IPv6
- link-local
- metadata address
- redirect to blocked destination
- too many redirects
- DNS failure
- timeout
- oversized response
- unsupported scheme

## Website fixtures/cases
- normal static site
- SPA
- no title
- no meta description
- multiple H1
- no sitemap
- robots restrictions
- broken links
- large images
- no HTTPS
- missing security headers
- accessibility violations

## Scanner
- each module succeeds independently
- module timeout does not destroy full scan
- partial result persists
- deterministic scoring tests
- score version persisted

## UI
- mobile
- tablet
- desktop
- system/light/dark
- keyboard navigation
- reduced motion
- error states
- loading states
- empty states
- partial scan states

## Quality rule
Never display PASS when the check failed, timed out, was not measured, or is unavailable.
