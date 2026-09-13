const htmlparser2 = require('htmlparser2');

/**
 * Passive Resource & Performance Analyzer
 * Performs single-pass parsing/inspection of the already-bounded HTML document using htmlparser2.
 * Evaluates script execution attributes, stylesheets, inline CSS payload size, resource hints,
 * DOM element counts, and image lazy-loading markup attributes.
 *
 * Perform ZERO secondary network requests.
 *
 * @param {string} html Raw HTML response body
 * @param {object} [headers] HTTP headers from primary page fetch
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzePerformance(html = '', _headers = {}) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML content must be a string');
  }

  let inHead = false;
  let inStyle = false;
  let totalElements = 0;

  let totalScripts = 0;
  let headSynchronousScripts = 0;
  let asyncScripts = 0;
  let deferScripts = 0;
  let moduleScripts = 0;
  let inlineScripts = 0;

  let externalStylesheetCount = 0;
  let inlineStyleCount = 0;
  let aggregateInlineCssBytes = 0;

  let preconnectCount = 0;
  let dnsPrefetchCount = 0;
  let preloadCount = 0;
  let modulepreloadCount = 0;

  let imgCount = 0;
  let videoCount = 0;
  let audioCount = 0;
  let iframeCount = 0;
  let lazyLoadedImages = 0;
  let eagerOrUnspecifiedImages = 0;

  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        totalElements++;
        const tagName = name.toLowerCase();

        if (tagName === 'head') {
          inHead = true;
        }
        if (tagName === 'body') {
          inHead = false;
        }

        if (tagName === 'script') {
          totalScripts++;
          const hasAsync = Object.prototype.hasOwnProperty.call(attribs, 'async');
          const hasDefer = Object.prototype.hasOwnProperty.call(attribs, 'defer');
          const isModule = (attribs.type || '').toLowerCase() === 'module';
          const isExternal = Object.prototype.hasOwnProperty.call(attribs, 'src');

          if (!isExternal) {
            inlineScripts++;
          }
          if (hasAsync) {
            asyncScripts++;
          }
          if (hasDefer) {
            deferScripts++;
          }
          if (isModule) {
            moduleScripts++;
          }

          if (inHead && !hasAsync && !hasDefer && !isModule) {
            headSynchronousScripts++;
          }
        }

        if (tagName === 'style') {
          inStyle = true;
          inlineStyleCount++;
        }

        if (tagName === 'link') {
          const rel = (attribs.rel || '').toLowerCase();
          const relValues = rel.split(/\s+/);

          if (relValues.includes('stylesheet')) {
            externalStylesheetCount++;
          }
          if (relValues.includes('preconnect')) {
            preconnectCount++;
          }
          if (relValues.includes('dns-prefetch')) {
            dnsPrefetchCount++;
          }
          if (relValues.includes('preload')) {
            preloadCount++;
          }
          if (relValues.includes('modulepreload')) {
            modulepreloadCount++;
          }
        }

        if (tagName === 'img') {
          imgCount++;
          const loadingAttr = (attribs.loading || '').toLowerCase();
          if (loadingAttr === 'lazy') {
            lazyLoadedImages++;
          } else {
            eagerOrUnspecifiedImages++;
          }
        }

        if (tagName === 'video') {
          videoCount++;
        }

        if (tagName === 'audio') {
          audioCount++;
        }

        if (tagName === 'iframe') {
          iframeCount++;
        }
      },

      ontext(text) {
        if (inStyle) {
          aggregateInlineCssBytes += Buffer.byteLength(text, 'utf8');
        }
      },

      onclosetag(name) {
        const tagName = name.toLowerCase();
        if (tagName === 'head') {
          inHead = false;
        }
        if (tagName === 'style') {
          inStyle = false;
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  const findings = [];

  // 1. Script Analysis (id: "perf-blocking-scripts")
  const scriptSummaryValue = {
    totalScripts,
    headSynchronousScripts,
    asyncScripts,
    deferScripts,
    moduleScripts,
    inlineScripts,
  };

  if (headSynchronousScripts > 0) {
    findings.push({
      id: 'perf-blocking-scripts',
      category: 'performance',
      status: 'warn',
      severity: 'medium',
      title: 'Render-Blocking Head Scripts',
      message: `Found ${headSynchronousScripts} synchronous script(s) in <head> without async, defer, or type="module" attributes.`,
      value: scriptSummaryValue,
      recommendation: 'Add async, defer, or type="module" attributes to scripts in <head> to prevent HTML parsing blockage.',
    });
  } else {
    findings.push({
      id: 'perf-blocking-scripts',
      category: 'performance',
      status: 'pass',
      severity: 'info',
      title: 'Head Script Execution',
      message: `All head scripts (${totalScripts} total) use non-blocking attributes (async, defer, or module) or external placement.`,
      value: scriptSummaryValue,
      recommendation: 'Maintain non-blocking script attributes across head scripts.',
    });
  }

  // 2. Stylesheet & Inline CSS Analysis (id: "perf-stylesheets-css" & id: "perf-inline-css")
  const cssSummaryValue = {
    externalStylesheetCount,
    inlineStyleCount,
    aggregateInlineCssBytes,
    isInlineCssExcessive: aggregateInlineCssBytes > 20480,
  };

  findings.push({
    id: 'perf-stylesheets-css',
    category: 'performance',
    status: 'pass',
    severity: 'info',
    title: 'Stylesheets & Inline CSS',
    message: `Found ${externalStylesheetCount} external stylesheet(s) and ${inlineStyleCount} inline <style> tag(s) (total inline CSS: ${aggregateInlineCssBytes} bytes).`,
    value: cssSummaryValue,
    recommendation: 'Maintain external stylesheets for effective browser caching.',
  });

  if (aggregateInlineCssBytes > 20480) {
    findings.push({
      id: 'perf-inline-css',
      category: 'performance',
      status: 'info',
      severity: 'info',
      title: 'Large Inline CSS Payload',
      message: `Aggregate inline CSS payload (${Math.round(aggregateInlineCssBytes / 1024)} KB) exceeds 20 KB limit.`,
      value: {
        aggregateInlineCssBytes,
        thresholdBytes: 20480,
      },
      recommendation: 'Consider extracting large inline CSS into external stylesheet files to enable browser caching.',
    });
  }

  // 3. Resource Hints Inspection (id: "perf-resource-hints")
  const hintsSummaryValue = {
    preconnectCount,
    dnsPrefetchCount,
    preloadCount,
    modulepreloadCount,
  };

  if (preconnectCount > 0 || dnsPrefetchCount > 0 || preloadCount > 0 || modulepreloadCount > 0) {
    findings.push({
      id: 'perf-resource-hints',
      category: 'performance',
      status: 'pass',
      severity: 'info',
      title: 'Browser Resource Hints',
      message: 'Resource connection and preloading hints (preconnect, dns-prefetch, preload, or modulepreload) are present in document head.',
      value: hintsSummaryValue,
      recommendation: 'Maintain resource connection hints for external font, CDN, and API origins.',
    });
  } else {
    findings.push({
      id: 'perf-resource-hints',
      category: 'performance',
      status: 'info',
      severity: 'info',
      title: 'Browser Resource Hints',
      message: 'No resource connection hints (preconnect, dns-prefetch, preload, modulepreload) declared.',
      value: hintsSummaryValue,
      recommendation: 'Consider declaring <link rel="preconnect"> or <link rel="dns-prefetch"> for external third-party asset origins.',
    });
  }

  // 4. DOM Footprint & Resource Elements (id: "perf-dom-footprint")
  const domSummaryValue = {
    totalElements,
    imgCount,
    videoCount,
    audioCount,
    iframeCount,
    isDomExcessive: totalElements > 1500,
  };

  if (totalElements > 1500) {
    findings.push({
      id: 'perf-dom-footprint',
      category: 'performance',
      status: 'info',
      severity: 'info',
      title: 'Large DOM Element Footprint',
      message: `Document DOM element count (${totalElements} elements) exceeds recommended 1,500 element threshold.`,
      value: domSummaryValue,
      recommendation: 'Reduce DOM node depth and element complexity to improve browser rendering performance.',
    });
  } else {
    findings.push({
      id: 'perf-dom-footprint',
      category: 'performance',
      status: 'pass',
      severity: 'info',
      title: 'Document DOM Footprint & Resource Elements',
      message: `Document DOM element count (${totalElements} elements) is within lightweight limits.`,
      value: domSummaryValue,
      recommendation: 'Keep DOM element counts below 1,500 for fast browser style and layout computation.',
    });
  }

  // 5. Image Lazy-Loading Attribute Markup (id: "perf-image-lazyloading")
  const imageLazySummaryValue = {
    totalImages: imgCount,
    lazyLoadedImages,
    eagerOrUnspecifiedImages,
  };

  if (imgCount === 0) {
    findings.push({
      id: 'perf-image-lazyloading',
      category: 'performance',
      status: 'info',
      severity: 'info',
      title: 'Image Lazy-Loading Attribute Markup',
      message: 'No <img> elements found in document markup.',
      value: imageLazySummaryValue,
      recommendation: 'Ensure offscreen images added in future content specify loading="lazy" attributes.',
    });
  } else if (lazyLoadedImages > 0) {
    findings.push({
      id: 'perf-image-lazyloading',
      category: 'performance',
      status: 'pass',
      severity: 'info',
      title: 'Image Lazy-Loading Attribute Markup',
      message: `Found ${imgCount} image(s); ${lazyLoadedImages} explicit loading="lazy" attribute(s) declared in markup.`,
      value: imageLazySummaryValue,
      recommendation: 'Maintain loading="lazy" attributes for offscreen image elements.',
    });
  } else {
    findings.push({
      id: 'perf-image-lazyloading',
      category: 'performance',
      status: 'info',
      severity: 'info',
      title: 'Image Lazy-Loading Attribute Markup',
      message: `Found ${imgCount} image(s); zero explicit loading="lazy" attributes declared in markup.`,
      value: imageLazySummaryValue,
      recommendation: 'Consider adding loading="lazy" to offscreen image markup to defer loading until scrolled into view.',
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
  analyzePerformance,
};
