# Scoring Engine

The score is a FixMyWeb-style product health score, not a search-engine ranking prediction.

## Categories
- SEO
- Performance
- Security
- Accessibility
- Mobile
- Images
- Links
- Best Practices

## Default weights
SEO 15%
Performance 20%
Security 20%
Accessibility 15%
Mobile 10%
Images 5%
Links 5%
Best Practices 10%

Store weights centrally. Do not scatter scoring numbers through scanner modules.

## Rules
Every check defines:
- applicable?
- measured?
- severity
- points/impact
- confidence where relevant

Do not punish a website for a genuinely unavailable or non-applicable check.

## Health labels
90-100: Excellent
75-89: Healthy
60-74: Needs Attention
40-59: Poor
0-39: Critical

## Versioning
Every scan stores:
- scannerVersion
- scoreModelVersion

Historical reports must remain stable when future scoring rules change.

## Determinism
Same target + same scanner version + same scoring model should produce the same score for deterministic checks. Browser/network measurements may naturally vary and must be labeled accordingly.
