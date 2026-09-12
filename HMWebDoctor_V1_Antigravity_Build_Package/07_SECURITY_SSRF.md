# Security and SSRF Requirements

This is a first-class requirement because the application fetches user-supplied URLs.

## URL validation
- Only HTTP and HTTPS.
- Normalize URLs.
- Reject URL credentials.
- Reject localhost/loopback.
- Reject private/reserved IPv4.
- Reject private/reserved IPv6.
- Reject link-local.
- Reject multicast.
- Reject cloud metadata endpoints/ranges.
- Resolve DNS and validate destination addresses.
- Re-check every redirect destination.
- Limit redirect count.
- Limit ports to intended web ports.
- Limit response size.
- Limit timeouts.
- Prevent DNS rebinding/TOCTOU as far as practical.

## Application security
- Helmet
- Explicit CORS
- Rate limiting
- Body-size limits
- Schema validation
- Safe error responses
- Secure cookie settings if cookies are used
- Password hashing if auth is enabled
- Mongo query safety
- Secret redaction in logs

## Scan safety
HMWebDoctor is not a penetration-testing tool.

Never:
- brute force
- exploit vulnerabilities
- bypass authentication
- port scan
- send destructive requests
- upload malicious payloads
- scan arbitrary unrelated infrastructure

Use safe, publicly observable HTTP/browser analysis only.

## Worker isolation
Prefer a restricted worker/container for browser automation where deployment supports it. Never grant scanner pages unnecessary system privileges.
