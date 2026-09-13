const htmlparser2 = require('htmlparser2');

/**
 * Passive Mobile Responsiveness Markup Analyzer (M6)
 * Single-pass/near-linear inspection of already-fetched, already-bounded HTML document using htmlparser2.
 * Evaluates viewport pinch-to-zoom restrictions, mobile-friendly form input types, virtual keyboard inputmode hints,
 * form autocomplete attributes, and mobile presentation metadata.
 *
 * Perform ZERO secondary network requests.
 *
 * @param {string} html Raw HTML response body
 * @param {object} [_baseline] Baseline document metadata
 * @param {object} [_seoResult] Result from SEO analyzer (containing viewport tag finding)
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzeMobile(html = '', _baseline = {}, _seoResult = {}) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML content must be a string');
  }

  let viewportContent = null;
  let hasThemeColorMeta = false;
  let hasAppleWebAppMeta = false;

  let totalInputs = 0;
  let specializedInputTypesCount = 0;
  let genericTextInputCount = 0;
  let inputmodeCount = 0;
  let autocompleteCount = 0;

  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        const tagName = name.toLowerCase();

        if (tagName === 'meta') {
          const nameAttr = (attribs.name || '').toLowerCase();
          const content = (attribs.content || '').trim();

          if (nameAttr === 'viewport' && content) {
            viewportContent = content;
          }

          if (nameAttr === 'theme-color') {
            hasThemeColorMeta = true;
          }

          if (nameAttr === 'apple-mobile-web-app-capable') {
            hasAppleWebAppMeta = true;
          }
        }

        if (tagName === 'input') {
          const typeAttr = (attribs.type || 'text').toLowerCase();
          const isHiddenOrButton = ['hidden', 'submit', 'button', 'reset', 'image'].includes(typeAttr);

          if (!isHiddenOrButton) {
            totalInputs++;

            const isSpecializedMobileType = [
              'email',
              'tel',
              'number',
              'url',
              'search',
              'date',
              'datetime-local',
              'time',
              'range',
              'color',
            ].includes(typeAttr);

            if (isSpecializedMobileType) {
              specializedInputTypesCount++;
            } else if (typeAttr === 'text') {
              genericTextInputCount++;
            }

            if (attribs.inputmode && attribs.inputmode.trim()) {
              inputmodeCount++;
            }

            if (attribs.autocomplete && attribs.autocomplete.trim()) {
              autocompleteCount++;
            }
          }
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  const findings = [];

  // 1. Viewport Zoom Restrictions Check (id: "mobile-viewport-zoom")
  if (viewportContent) {
    const lowerVP = viewportContent.toLowerCase();
    const restrictsUserScalable = lowerVP.includes('user-scalable=no') || lowerVP.includes('user-scalable=0');
    const restrictsMaxScale = lowerVP.includes('maximum-scale=1.0') || lowerVP.includes('maximum-scale=1');

    if (restrictsUserScalable || restrictsMaxScale) {
      findings.push({
        id: 'mobile-viewport-zoom',
        category: 'mobile',
        status: 'warn',
        severity: 'medium',
        title: 'Viewport Zoom Disabled',
        message: `Viewport meta tag contains zoom restrictions (${viewportContent}) that block user pinch-to-zoom.`,
        value: viewportContent,
        recommendation: 'Remove user-scalable=no and maximum-scale=1.0 parameters to allow mobile users with low vision to zoom the viewport.',
      });
    } else {
      findings.push({
        id: 'mobile-viewport-zoom',
        category: 'mobile',
        status: 'pass',
        severity: 'info',
        title: 'Viewport Pinch-to-Zoom',
        message: 'Viewport configuration permits mobile pinch-to-zoom accessibility.',
        value: viewportContent,
        recommendation: 'Maintain zoomable viewport parameters to ensure accessibility for low-vision mobile users.',
      });
    }
  } else {
    findings.push({
      id: 'mobile-viewport-zoom',
      category: 'mobile',
      status: 'info',
      severity: 'info',
      title: 'Viewport Pinch-to-Zoom',
      message: 'No viewport meta tag declared in document head.',
      value: null,
      recommendation: 'Declare <meta name="viewport" content="width=device-width, initial-scale=1.0"> in document head.',
    });
  }

  // 2. Mobile Specialized Form Input Types Check (id: "mobile-input-types")
  const inputTypeSummaryValue = {
    totalInputs,
    specializedInputTypesCount,
    genericTextInputCount,
  };

  if (totalInputs > 0) {
    if (specializedInputTypesCount > 0) {
      findings.push({
        id: 'mobile-input-types',
        category: 'mobile',
        status: 'pass',
        severity: 'info',
        title: 'Mobile Touch Keyboard Input Types',
        message: `Found ${totalInputs} form input(s); ${specializedInputTypesCount} use specialized mobile input types (tel, email, number, etc.).`,
        value: inputTypeSummaryValue,
        recommendation: 'Continue using semantic input types to trigger appropriate virtual touch keyboards on mobile devices.',
      });
    } else {
      findings.push({
        id: 'mobile-input-types',
        category: 'mobile',
        status: 'info',
        severity: 'info',
        title: 'Mobile Touch Keyboard Input Types',
        message: `Found ${totalInputs} form input(s) using generic text or standard input types.`,
        value: inputTypeSummaryValue,
        recommendation: 'Consider specifying specialized input types (e.g. type="email", type="tel", type="number") to trigger optimized virtual touch keyboards.',
      });
    }
  }

  // 3. Virtual Keyboard Inputmode Hints (id: "mobile-inputmode")
  if (totalInputs > 0) {
    findings.push({
      id: 'mobile-inputmode',
      category: 'mobile',
      status: inputmodeCount > 0 ? 'pass' : 'info',
      severity: 'info',
      title: 'Virtual Keyboard Inputmode Hints',
      message: inputmodeCount > 0
        ? `Found ${inputmodeCount} form input(s) with explicit inputmode virtual keyboard hints.`
        : 'No explicit inputmode attributes found on form controls.',
      value: { totalInputs, inputmodeCount },
      recommendation: 'Consider adding inputmode="decimal" or inputmode="numeric" to fine-tune virtual keyboard layouts on mobile devices.',
    });
  }

  // 4. Form Autocomplete Tokens (id: "mobile-autocomplete")
  if (totalInputs > 0) {
    findings.push({
      id: 'mobile-autocomplete',
      category: 'mobile',
      status: autocompleteCount > 0 ? 'pass' : 'info',
      severity: 'info',
      title: 'Form Autocomplete Hints',
      message: autocompleteCount > 0
        ? `Found ${autocompleteCount} form input(s) with explicit autocomplete tokens for mobile autofill.`
        : 'No explicit autocomplete tokens found on form controls.',
      value: { totalInputs, autocompleteCount },
      recommendation: 'Add autocomplete tokens (e.g. autocomplete="email", autocomplete="tel") to streamline mobile form submissions.',
    });
  }

  // 5. Mobile Presentation Meta Tags (id: "mobile-meta-tags")
  findings.push({
    id: 'mobile-meta-tags',
    category: 'mobile',
    status: 'info',
    severity: 'info',
    title: 'Mobile Presentation Metadata',
    message: hasThemeColorMeta || hasAppleWebAppMeta
      ? 'Mobile browser presentation metadata (theme-color or apple-mobile-web-app-capable) is present in document head.'
      : 'No mobile browser presentation metadata (theme-color or apple-mobile-web-app-capable) declared.',
    value: {
      hasThemeColorMeta,
      hasAppleWebAppMeta,
    },
    recommendation: 'Consider declaring <meta name="theme-color"> for customized mobile browser address bar styling.',
  });

  const summary = {
    pass: findings.filter((f) => f.status === 'pass').length,
    warn: findings.filter((f) => f.status === 'warn').length,
    fail: findings.filter((f) => f.status === 'fail').length,
    info: findings.filter((f) => f.status === 'info').length,
  };

  return { summary, findings };
}

module.exports = {
  analyzeMobile,
};
