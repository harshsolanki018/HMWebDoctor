# API Specification

Base path: /api

## Health
GET /health

## Scans
POST /scans
Body:
{ "url": "https://example.com" }

GET /scans/:id
GET /scans/:id/status
DELETE /scans/:id

## Reports
GET /reports/:publicId
GET /reports/:publicId/summary
GET /reports/:publicId/issues

## Websites/history
POST /websites
GET /websites
GET /websites/:id
GET /websites/:id/scans

## Optional V1 authentication
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me

Authentication must not be allowed to delay the anonymous public scanner if anonymous scanning is part of the final V1 UX.

## Response format
Success:
{
  "success": true,
  "data": {},
  "error": null
}

Error:
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_URL",
    "message": "Please enter a valid public website URL."
  }
}

Never return raw stack traces, internal paths, secrets, internal IPs, or infrastructure details.
