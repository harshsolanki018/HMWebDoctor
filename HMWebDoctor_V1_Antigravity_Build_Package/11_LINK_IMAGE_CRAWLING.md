# Links and Images

## Link scanner
- Extract absolute and relative links.
- Normalize URLs.
- Ignore mailto, tel, javascript and non-web schemes.
- Deduplicate.
- Prefer same-origin checking for V1.
- Limit number of links checked.
- Limit concurrency.
- Use strict timeouts.
- Detect HTTP errors.
- Detect redirects.
- Do not crawl an entire domain in V1.
- Avoid uncontrolled external crawling.

## Image scanner
Check:
- image count
- missing alt
- file size
- dimensions where available
- modern format opportunities
- oversized image signals
- lazy-loading signals where applicable
- image transfer contribution

Only estimate savings when calculation is defensible.
