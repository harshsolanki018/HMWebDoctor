# Performance Scanner

Use Playwright and/or Lighthouse for browser-level measurements where appropriate.

## Measurements
Collect only metrics the chosen tool actually returns:
- Performance score
- FCP
- LCP
- CLS
- INP when available
- TBT where applicable
- TTFB
- DOM/content size
- total requests
- transferred bytes
- resource totals by type
- largest resources
- render-blocking signals
- relevant optimization opportunities

## Lab vs field
Clearly label lab measurements. Do not present a lab result as real-user field data.

## Profiles
Run desktop and mobile profiles separately when practical.

## Failure handling
If browser execution times out:
- mark affected checks NOT_TESTED or PARTIAL
- preserve completed scanner results
- show a useful explanation
- do not invent metrics

## Resource limits
Use:
- navigation timeout
- browser timeout
- request/resource limits
- concurrency limits
- memory-conscious execution
