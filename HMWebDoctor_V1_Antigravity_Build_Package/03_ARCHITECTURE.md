# Technical Architecture

## Repository
hmwebdoctor/
  client/
  server/
  docs/
  assets/

## Client
client/src/
  components/
  pages/
  layouts/
  hooks/
  services/
  contexts/
  lib/
  utils/
  assets/
  styles/

## Server
server/src/
  config/
  controllers/
  routes/
  middleware/
  models/
  services/
  scanners/
  workers/
  scoring/
  diagnosis/
  validators/
  utils/

## Scanner modules
scanners/
  target/
  seo/
  performance/
  security/
  accessibility/
  mobile/
  images/
  links/
  bestPractices/

Every scanner returns structured data and has no UI dependency.

## Scan lifecycle
queued -> running -> completed
                  -> partial
                  -> failed
                  -> cancelled

Polling is acceptable for V1. Keep the API abstraction ready for SSE/WebSockets later.

## Worker design
Do not keep a normal HTTP request open for a long full-site scan.

Start with a simple job abstraction if necessary, but isolate scanner execution so it can later move to a queue/worker service without rewriting the API.

## Core principles
- Modular scanners
- Centralized scoring
- Centralized diagnosis mapping
- Version scanner and scoring logic
- Validate every external input
- Bounded network work
- Timeouts
- Structured logging
- Centralized errors
- No secrets in client
