const htmlparser2 = require('htmlparser2');

/**
 * Normalizes a URL for comparison without network calls.
 * Strips default ports (80/443), lowercases hostname, normalizes trailing slash.
 * @param {string} rawUrl 
 * @param {string} baseUrl 
 * @returns {string|null}
 */
function normalizeUrlForComparison(rawUrl, baseUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim(), baseUrl);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    
    let port = parsed.port;
    if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
      port = '';
    }

    const host = port ? `${hostname}:${port}` : hostname;
    let pathname = parsed.pathname || '/';
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${protocol}//${host}${pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

/**
 * SEO Analyzer
 * Inspects parsed HTML document for SEO metadata, canonical links, heading structures, and social tags.
 *
 * @param {string} html Raw HTML content
 * @param {string} finalUrl Scanned page URL
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzeSeo(html, finalUrl) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML content must be a string');
  }

  let title = null;
  let description = null;
  let canonicalHref = null;
  let metaRobots = null;
  let viewportContent = null;
  let ogTitle = null;
  let ogDescription = null;
  let ogImage = null;

  let inTitle = false;
  let titleBuffer = '';

  const headings = []; // { level, text }
  let currentHeadingLevel = null;
  let currentHeadingBuffer = '';

  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        const tagName = name.toLowerCase();

        if (tagName === 'title') {
          inTitle = true;
          titleBuffer = '';
        }

        if (/^h[1-6]$/.test(tagName)) {
          currentHeadingLevel = parseInt(tagName.charAt(1), 10);
          currentHeadingBuffer = '';
        }

        if (tagName === 'link') {
          const rel = (attribs.rel || '').toLowerCase();
          if (rel === 'canonical' && attribs.href) {
            canonicalHref = attribs.href.trim();
          }
        }

        if (tagName === 'meta') {
          const nameAttr = (attribs.name || '').toLowerCase();
          const propAttr = (attribs.property || '').toLowerCase();
          const content = (attribs.content || '').trim();

          if ((nameAttr === 'description' || propAttr === 'description') && !description && content) {
            description = content;
          }

          if ((nameAttr === 'robots' || nameAttr === 'googlebot') && !metaRobots && content) {
            metaRobots = content;
          }

          if (nameAttr === 'viewport' && !viewportContent && content) {
            viewportContent = content;
          }

          if ((propAttr === 'og:title' || nameAttr === 'og:title') && content) {
            ogTitle = content;
          }

          if ((propAttr === 'og:description' || nameAttr === 'og:description') && content) {
            ogDescription = content;
          }

          if ((propAttr === 'og:image' || nameAttr === 'og:image') && content) {
            ogImage = content;
          }
        }
      },

      ontext(text) {
        if (inTitle) {
          titleBuffer += text;
        }
        if (currentHeadingLevel !== null) {
          currentHeadingBuffer += text;
        }
      },

      onclosetag(name) {
        const tagName = name.toLowerCase();
        if (tagName === 'title') {
          inTitle = false;
          if (titleBuffer.trim()) {
            title = titleBuffer.trim();
          }
        }

        if (/^h[1-6]$/.test(tagName)) {
          if (currentHeadingLevel !== null) {
            headings.push({
              level: currentHeadingLevel,
              text: currentHeadingBuffer.trim(),
            });
            currentHeadingLevel = null;
            currentHeadingBuffer = '';
          }
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  const findings = [];

  // 1. Title Tag Check
  if (!title) {
    findings.push({
      id: 'seo-title',
      category: 'seo',
      status: 'warn',
      severity: 'medium',
      title: 'Page Title Missing',
      message: 'Page title tag is missing or empty.',
      value: null,
      recommendation: 'Add a concise, descriptive <title> tag (30-60 characters) to optimize search engine display.',
    });
  } else {
    const titleLen = title.length;
    if (titleLen >= 30 && titleLen <= 60) {
      findings.push({
        id: 'seo-title',
        category: 'seo',
        status: 'pass',
        severity: 'info',
        title: 'Page Title',
        message: `Page title is well-structured (${titleLen} characters).`,
        value: title,
        recommendation: 'Maintain optimal title length (30-60 characters).',
      });
    } else {
      findings.push({
        id: 'seo-title',
        category: 'seo',
        status: 'info',
        severity: 'info',
        title: 'Page Title Length',
        message: `Page title length (${titleLen} characters) is outside the recommended range (30-60 characters).`,
        value: title,
        recommendation: 'Consider adjusting title length to between 30 and 60 characters for search engine snippets.',
      });
    }
  }

  // 2. Meta Description Check
  if (!description) {
    findings.push({
      id: 'seo-meta-description',
      category: 'seo',
      status: 'warn',
      severity: 'medium',
      title: 'Meta Description Missing',
      message: 'Meta description is missing.',
      value: null,
      recommendation: 'Add a concise <meta name="description"> tag (50-160 characters) summarizing page content.',
    });
  } else {
    const descLen = description.length;
    if (descLen >= 50 && descLen <= 160) {
      findings.push({
        id: 'seo-meta-description',
        category: 'seo',
        status: 'pass',
        severity: 'info',
        title: 'Meta Description',
        message: `Meta description is well-structured (${descLen} characters).`,
        value: description,
        recommendation: 'Maintain concise meta description content.',
      });
    } else {
      findings.push({
        id: 'seo-meta-description',
        category: 'seo',
        status: 'info',
        severity: 'info',
        title: 'Meta Description Length',
        message: `Meta description length (${descLen} characters) is outside the recommended range (50-160 characters).`,
        value: description,
        recommendation: 'Consider adjusting meta description length to between 50 and 160 characters.',
      });
    }
  }

  // 3. Canonical URL Check
  if (!canonicalHref) {
    findings.push({
      id: 'seo-canonical',
      category: 'seo',
      status: 'info',
      severity: 'info',
      title: 'Canonical URL',
      message: 'No canonical link tag found on the page.',
      value: null,
      recommendation: 'Specify a <link rel="canonical" href="..."> tag to prevent duplicate content issues.',
    });
  } else {
    const normCanonical = normalizeUrlForComparison(canonicalHref, finalUrl);
    const normFinal = normalizeUrlForComparison(finalUrl, finalUrl);

    if (normCanonical && normFinal && normCanonical === normFinal) {
      findings.push({
        id: 'seo-canonical',
        category: 'seo',
        status: 'pass',
        severity: 'info',
        title: 'Canonical URL',
        message: 'Canonical URL is explicitly declared and matches the scanned page URL.',
        value: canonicalHref,
        recommendation: 'Keep canonical tag aligned with the primary page URL.',
      });
    } else {
      findings.push({
        id: 'seo-canonical',
        category: 'seo',
        status: 'warn',
        severity: 'low',
        title: 'Canonical URL Mismatch',
        message: `Canonical URL (${canonicalHref}) does not match the scanned page URL (${finalUrl}).`,
        value: canonicalHref,
        recommendation: 'Ensure the canonical URL points to the authoritative version of this page.',
      });
    }
  }

  // 4. Meta Robots Check
  if (!metaRobots) {
    findings.push({
      id: 'seo-meta-robots',
      category: 'seo',
      status: 'info',
      severity: 'info',
      title: 'Meta Robots Tag',
      message: 'No meta robots tag found (defaults to index, follow).',
      value: null,
      recommendation: 'Specify <meta name="robots" content="index, follow"> if explicit indexing instructions are needed.',
    });
  } else {
    const lowerRobots = metaRobots.toLowerCase();
    if (lowerRobots.includes('noindex') || lowerRobots.includes('nofollow')) {
      findings.push({
        id: 'seo-meta-robots',
        category: 'seo',
        status: 'info',
        severity: 'info',
        title: 'Meta Robots Directive',
        message: `Meta robots directive restricts indexing or link tracking (${metaRobots}).`,
        value: metaRobots,
        recommendation: 'Ensure indexing restrictions (noindex/nofollow) are intentional.',
      });
    } else {
      findings.push({
        id: 'seo-meta-robots',
        category: 'seo',
        status: 'pass',
        severity: 'info',
        title: 'Meta Robots Tag',
        message: `Meta robots directive permits indexing (${metaRobots}).`,
        value: metaRobots,
        recommendation: 'Maintain appropriate search index accessibility.',
      });
    }
  }

  // 5. Viewport Tag Check
  if (!viewportContent) {
    findings.push({
      id: 'seo-viewport',
      category: 'seo',
      status: 'warn',
      severity: 'medium',
      title: 'Viewport Tag Missing',
      message: 'Viewport meta tag is missing, which may impact mobile responsiveness.',
      value: null,
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for mobile optimization.',
    });
  } else {
    const lowerVP = viewportContent.toLowerCase();
    if (lowerVP.includes('width=') || lowerVP.includes('initial-scale=')) {
      findings.push({
        id: 'seo-viewport',
        category: 'seo',
        status: 'pass',
        severity: 'info',
        title: 'Viewport Tag',
        message: 'Viewport meta tag is configured for mobile responsiveness.',
        value: viewportContent,
        recommendation: 'Maintain valid viewport parameters for mobile responsiveness.',
      });
    } else {
      findings.push({
        id: 'seo-viewport',
        category: 'seo',
        status: 'info',
        severity: 'info',
        title: 'Viewport Tag Configuration',
        message: 'Viewport meta tag is present.',
        value: viewportContent,
        recommendation: 'Ensure viewport content includes width=device-width and initial-scale=1.0.',
      });
    }
  }

  // 6. Headings Structure Checks
  const h1Headings = headings.filter((h) => h.level === 1);
  const h1Count = h1Headings.length;

  if (h1Count === 1) {
    findings.push({
      id: 'seo-heading-h1',
      category: 'seo',
      status: 'pass',
      severity: 'info',
      title: 'H1 Heading',
      message: 'Page contains exactly one H1 heading.',
      value: h1Headings[0].text,
      recommendation: 'Maintain a single main H1 heading per page.',
    });
  } else if (h1Count === 0) {
    findings.push({
      id: 'seo-heading-h1',
      category: 'seo',
      status: 'warn',
      severity: 'medium',
      title: 'H1 Heading Missing',
      message: 'Page has no H1 heading.',
      value: 0,
      recommendation: 'Add an H1 heading representing the primary topic of the page.',
    });
  } else {
    findings.push({
      id: 'seo-heading-h1',
      category: 'seo',
      status: 'info',
      severity: 'info',
      title: 'Multiple H1 Headings',
      message: `Page contains ${h1Count} H1 headings.`,
      value: h1Count,
      recommendation: 'Consider consolidating main topics into a single top-level H1 heading.',
    });
  }

  // Hierarchy jump check
  let hasHierarchyJump = false;
  for (let i = 0; i < headings.length - 1; i++) {
    const currentLvl = headings[i].level;
    const nextLvl = headings[i + 1].level;
    if (nextLvl > currentLvl + 1) {
      hasHierarchyJump = true;
      break;
    }
  }

  const headingSummaryStr = `H1: ${h1Count}, H2: ${headings.filter((h) => h.level === 2).length}, H3: ${headings.filter((h) => h.level === 3).length}`;

  if (hasHierarchyJump) {
    findings.push({
      id: 'seo-heading-hierarchy',
      category: 'seo',
      status: 'info',
      severity: 'info',
      title: 'Heading Hierarchy Jump',
      message: 'Heading levels skip steps in hierarchy (e.g. H1 directly to H3).',
      value: headingSummaryStr,
      recommendation: 'Maintain sequential heading levels (H1 -> H2 -> H3) for clear document structure.',
    });
  } else {
    findings.push({
      id: 'seo-heading-hierarchy',
      category: 'seo',
      status: 'pass',
      severity: 'info',
      title: 'Heading Hierarchy',
      message: 'Heading levels follow a logical sequential hierarchy.',
      value: headingSummaryStr,
      recommendation: 'Maintain sequential heading structure across content sections.',
    });
  }

  // 7. Open Graph Check
  if (ogTitle && ogDescription && ogImage) {
    findings.push({
      id: 'seo-opengraph',
      category: 'seo',
      status: 'pass',
      severity: 'info',
      title: 'Open Graph Tags',
      message: 'Open Graph metadata (title, description, image) is complete.',
      value: { ogTitle, ogDescription, ogImage },
      recommendation: 'Maintain complete Open Graph meta tags for social sharing preview quality.',
    });
  } else {
    findings.push({
      id: 'seo-opengraph',
      category: 'seo',
      status: 'info',
      severity: 'info',
      title: 'Open Graph Tags',
      message: 'Some Open Graph tags are missing.',
      value: {
        ogTitlePresent: !!ogTitle,
        ogDescriptionPresent: !!ogDescription,
        ogImagePresent: !!ogImage,
      },
      recommendation: 'Add og:title, og:description, and og:image tags for rich social media previews.',
    });
  }

  const summary = {
    pass: findings.filter((f) => f.status === 'pass').length,
    warn: findings.filter((f) => f.status === 'warn').length,
    fail: findings.filter((f) => f.status === 'fail').length,
    info: findings.filter((f) => f.status === 'info').length,
  };

  return { summary, findings };
}

module.exports = {
  analyzeSeo,
  normalizeUrlForComparison,
};
