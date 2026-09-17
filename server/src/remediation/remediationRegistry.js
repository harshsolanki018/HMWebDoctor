const { z } = require('zod');

/**
 * Zod Schema for Deterministic Remediation Objects
 */
const remediationSchema = z.object({
  summary: z.string().min(10),
  impact: z.string().min(10),
  codeFix: z.string().min(5).nullable(),
  steps: z.array(z.string().min(5)).min(1),
  verification: z.string().min(10),
});

/**
 * Canonical Remediation Registry covering all 55 emitted M4–M7 finding IDs.
 * All content is strictly static with zero dynamic parameter interpolation.
 */
const rawRegistry = {
  // 1. SEO Scanner (8 IDs)
  'seo-title': {
    summary: 'Document title element provides essential topic context for search engine crawlers and browser tabs.',
    impact: 'Improves search engine click-through rates and bookmark/tab usability for visitors.',
    codeFix: '<head>\n  <title>Descriptive Page Title Between 30 and 60 Characters</title>\n</head>',
    steps: [
      'Ensure a single `<title>` tag is present in the document `<head>`.',
      'Provide concise, accurate title text between 30 and 60 characters.',
      'Include primary keyword context near the beginning of the title.',
    ],
    verification: 'Inspect `<head>` in browser dev tools or run a passive HTML scan to confirm valid title markup.',
  },

  'seo-meta-description': {
    summary: 'Meta description provides a brief textual summary of document content displayed in search snippets.',
    impact: 'Enhances snippet appearance in search result pages and increases organic traffic engagement.',
    codeFix: '<head>\n  <meta name="description" content="Provide a clear, descriptive summary of page content between 50 and 160 characters.">\n</head>',
    steps: [
      'Add `<meta name="description" content="...">` inside the `<head>` tag.',
      'Ensure text length is between 50 and 160 characters.',
      'Craft unique, compelling content summaries for each public page.',
    ],
    verification: 'Check `<head>` metadata in browser dev tools to verify meta description presence and length.',
  },

  'seo-canonical': {
    summary: 'Canonical URL tags specify the preferred URL version to prevent duplicate content indexing.',
    impact: 'Consolidates search ranking signals across URL variants and prevents duplicate content penalties.',
    codeFix: '<head>\n  <link rel="canonical" href="https://your-domain.com/page-path">\n</head>',
    steps: [
      'Add `<link rel="canonical" href="...">` inside `<head>`.',
      'Use absolute HTTPS URLs including canonical domain and protocol.',
      'Ensure self-referencing canonical links match the preferred URL structure.',
    ],
    verification: 'Verify canonical `<link>` element in document head points to the authoritative URL.',
  },

  'seo-meta-robots': {
    summary: 'Meta robots tags control search crawler indexing and link-following directives.',
    impact: 'Prevents unintended search indexing of staging pages or ensures search engine discoverability.',
    codeFix: '<head>\n  <meta name="robots" content="index, follow">\n</head>',
    steps: [
      'Review meta robots directives in document `<head>`.',
      'Use `index, follow` for public landing pages.',
      'Use `noindex, nofollow` only for private utility or administrative views.',
    ],
    verification: 'Check meta robots tag content attribute in document source.',
  },

  'seo-viewport': {
    summary: 'Viewport meta tag configures document scaling for mobile and desktop viewports.',
    impact: 'Ensures proper page rendering and text readability across mobile screen sizes.',
    codeFix: '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>',
    steps: [
      'Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` to `<head>`.',
      'Do not disable pinch-to-zoom scaling or set fixed pixel width boundaries.',
    ],
    verification: 'Verify responsive rendering in browser mobile emulator views.',
  },

  'seo-heading-h1': {
    summary: 'Heading level 1 (`<h1>`) defines the primary topic heading of the document body.',
    impact: 'Establishes clear semantic structure for assist technology users and search crawlers.',
    codeFix: '<main>\n  <h1>Primary Document Heading</h1>\n</main>',
    steps: [
      'Ensure document contains exactly one top-level `<h1>` heading.',
      'Place `<h1>` inside the primary content area (`<main>` or `<article>`).',
      'Keep heading text concise and representative of main page content.',
    ],
    verification: 'Inspect DOM heading structure to ensure a single main `<h1>` tag exists.',
  },

  'seo-heading-hierarchy': {
    summary: 'Heading tags (`<h1>`–`<h6>`) must follow a logical sequential nesting order.',
    impact: 'Improves document outline navigation for screen reader users and structured indexers.',
    codeFix: '<h1>Main Topic</h1>\n<h2>Section Header</h2>\n<h3>Subsection Header</h3>',
    steps: [
      'Review heading hierarchy to ensure levels are not skipped (e.g. `<h1>` followed directly by `<h3>`).',
      'Use headings for semantic document sections rather than visual styling.',
    ],
    verification: 'Audit heading structure sequentially using DOM tree inspection.',
  },

  'seo-opengraph': {
    summary: 'OpenGraph meta tags provide title, description, and image metadata for social platform sharing.',
    impact: 'Improves visual rich card previews when links are shared on social media and messaging platforms.',
    codeFix: '<head>\n  <meta property="og:title" content="Page Title">\n  <meta property="og:description" content="Page Summary">\n  <meta property="og:image" content="https://your-domain.com/og-image.jpg">\n</head>',
    steps: [
      'Add `og:title`, `og:description`, and `og:image` meta tags to `<head>`.',
      'Specify absolute HTTPS URLs for social image assets.',
    ],
    verification: 'Validate OpenGraph meta properties using social platform preview debuggers.',
  },

  // 2. Security Headers Scanner (8 IDs)
  'sec-https': {
    summary: 'HTTPS encryption protects network traffic against eavesdropping and data manipulation.',
    impact: 'Safeguards user privacy and session data in transit between client and server.',
    codeFix: '# Nginx HTTPS Server Block\nserver {\n  listen 443 ssl http2;\n  server_name your-domain.com;\n  ssl_certificate /path/to/fullchain.pem;\n  ssl_certificate_key /path/to/privkey.pem;\n}',
    steps: [
      'Obtain an SSL/TLS certificate from a trusted certificate authority.',
      'Configure server software to serve HTTPS on port 443.',
      'Implement 301 redirects from HTTP (port 80) to HTTPS (port 443).',
    ],
    verification: 'Verify connection protocol displays HTTPS locks in browser address bar.',
  },

  'sec-hsts': {
    summary: 'HTTP Strict Transport Security (HSTS) instructs browsers to use HTTPS exclusively.',
    impact: 'Mitigates protocol downgrade attacks and cookie hijacking.',
    codeFix: '# Nginx Header Configuration\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
    steps: [
      'Add `Strict-Transport-Security` header to web server responses.',
      'Set `max-age` directive to at least 15552000 seconds (180 days).',
      'Include `includeSubDomains` and optional `preload` directives when ready.',
    ],
    verification: 'Inspect HTTP response headers for `Strict-Transport-Security` directive.',
  },

  'sec-csp': {
    summary: 'Content Security Policy (CSP) restricts resource loading origins to mitigate XSS attacks.',
    impact: 'Prevents malicious script injection and unauthorized data exfiltration.',
    codeFix: '# Nginx Core CSP Header\nadd_header Content-Security-Policy "default-src \'self\'; script-src \'self\'; style-src \'self\';" always;',
    steps: [
      'Define a Content-Security-Policy header with `default-src` directives.',
      'Restrict script and object sources to trusted domains or nonces.',
      'Test policy using Report-Only mode before enforcing strict rules.',
    ],
    verification: 'Check response headers for `Content-Security-Policy` and verify browser console for CSP warnings.',
  },

  'sec-x-frame-options': {
    summary: 'X-Frame-Options controls whether document can be embedded inside `<frame>` or `<iframe>` tags.',
    impact: 'Protects visitors from clickjacking attacks overlaying hidden iframe triggers.',
    codeFix: '# Nginx Framing Protection\nadd_header X-Frame-Options "SAMEORIGIN" always;',
    steps: [
      'Configure server to return `X-Frame-Options: DENY` or `X-Frame-Options: SAMEORIGIN`.',
      'Alternatively, specify `frame-ancestors` directive in Content Security Policy.',
    ],
    verification: 'Confirm `X-Frame-Options` response header value using curl or browser network tools.',
  },

  'sec-x-content-type-options': {
    summary: 'X-Content-Type-Options stops browsers from MIME-sniffing response content types.',
    impact: 'Prevents drive-by download attacks where non-executable files are executed as scripts.',
    codeFix: '# Nginx MIME Protection\nadd_header X-Content-Type-Options "nosniff" always;',
    steps: [
      'Add `X-Content-Type-Options: nosniff` header to all HTTP responses.',
      'Ensure proper `Content-Type` headers are declared for all static assets.',
    ],
    verification: 'Verify `X-Content-Type-Options: nosniff` header presence in network response headers.',
  },

  'sec-referrer-policy': {
    summary: 'Referrer-Policy header controls how much referrer information is included with requests.',
    impact: 'Prevents leakage of sensitive URL path tokens to third-party destinations.',
    codeFix: '# Nginx Referrer Privacy Policy\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    steps: [
      'Add `Referrer-Policy` response header to server configuration.',
      'Use `strict-origin-when-cross-origin` or `no-referrer-when-downgrade`.',
    ],
    verification: 'Check network response headers for valid `Referrer-Policy` values.',
  },

  'sec-permissions-policy': {
    summary: 'Permissions-Policy header restricts browser feature access like camera, microphone, and location.',
    impact: 'Reduces attack surface by disabling unused powerful browser APIs.',
    codeFix: '# Nginx Permissions Policy Header\nadd_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
    steps: [
      'Identify browser features required by the application.',
      'Add `Permissions-Policy` header restricting unneeded capabilities.',
    ],
    verification: 'Confirm `Permissions-Policy` header presence in server HTTP headers.',
  },

  'sec-cookie-flags': {
    summary: 'Cookie security flags (`Secure`, `HttpOnly`, `SameSite`) safeguard session data.',
    impact: 'Prevents cookie transmission over unencrypted HTTP, cross-site scripting cookie theft, and CSRF.',
    codeFix: '# Express Session Cookie Security Example\nres.cookie("session_id", "value", {\n  secure: true,\n  httpOnly: true,\n  sameSite: "strict"\n});',
    steps: [
      'Set `Secure` flag on all cookies to restrict transmission to HTTPS.',
      'Set `HttpOnly` flag on sensitive cookies to block JavaScript access.',
      'Set `SameSite=Lax` or `SameSite=Strict` flag to prevent CSRF exploits.',
    ],
    verification: 'Inspect cookie attributes in browser dev tools storage tab.',
  },

  // 3. Crawlability Scanner (3 IDs)
  'crawl-x-robots-tag': {
    summary: 'X-Robots-Tag HTTP header dictates search engine indexing instructions for non-HTML files.',
    impact: 'Controls search engine indexing of PDFs, images, and API responses.',
    codeFix: '# Nginx Robots Header Configuration\nadd_header X-Robots-Tag "noindex, nofollow" always;',
    steps: [
      'Review X-Robots-Tag directives in HTTP response headers.',
      'Ensure indexable pages do not specify `noindex` or `none` directives.',
    ],
    verification: 'Inspect HTTP response headers for `X-Robots-Tag` declarations.',
  },

  'crawl-html-sitemap': {
    summary: 'HTML sitemaps provide human and machine navigation pathways for site exploration.',
    impact: 'Assists search crawlers and site visitors in discovering deep content links.',
    codeFix: '<nav aria-label="Sitemap">\n  <ul>\n    <li><a href="/about">About Us</a></li>\n    <li><a href="/services">Services</a></li>\n  </ul>\n</nav>',
    steps: [
      'Create a clear HTML navigation page listing primary site sections.',
      'Link to the sitemap from footer or sub-navigation areas.',
    ],
    verification: 'Verify accessibility of sitemap link from main navigation paths.',
  },

  'crawl-robots-txt': {
    summary: 'robots.txt file instructs automated crawlers which URL paths may be visited.',
    impact: 'Prevents crawler overload on server resources and controls access to utility paths.',
    codeFix: '# Example robots.txt\nUser-agent: *\nDisallow: /admin/\nSitemap: https://your-domain.com/sitemap.xml',
    steps: [
      'Place a valid `robots.txt` file at website root (`/robots.txt`).',
      'Include XML sitemap URL directive in `robots.txt`.',
      'Ensure essential public content paths are not blocked by `Disallow` rules.',
    ],
    verification: 'Fetch `/robots.txt` via HTTP request to verify formatting and access rules.',
  },

  // 4. Technical Details Scanner (5 IDs)
  'tech-status-code': {
    summary: 'HTTP status codes communicate server response outcomes to clients and crawlers.',
    impact: 'Ensures correct document handling and index status by search engines and browsers.',
    codeFix: '# Express HTTP 200 OK Response\napp.get("/page", (req, res) => {\n  res.status(200).send(htmlContent);\n});',
    steps: [
      'Verify target URL responds with HTTP 200 OK status for normal content.',
      'Use 301 permanent redirects for moved pages, and 404 for deleted assets.',
    ],
    verification: 'Inspect HTTP response status code in browser network inspector.',
  },

  'tech-compression': {
    summary: 'HTTP compression (Gzip or Brotli) reduces text document transfer payloads.',
    impact: 'Decreases page download latency and reduces network bandwidth consumption.',
    codeFix: '# Nginx Gzip Configuration\ngzip on;\ngzip_types text/plain text/css application/javascript application/json;',
    steps: [
      'Enable Gzip or Brotli compression modules on your web server.',
      'Configure compression for text mime-types (`text/html`, `text/css`, `application/javascript`).',
    ],
    verification: 'Check for `Content-Encoding: gzip` or `br` in network response headers.',
  },

  'tech-caching': {
    summary: 'Cache-Control headers direct browser and intermediary caching behavior.',
    impact: 'Accelerates repeat page loads and reduces server request overhead.',
    codeFix: '# Nginx Static Asset Cache Header\nlocation ~* \\.(css|js|jpg|png|svg)$ {\n  add_header Cache-Control "public, max-age=31536000, immutable";\n}',
    steps: [
      'Configure `Cache-Control` headers for static asset requests.',
      'Use `max-age` directives for versioned static assets and `no-cache` for dynamic content.',
    ],
    verification: 'Check `Cache-Control` header values in HTTP response details.',
  },

  'tech-charset': {
    summary: 'Character encoding declarations ensure text characters are rendered accurately.',
    impact: 'Prevents character corruption and text garbling across international scripts.',
    codeFix: '<head>\n  <meta charset="UTF-8">\n</head>',
    steps: [
      'Include `<meta charset="UTF-8">` near top of document `<head>`.',
      'Declare `Content-Type: text/html; charset=UTF-8` in HTTP response headers.',
    ],
    verification: 'Verify character set encoding in HTTP header or HTML `<head>` tag.',
  },

  'tech-doctype-size': {
    summary: 'Standard DOCTYPE declaration and bounded HTML document byte size.',
    impact: 'Triggers standards-compliant browser rendering mode and prevents memory bloat.',
    codeFix: '<!DOCTYPE html>\n<html lang="en">\n  <head><title>Title</title></head>\n  <body>Content</body>\n</html>',
    steps: [
      'Start document HTML string with `<!DOCTYPE html>`.',
      'Optimize HTML payload size by pruning unnecessary inline data URIs or comments.',
    ],
    verification: 'Confirm `<!DOCTYPE html>` appears on line 1 of document source code.',
  },

  // 5. Performance & Resource Scanner (6 IDs)
  'perf-blocking-scripts': {
    summary: 'Synchronous JavaScript files in `<head>` block document HTML parsing and rendering.',
    impact: 'Increases initial page render latency and delays First Contentful Paint.',
    codeFix: '<head>\n  <script src="/app.js" defer></script>\n</head>',
    steps: [
      'Add `defer` or `async` attributes to non-critical external `<script>` tags.',
      'Move non-essential scripts to document bottom before `</body>`.',
    ],
    verification: 'Inspect `<script>` tags in document head for `defer` or `async` attributes.',
  },

  'perf-stylesheets-css': {
    summary: 'External stylesheet link tags and aggregate inline CSS footprint.',
    impact: 'Excessive external CSS files delay visual page layout rendering.',
    codeFix: '<head>\n  <link rel="stylesheet" href="/styles.css">\n</head>',
    steps: [
      'Combine multiple CSS files to minimize HTTP network requests.',
      'Inline critical layout CSS and defer non-critical style sheets.',
    ],
    verification: 'Count `<link rel="stylesheet">` tags in document head.',
  },

  'perf-inline-css': {
    summary: 'Inline CSS `<style>` blocks increase HTML document payload size.',
    impact: 'Large inline style blocks delay HTML parsing and prevent stylesheet browser caching.',
    codeFix: '/* Move inline styles to external cached stylesheet */\n/* client/src/styles/app.css */\n.hero-banner { background: #0f172a; }',
    steps: [
      'Extract large inline `<style>` block content into external `.css` files.',
      'Leverage browser caching for external CSS stylesheets.',
    ],
    verification: 'Calculate aggregate byte size of inline `<style>` tags in HTML source.',
  },

  'perf-resource-hints': {
    summary: 'Resource connection hints (`preconnect`, `dns-prefetch`) optimize connection setup.',
    impact: 'Reduces DNS lookup, TCP handshake, and TLS negotiation latency for critical origins.',
    codeFix: '<head>\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="dns-prefetch" href="https://cdn.example.com">\n</head>',
    steps: [
      'Add `<link rel="preconnect" href="...">` for essential third-party asset domains.',
      'Add `<link rel="dns-prefetch" href="...">` for fallback asset hosts.',
    ],
    verification: 'Check document `<head>` for valid resource hint `<link>` declarations.',
  },

  'perf-dom-footprint': {
    summary: 'DOM element complexity and aggregate document tree node count.',
    impact: 'Excessive DOM nodes increase browser memory overhead and delay layout calculations.',
    codeFix: '<!-- Simplify deeply nested wrapper structures -->\n<div class="card">\n  <h2>Title</h2>\n  <p>Content</p>\n</div>',
    steps: [
      'Simplify deeply nested container markup wrappers.',
      'Implement virtualized lists for long repeated data collections.',
    ],
    verification: 'Audit total DOM element count in browser developer console.',
  },

  'perf-image-lazyloading': {
    summary: 'Image lazy-loading markup (`loading="lazy"`) defers offscreen image loading.',
    impact: 'Saves initial page download bandwidth and speeds up page load completion.',
    codeFix: '<img src="/photo.jpg" alt="Description" loading="lazy" width="600" height="400">',
    steps: [
      'Add `loading="lazy"` attribute to images below initial viewport scroll fold.',
      'Keep eager default loading for primary hero banner images.',
    ],
    verification: 'Check `<img>` tags in document source for `loading="lazy"` attributes.',
  },

  // 6. Accessibility Scanner (10 IDs)
  'a11y-image-alt': {
    summary: 'Image `alt` text provides textual descriptions for visually impaired screen reader users.',
    impact: 'Ensures image content is accessible to assistive technologies and display-disabled clients.',
    codeFix: '<img src="/chart.png" alt="Quarterly sales growth chart showing 15% increase" width="600" height="400">',
    steps: [
      'Add descriptive `alt="..."` attributes to informative `<img>` tags.',
      'Use empty `alt=""` for purely decorative background illustrations.',
    ],
    verification: 'Audit all `<img>` tags to confirm `alt` attributes are present.',
  },

  'a11y-iframe-title': {
    summary: 'Iframe `title` attributes describe embedded document content for assistive tools.',
    impact: 'Allows screen reader users to understand embedded iframe context before navigating.',
    codeFix: '<iframe src="/map.html" title="Interactive store location map"></iframe>',
    steps: [
      'Add `title="..."` attributes to all `<iframe>` elements.',
      'Ensure title text accurately describes embedded iframe purpose.',
    ],
    verification: 'Inspect `<iframe>` tags in document source for non-empty title attributes.',
  },

  'a11y-form-labels': {
    summary: 'Form input controls require explicit label associations for accessible screen reader operation.',
    impact: 'Enables screen readers to announce control purpose when focused by keyboard users.',
    codeFix: '<label for="user-email">Email Address</label>\n<input type="email" id="user-email" name="email">',
    steps: [
      'Associate `<label for="id">` tags with matching `<input id="id">` attributes.',
      'Alternatively use `aria-label="..."` or `aria-labelledby="..."` attributes.',
    ],
    verification: 'Verify form control focus announces correct field label in accessibility tree.',
  },

  'a11y-button-name': {
    summary: 'Buttons require accessible names via visible text, `aria-label`, or nested image `alt` text.',
    impact: 'Ensures keyboard and screen reader users can identify interactive button actions.',
    codeFix: '<button type="button" aria-label="Close dialog">\n  <svg aria-hidden="true">...</svg>\n</button>',
    steps: [
      'Provide visible text inside `<button>` elements.',
      'Add `aria-label="..."` to icon-only buttons.',
    ],
    verification: 'Check accessible name computation in browser accessibility inspector.',
  },

  'a11y-link-name': {
    summary: 'Hyperlinks require accessible text content describing link target destinations.',
    impact: 'Prevents uninformative link labels like "click here" or icon-only unlabelled links.',
    codeFix: '<a href="/report.pdf">Download Annual Financial Report (PDF)</a>',
    steps: [
      'Provide descriptive visible text inside `<a>` hyperlink elements.',
      'Add `aria-label="..."` to icon-only links.',
    ],
    verification: 'Audit hyperlink accessible names in browser developer tools.',
  },

  'a11y-aria-attributes': {
    summary: 'ARIA attributes must contain non-empty, valid values when declared.',
    impact: 'Prevents screen reader errors caused by invalid or missing ARIA references.',
    codeFix: '<div role="region" aria-label="Customer Reviews">\n  <!-- Content -->\n</div>',
    steps: [
      'Remove empty `aria-label=""` or `aria-labelledby=""` attributes.',
      'Ensure referenced element IDs exist in the DOM when using `aria-labelledby` or `aria-describedby`.',
    ],
    verification: 'Check document for empty ARIA attributes using DOM query search.',
  },

  'a11y-landmarks': {
    summary: 'Document landmark elements (`<main>`, `<nav>`, `<header>`, `<footer>`) structure page sections.',
    impact: 'Allows screen reader users to jump quickly between primary page landmark sections.',
    codeFix: '<header>Logo & Nav</header>\n<main>\n  <h1>Main Content</h1>\n</main>\n<footer>Copyright</footer>',
    steps: [
      'Wrap main page content inside a single `<main>` landmark element.',
      'Use `<nav>` for site navigation and `<footer>` for footer content.',
    ],
    verification: 'Inspect DOM tree to verify presence of standard landmark elements.',
  },

  'a11y-table-markup': {
    summary: 'Data tables require `<th>` header elements for accessible column and row reading.',
    impact: 'Enables screen readers to announce table header context as users navigate cells.',
    codeFix: '<table>\n  <thead>\n    <tr><th scope="col">Product</th><th scope="col">Price</th></tr>\n  </thead>\n  <tbody>...</tbody>\n</table>',
    steps: [
      'Use `<th>` header cells for data table columns and rows.',
      'Include `scope="col"` or `scope="row"` attributes on header cells.',
    ],
    verification: 'Check `<table>` elements for header cell markup.',
  },

  'a11y-tabindex-positive': {
    summary: 'Positive `tabindex` values (`tabindex > 0`) disrupt natural document keyboard focus order.',
    impact: 'Causes unpredictable focus jumps for keyboard navigation users.',
    codeFix: '<!-- Use semantic focusable elements or tabindex="0" -->\n<button type="button">Click Me</button>',
    steps: [
      'Remove positive `tabindex="1"` (or higher) attributes from DOM elements.',
      'Rely on natural document DOM order for keyboard navigation.',
    ],
    verification: 'Search document source for `tabindex` attributes with positive integer values.',
  },

  'a11y-html-lang': {
    summary: 'Document `<html>` tag requires a valid `lang` attribute.',
    impact: 'Allows screen readers to select correct voice synthesis and pronunciation rules.',
    codeFix: '<html lang="en">\n  <head><title>Title</title></head>\n  <body>Content</body>\n</html>',
    steps: [
      'Add `lang="en"` (or appropriate language code) to the `<html>` root element.',
    ],
    verification: 'Check `<html>` tag in document source for `lang` attribute.',
  },

  // 7. Mobile Responsiveness Scanner (5 IDs)
  'mobile-viewport-zoom': {
    summary: 'Viewport zoom restrictions (`user-scalable=no`, `maximum-scale=1.0`) block user zoom.',
    impact: 'Prevents visually impaired visitors from zooming page text on mobile screens.',
    codeFix: '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>',
    steps: [
      'Remove `user-scalable=no` from viewport meta tag content.',
      'Remove `maximum-scale=1.0` parameters to allow user pinch-to-zoom.',
    ],
    verification: 'Check viewport meta content string to ensure zoom restrictions are absent.',
  },

  'mobile-input-types': {
    summary: 'Specialized HTML5 input types (`tel`, `email`, `number`, `url`) trigger tailored mobile touch keyboards.',
    impact: 'Improves mobile data entry speed and reduces user input typing errors.',
    codeFix: '<input type="tel" name="phone" autocomplete="tel">\n<input type="email" name="email" autocomplete="email">',
    steps: [
      'Use specialized input types (`type="email"`, `type="tel"`, `type="number"`) on form fields.',
    ],
    verification: 'Test form input focus on mobile devices to verify keyboard layout.',
  },

  'mobile-inputmode': {
    summary: 'Virtual keyboard `inputmode` hints optimize mobile touch keyboard keypads.',
    impact: 'Presents specialized numeric or decimal keypads for specialized form fields.',
    codeFix: '<input type="text" inputmode="numeric" pattern="[0-9]*" name="pin">',
    steps: [
      'Add `inputmode="numeric"` or `inputmode="decimal"` attributes to numeric entry fields.',
    ],
    verification: 'Check form input tags for `inputmode` attribute declarations.',
  },

  'mobile-autocomplete': {
    summary: 'Form `autocomplete` attributes support mobile browser auto-fill capabilities.',
    impact: 'Speeds up mobile form completion for addresses, names, and credentials.',
    codeFix: '<input type="text" name="name" autocomplete="name">\n<input type="email" name="email" autocomplete="email">',
    steps: [
      'Add standard `autocomplete` tokens (`name`, `email`, `street-address`) to form fields.',
    ],
    verification: 'Check form field attributes for valid `autocomplete` token values.',
  },

  'mobile-meta-tags': {
    summary: 'Mobile browser presentation metadata (`theme-color`, `apple-mobile-web-app-capable`).',
    impact: 'Customizes browser address bar theme coloring and web app display modes.',
    codeFix: '<head>\n  <meta name="theme-color" content="#0f172a">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n</head>',
    steps: [
      'Add `<meta name="theme-color" content="...">` matching brand primary surface colors.',
    ],
    verification: 'Inspect document `<head>` for mobile presentation meta tags.',
  },

  // 8. Content Quality Scanner (10 IDs)
  'content-empty-page': {
    summary: 'Document body contains zero visible text content.',
    impact: 'Prevents search crawlers and human visitors from reading page content.',
    codeFix: '<body>\n  <main>\n    <h1>Page Title</h1>\n    <p>Descriptive body content goes here.</p>\n  </main>\n</body>',
    steps: [
      'Ensure document `<body>` contains semantic HTML text content.',
      'Verify server-side rendering delivers initial text content before client JavaScript execution.',
    ],
    verification: 'Fetch document source and verify body text content length.',
  },

  'content-low-volume': {
    summary: 'Document body contains low visible text volume (under 50 words).',
    impact: 'May be flagged as low-quality or thin content by search engine indexing crawlers.',
    codeFix: '<main>\n  <h1>Comprehensive Topic Coverage</h1>\n  <p>Expand page copy to provide thorough explanations and contextual details for visitors.</p>\n</main>',
    steps: [
      'Expand page text content to provide sufficient topic coverage.',
      'Include relevant section headings, explanatory paragraphs, and content details.',
    ],
    verification: 'Count visible body words to verify word volume surpasses 50 words.',
  },

  'content-word-count': {
    summary: 'Document contains sufficient visible body text content volume.',
    impact: 'Provides adequate context for visitors and search engine indexing engines.',
    codeFix: '<!-- Maintain informative, well-structured text content -->',
    steps: [
      'Maintain well-structured text paragraphs and topic sections.',
    ],
    verification: 'Confirm body text content volume meets site quality standards.',
  },

  'content-duplicate-paragraphs': {
    summary: 'Repeated block text patterns appearing 3 or more times across document block elements.',
    impact: 'Creates redundant content bloat and lowers document quality signals.',
    codeFix: '<!-- Reusable components or consolidated layout section -->\n<div class="feature-summary">\n  <p>Consolidated unique overview text.</p>\n</div>',
    steps: [
      'Review repeated content blocks and consolidate redundant copy.',
      'Modularize layout component text to eliminate duplicate paragraph blocks.',
    ],
    verification: 'Audit block element text content for repeated string patterns.',
  },

  'content-document-structure': {
    summary: 'Document structural tag completeness (`<html>`, `<head>`, `<body>`).',
    impact: 'Ensures standard HTML document parsing and prevents browser quirks mode rendering.',
    codeFix: '<!DOCTYPE html>\n<html lang="en">\n  <head><title>Title</title></head>\n  <body>Content</body>\n</html>',
    steps: [
      'Ensure document source includes foundational `<html>`, `<head>`, and `<body>` elements.',
    ],
    verification: 'Inspect document source code to verify structural tag wrapper completeness.',
  },

  'content-duplicate-ids': {
    summary: 'Duplicate element ID attributes detected in document markup.',
    impact: 'Breaks unique DOM element identification, invalidates ARIA labels, and breaks JS selectors.',
    codeFix: '<!-- Ensure unique id attributes -->\n<div id="section-header-1">Header 1</div>\n<div id="section-header-2">Header 2</div>',
    steps: [
      'Ensure every `id` attribute value in the document is unique.',
      'Replace duplicate ID attributes with class names or unique string identifiers.',
    ],
    verification: 'Query DOM for duplicate `id` attribute values.',
  },

  'content-link-classification': {
    summary: 'Document link structure and categorization (internal, external, anchor, mailto, tel).',
    impact: 'Ensures clear navigation pathways and descriptive link targets.',
    codeFix: '<a href="/about">Internal Page</a>\n<a href="https://external.org" rel="noopener">External Target</a>',
    steps: [
      'Review link target categorization and ensure appropriate navigation structure.',
      'Add `rel="noopener noreferrer"` to external links.',
    ],
    verification: 'Audit document hyperlinks and target origin classification.',
  },

  'content-href-markup': {
    summary: 'Empty or placeholder link `href` attributes (`href=""`, `href="#"`, `javascript:`).',
    impact: 'Causes unexpected scroll-to-top jumps or broken link navigation for users.',
    codeFix: '<!-- Use semantic button for actions or valid URL for navigation -->\n<button type="button" onclick="handleAction()">Action</button>\n<a href="/destination">Destination</a>',
    steps: [
      'Replace placeholder `href="#"` or `javascript:void(0)` links with semantic `<button>` elements.',
      'Provide valid destination URLs for hyperlinked elements.',
    ],
    verification: 'Search document source for empty or placeholder `href` attribute values.',
  },

  'content-src-markup': {
    summary: 'Resource elements (`img`, `iframe`, `script`, `audio`, `video`) with missing or empty `src`.',
    impact: 'Triggers broken image placeholders or redundant HTTP GET requests to current page URL.',
    codeFix: '<img src="/assets/hero.jpg" alt="Hero banner">\n<script src="/js/app.js"></script>',
    steps: [
      'Provide valid non-empty `src` attributes for all media and script elements.',
    ],
    verification: 'Check resource tags for missing or empty `src` attributes.',
  },

  'content-image-dimensions': {
    summary: 'Image elements missing valid explicit positive integer `width` and `height` attributes.',
    impact: 'Causes layout instability (Cumulative Layout Shift) as images load into view.',
    codeFix: '<img src="/banner.jpg" alt="Banner" width="1200" height="400">',
    steps: [
      'Specify positive integer `width` and `height` attributes on all `<img>` tags.',
      'Allow CSS to handle responsive scaling while reserving aspect ratio space.',
    ],
    verification: 'Inspect `<img>` tags for numeric `width` and `height` attribute values.',
  },
};

/**
 * Validate every raw registry entry against Zod schema at module load time.
 */
const remediationRegistry = {};
for (const [id, data] of Object.entries(rawRegistry)) {
  remediationRegistry[id] = remediationSchema.parse(data);
}

module.exports = {
  remediationSchema,
  remediationRegistry,
};
