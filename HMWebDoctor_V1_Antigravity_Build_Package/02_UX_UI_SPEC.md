# UX / UI Specification

## Design direction
Simple, professional, premium, calm, and technical.

The doctor metaphor should be subtle and useful rather than cartoonish.

Use:
- Spacious layouts
- Strong typography
- Clear hierarchy
- Restrained borders/shadows
- Consistent radius
- Simple score visualizations
- Purposeful motion only
- Excellent loading/error/empty/partial states
- Responsive layouts

Avoid:
- Excessive gradients
- Excessive glassmorphism
- Medical clip-art
- Noisy dashboards
- Huge decorative elements
- Too many colors

## Theme
Support:
- System
- Light
- Dark

Use centralized design tokens/CSS variables. Do not hardcode brand/accent colors in individual components.

## Header
Logo left.
Main navigation:
- Home
- How It Works
- Scan Website
- About

Right:
- Theme control
- Optional dashboard/login action if implemented

Footer:
- Product
- Company
- Resources
- Legal
- Contact

## Homepage
Hero:
- HMWebDoctor brand
- Headline
- Short value proposition
- URL input
- Scan Website CTA
- trust/safety note

Sections:
- What we examine
- Example diagnosis/report preview
- How it works
- Why the findings matter
- FAQ
- final CTA

## Scanner
- URL field
- validation
- scan progress
- current stage
- progress indicator
- retry on failure
- clear timeout messaging

## Report
Top:
- URL
- scan timestamp
- overall score
- health label
- re-scan
- share

Then:
- category scores
- issue summary
- prioritized treatment
- filters
- findings
- evidence
- technical details

## Accessibility
Use semantic HTML, keyboard navigation, focus states, labels, status announcements, reduced-motion support, and sufficient contrast.
