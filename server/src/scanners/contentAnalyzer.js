const htmlparser2 = require('htmlparser2');

/**
 * Passive Content & Technical HTML Quality Analyzer (M7)
 * Single-pass inspection of already-fetched, already-bounded HTML document using htmlparser2.
 * Evaluates visible body text volume, duplicate block text, HTML structural tags,
 * duplicate element IDs, link classification/markup, resource src validity, and image dimensions.
 *
 * Performs ZERO secondary network requests.
 *
 * @param {string} html Raw HTML response body
 * @param {object} [fetchResult] Fetch result containing targetUrl/finalUrl
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzeContent(html = '', fetchResult = {}) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML content must be a string');
  }

  const baseUrl = (fetchResult && (fetchResult.finalUrl || fetchResult.targetUrl)) || '';
  let baseOrigin = '';
  if (baseUrl) {
    try {
      baseOrigin = new URL(baseUrl).origin;
    } catch {
      baseOrigin = '';
    }
  }

  // Traversal state
  let hasHtmlTag = false;
  let hasHeadTag = false;
  let hasBodyTag = false;

  let inBody = false;
  const tagStack = [];
  const IGNORED_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'template', 'svg']);
  const QUALIFYING_BLOCKS = new Set(['p', 'div', 'li', 'article', 'section']);

  const bodyTextChunks = [];

  // ID tracking for duplicates
  const idMap = new Map();

  // Link classification tracking
  let totalLinks = 0;
  let internalLinks = 0;
  let externalLinks = 0;
  let anchorLinks = 0;
  let mailtoLinks = 0;
  let telLinks = 0;
  let javascriptLinks = 0;
  let emptyOrPlaceholderLinks = 0;

  // Resource src tracking
  let invalidSrcCount = 0;
  let totalResourceElements = 0;

  // Image dimension tracking
  let totalImages = 0;
  let imagesWithValidDimensions = 0;
  let imagesMissingOrInvalidDimensions = 0;

  // Stack for block candidate tracking for duplicate paragraph detection
  // Each entry: { tag, directChunks: [], childBlockTexts: [] }
  const blockStack = [];
  const blockCandidates = [];

  function hasIgnoredAncestor() {
    for (let i = tagStack.length - 1; i >= 0; i--) {
      if (IGNORED_TEXT_TAGS.has(tagStack[i])) {
        return true;
      }
    }
    return false;
  }

  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        const tagName = name.toLowerCase();
        tagStack.push(tagName);

        if (tagName === 'html') hasHtmlTag = true;
        if (tagName === 'head') hasHeadTag = true;
        if (tagName === 'body') {
          hasBodyTag = true;
          inBody = true;
        }

        // Duplicate ID check
        if (attribs.id) {
          const idVal = attribs.id.trim();
          if (idVal) {
            idMap.set(idVal, (idMap.get(idVal) || 0) + 1);
          }
        }

        // Duplicate paragraph block stack tracking
        if (inBody && QUALIFYING_BLOCKS.has(tagName) && !hasIgnoredAncestor()) {
          blockStack.push({
            tag: tagName,
            directChunks: [],
          });
        }

        // Link classification
        if (tagName === 'a') {
          if (Object.prototype.hasOwnProperty.call(attribs, 'href')) {
            totalLinks++;
            const rawHref = attribs.href;
            const trimmedHref = rawHref.trim();
            const lowerHref = trimmedHref.toLowerCase();

            if (
              trimmedHref === '' ||
              trimmedHref === '#' ||
              lowerHref.startsWith('javascript:')
            ) {
              emptyOrPlaceholderLinks++;
              if (lowerHref.startsWith('javascript:')) {
                javascriptLinks++;
              }
            } else if (lowerHref.startsWith('mailto:')) {
              mailtoLinks++;
            } else if (lowerHref.startsWith('tel:')) {
              telLinks++;
            } else if (trimmedHref.startsWith('#')) {
              anchorLinks++;
            } else {
              try {
                const parsedUrl = new URL(trimmedHref, baseOrigin || 'http://localhost');
                if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                  if (baseOrigin && parsedUrl.origin === baseOrigin) {
                    internalLinks++;
                  } else if (baseOrigin) {
                    externalLinks++;
                  } else {
                    // No base origin available; if absolute scheme present consider external, otherwise internal
                    if (/^https?:\/\//i.test(trimmedHref)) {
                      externalLinks++;
                    } else {
                      internalLinks++;
                    }
                  }
                } else {
                  emptyOrPlaceholderLinks++;
                }
              } catch {
                emptyOrPlaceholderLinks++;
              }
            }
          }
        }

        // Resource src markup validity (img, iframe, script, audio, video)
        if (['img', 'iframe', 'script', 'audio', 'video'].includes(tagName)) {
          // Note: script tag without src attribute is normal inline script, not a missing src resource
          if (tagName === 'script') {
            if (Object.prototype.hasOwnProperty.call(attribs, 'src')) {
              totalResourceElements++;
              const srcVal = attribs.src.trim().toLowerCase();
              if (
                !srcVal ||
                srcVal === '#' ||
                srcVal === 'about:blank' ||
                srcVal.startsWith('javascript:')
              ) {
                invalidSrcCount++;
              }
            }
          } else {
            totalResourceElements++;
            if (!Object.prototype.hasOwnProperty.call(attribs, 'src')) {
              invalidSrcCount++;
            } else {
              const srcVal = attribs.src.trim().toLowerCase();
              if (
                !srcVal ||
                srcVal === '#' ||
                srcVal === 'about:blank' ||
                srcVal.startsWith('javascript:')
              ) {
                invalidSrcCount++;
              }
            }
          }
        }

        // Image dimensions check
        if (tagName === 'img') {
          totalImages++;
          const widthAttr = attribs.width ? attribs.width.trim() : null;
          const heightAttr = attribs.height ? attribs.height.trim() : null;

          const isValidWidth = widthAttr !== null && /^\d+$/.test(widthAttr) && parseInt(widthAttr, 10) > 0;
          const isValidHeight = heightAttr !== null && /^\d+$/.test(heightAttr) && parseInt(heightAttr, 10) > 0;

          if (isValidWidth && isValidHeight) {
            imagesWithValidDimensions++;
          } else {
            imagesMissingOrInvalidDimensions++;
          }
        }
      },

      ontext(text) {
        if (inBody && !hasIgnoredAncestor()) {
          bodyTextChunks.push(text);

          if (blockStack.length > 0) {
            const topBlock = blockStack[blockStack.length - 1];
            topBlock.directChunks.push(text);
          }
        }
      },

      onclosetag(name) {
        const tagName = name.toLowerCase();

        if (tagName === 'body') {
          inBody = false;
        }

        // Pop block stack if matching
        if (inBody && QUALIFYING_BLOCKS.has(tagName) && !hasIgnoredAncestor() && blockStack.length > 0) {
          if (blockStack[blockStack.length - 1].tag === tagName) {
            const block = blockStack.pop();
            const directText = block.directChunks.join(' ').replace(/\s+/g, ' ').trim();
            const directWords = directText ? directText.split(/\s+/).length : 0;

            // Qualification for duplicate paragraph candidate:
            // Must have direct text >= 8 words.
            // FALSE POSITIVE PREVENTION: Ancestor wrapper elements without direct text of their own
            // (directWords < 8) are excluded so child block elements are not double-counted.
            if (directWords >= 8) {
              blockCandidates.push(directText);
            }
          }
        }

        tagStack.pop();
      },
    },
    { decodeEntities: true, lowerCaseAttributeNames: true, lowerCaseTags: true }
  );

  parser.write(html);
  parser.end();

  // Aggregate findings & summaries
  const findings = [];
  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };

  function addFinding(finding) {
    findings.push(finding);
    if (summary[finding.status] !== undefined) {
      summary[finding.status]++;
    }
  }

  // 1. Text Volume Analysis (Word & Code-point Character Count)
  const normalizedBodyText = bodyTextChunks.join(' ').replace(/\s+/g, ' ').trim();
  const charCount = Array.from(normalizedBodyText).length;
  const wordCount = normalizedBodyText ? normalizedBodyText.split(/\s+/).length : 0;

  if (wordCount === 0) {
    addFinding({
      id: 'content-empty-page',
      category: 'content',
      status: 'warn',
      severity: 'medium',
      title: 'Empty Page / No Visible Text',
      message: 'No visible text content detected in document body.',
      value: { wordCount: 0, charCount: 0 },
      recommendation: 'Ensure page body contains meaningful, accessible HTML text content.',
    });
  } else if (wordCount < 50) {
    addFinding({
      id: 'content-low-volume',
      category: 'content',
      status: 'warn',
      severity: 'low',
      title: 'Low Text Content Volume',
      message: `Document contains low visible text volume (${wordCount} words, ${charCount} characters).`,
      value: { wordCount, charCount },
      recommendation: 'Consider expanding page body content to provide sufficient context for visitors and search crawlers.',
    });
  } else {
    addFinding({
      id: 'content-word-count',
      category: 'content',
      status: 'pass',
      severity: 'info',
      title: 'Sufficient Text Content Volume',
      message: `Document contains ${wordCount} words and ${charCount} visible text characters.`,
      value: { wordCount, charCount },
      recommendation: 'Maintain well-structured, informative body text.',
    });
  }

  // 2. Duplicate Block-Text Detection (>= 8 words, repeated >= 3 times)
  const blockFrequencyMap = new Map();
  for (const text of blockCandidates) {
    blockFrequencyMap.set(text, (blockFrequencyMap.get(text) || 0) + 1);
  }

  let duplicateParagraphCount = 0;
  for (const [, count] of blockFrequencyMap) {
    if (count >= 3) {
      duplicateParagraphCount++;
    }
  }

  if (duplicateParagraphCount > 0) {
    addFinding({
      id: 'content-duplicate-paragraphs',
      category: 'content',
      status: 'warn',
      severity: 'low',
      title: 'Duplicate Block Text Detected',
      message: `Detected ${duplicateParagraphCount} repeated text block pattern(s) appearing 3 or more times.`,
      value: { duplicateBlockPatterns: duplicateParagraphCount },
      recommendation: 'Review repeated content blocks and consider consolidating or modularizing layout text.',
    });
  }

  // 3. Document Structure 3-State Evaluation
  const missingTags = [];
  if (!hasHtmlTag) missingTags.push('<html>');
  if (!hasHeadTag) missingTags.push('<head>');
  if (!hasBodyTag) missingTags.push('<body>');

  if (missingTags.length === 0) {
    addFinding({
      id: 'content-document-structure',
      category: 'content',
      status: 'pass',
      severity: 'info',
      title: 'Complete Document Structure',
      message: 'Document structure is complete with <html>, <head>, and <body> elements.',
      value: { hasHtmlTag: true, hasHeadTag: true, hasBodyTag: true },
      recommendation: 'Maintain standard structural markup wrapper tags.',
    });
  } else {
    addFinding({
      id: 'content-document-structure',
      category: 'content',
      status: 'warn',
      severity: 'medium',
      title: 'Incomplete Document Structure',
      message: `Missing required HTML structural tags: ${missingTags.join(', ')}.`,
      value: { missingTags, hasHtmlTag, hasHeadTag, hasBodyTag },
      recommendation: 'Ensure document includes foundational <html>, <head>, and <body> structural elements.',
    });
  }

  // 4. Duplicate Element IDs
  const duplicateIdEntries = Array.from(idMap.entries()).filter(([, count]) => count > 1);
  const duplicateIdStrings = duplicateIdEntries.map(([id]) => id);
  const totalDuplicateIds = duplicateIdStrings.length;

  if (totalDuplicateIds === 0) {
    addFinding({
      id: 'content-duplicate-ids',
      category: 'content',
      status: 'pass',
      severity: 'info',
      title: 'Unique Element IDs',
      message: 'No duplicate element IDs found.',
      value: { totalDuplicates: 0, duplicateIds: [] },
      recommendation: 'Maintain unique ID attributes across all document elements.',
    });
  } else {
    const boundedDuplicateIds = duplicateIdStrings.slice(0, 10);
    const hasMoreDuplicates = totalDuplicateIds > 10;
    addFinding({
      id: 'content-duplicate-ids',
      category: 'content',
      status: 'warn',
      severity: 'medium',
      title: 'Duplicate Element IDs Detected',
      message: `Detected ${totalDuplicateIds} duplicate element ID(s) in document markup.`,
      value: {
        totalDuplicates: totalDuplicateIds,
        duplicateIds: boundedDuplicateIds,
        hasMoreDuplicates,
      },
      recommendation: 'Ensure each id attribute value is unique within the document to prevent invalid DOM selectors and accessibility issues.',
    });
  }

  // 5. Link Classification & Href Markup
  addFinding({
    id: 'content-link-classification',
    category: 'content',
    status: totalLinks > 0 ? 'pass' : 'info',
    severity: 'info',
    title: 'Link Structure & Classification',
    message: `Document contains ${totalLinks} total link(s) (${internalLinks} internal, ${externalLinks} external, ${anchorLinks} anchor, ${mailtoLinks} mailto, ${telLinks} tel).`,
    value: {
      totalLinks,
      internalLinks,
      externalLinks,
      anchorLinks,
      mailtoLinks,
      telLinks,
      javascriptLinks,
      emptyOrPlaceholderLinks,
    },
    recommendation: 'Ensure link targets are descriptive and properly categorized.',
  });

  // 6. Href Markup Quality Thresholds (0 = pass, 1-2 = info, 3+ = warn)
  if (emptyOrPlaceholderLinks === 0) {
    addFinding({
      id: 'content-href-markup',
      category: 'content',
      status: 'pass',
      severity: 'info',
      title: 'Valid Link Href Attributes',
      message: 'No empty or placeholder link href attributes detected.',
      value: { emptyOrPlaceholderLinks: 0 },
      recommendation: 'Maintain valid destination targets for all hyperlinked elements.',
    });
  } else if (emptyOrPlaceholderLinks <= 2) {
    addFinding({
      id: 'content-href-markup',
      category: 'content',
      status: 'info',
      severity: 'info',
      title: 'Minor Empty/Placeholder Href Attributes',
      message: `Detected ${emptyOrPlaceholderLinks} empty or placeholder link href attribute(s).`,
      value: { emptyOrPlaceholderLinks },
      recommendation: 'Replace placeholder href attributes with actual functional URLs or button elements.',
    });
  } else {
    addFinding({
      id: 'content-href-markup',
      category: 'content',
      status: 'warn',
      severity: 'low',
      title: 'Empty/Placeholder Href Attributes',
      message: `Detected ${emptyOrPlaceholderLinks} empty or placeholder link href attributes.`,
      value: { emptyOrPlaceholderLinks },
      recommendation: 'Replace empty or javascript: placeholder links with semantic buttons or valid destination URLs.',
    });
  }

  // 7. Resource src Markup Validity
  if (invalidSrcCount === 0) {
    addFinding({
      id: 'content-src-markup',
      category: 'content',
      status: 'pass',
      severity: 'info',
      title: 'Valid Resource Src Attributes',
      message: 'All resource elements (img, iframe, script, audio, video) specify valid src attributes.',
      value: { totalResourceElements, invalidSrcCount: 0 },
      recommendation: 'Ensure all media and script resources specify non-empty source attributes.',
    });
  } else {
    addFinding({
      id: 'content-src-markup',
      category: 'content',
      status: 'warn',
      severity: 'low',
      title: 'Invalid Resource Src Attributes',
      message: `Detected ${invalidSrcCount} resource element(s) with missing, empty, or placeholder src attributes.`,
      value: { totalResourceElements, invalidSrcCount },
      recommendation: 'Provide valid src URL attributes for all embedded images, scripts, and media resources.',
    });
  }

  // 8. Image Dimensional Hints
  if (totalImages === 0) {
    addFinding({
      id: 'content-image-dimensions',
      category: 'content',
      status: 'info',
      severity: 'info',
      title: 'Image Dimensional Attributes',
      message: 'No images found in document.',
      value: { totalImages: 0, imagesWithValidDimensions: 0, imagesMissingOrInvalidDimensions: 0 },
      recommendation: 'Include explicit width and height attributes when adding image elements to reserve layout space.',
    });
  } else if (imagesMissingOrInvalidDimensions === 0) {
    addFinding({
      id: 'content-image-dimensions',
      category: 'content',
      status: 'pass',
      severity: 'info',
      title: 'Image Dimensional Attributes Present',
      message: `All ${totalImages} image(s) specify valid explicit width and height attributes.`,
      value: { totalImages, imagesWithValidDimensions, imagesMissingOrInvalidDimensions: 0 },
      recommendation: 'Maintain explicit width and height attributes on images.',
    });
  } else {
    addFinding({
      id: 'content-image-dimensions',
      category: 'content',
      status: 'warn',
      severity: 'low',
      title: 'Missing Image Dimensional Attributes',
      message: `${imagesMissingOrInvalidDimensions} of ${totalImages} image(s) are missing valid width or height dimensional attributes.`,
      value: { totalImages, imagesWithValidDimensions, imagesMissingOrInvalidDimensions },
      recommendation: 'Specify positive numeric width and height attributes on img tags to help browsers reserve layout aspect ratio space.',
    });
  }

  return { summary, findings };
}

module.exports = {
  analyzeContent,
};
