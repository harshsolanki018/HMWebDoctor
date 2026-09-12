# Passive Security Scanner

The security scanner performs safe, passive HTTP/browser observations.

## Checks
- HTTPS
- HTTP -> HTTPS redirect
- HSTS
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- cookie Secure
- cookie HttpOnly
- cookie SameSite
- mixed content signals

## Reporting
Explain:
- detected state
- why it matters
- recommended configuration

Do not imply that passing headers means the application is secure against all attacks.
