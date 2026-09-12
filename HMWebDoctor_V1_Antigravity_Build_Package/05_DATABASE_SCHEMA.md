# MongoDB Schema

Use MongoDB + Mongoose.

## Website
- normalizedUrl
- hostname
- firstScannedAt
- lastScannedAt
- scanCount
- createdAt
- updatedAt

## Scan
- websiteId
- requestedUrl
- normalizedUrl
- finalUrl
- status
- progress
- currentStage
- overallScore
- categoryScores
- issueCounts
- summary
- findings
- metrics
- scoreModelVersion
- scannerVersion
- startedAt
- completedAt
- errorSummary
- createdAt
- updatedAt

## Report
- scanId
- publicId
- visibility
- expiresAt optional
- revokedAt optional
- createdAt

## User
Only if authentication is enabled:
- email
- name
- passwordHash
- createdAt
- updatedAt

Do not store credentials or unnecessary full third-party page content.

Use indexes for publicId, websiteId, timestamps, and common lookup fields.
