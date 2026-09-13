const htmlparser2 = require('htmlparser2');

/**
 * Passive Accessibility Markup Analyzer (M6)
 * Single-pass/near-linear inspection of already-fetched, already-bounded HTML document using htmlparser2.
 * Evaluates image alt markup, iframe titles, form label associations, button/link accessible name signals,
 * empty ARIA attributes, <main> landmark presence, data table header markup, positive tabindex values, and html lang.
 *
 * Perform ZERO secondary network requests.
 *
 * @param {string} html Raw HTML response body
 * @param {object} [baseline] Baseline document metadata from baselineAnalyzer
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzeAccessibility(html = '', baseline = {}) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML content must be a string');
  }

  let totalImages = 0;
  let imagesMissingAlt = 0;
  let imagesEmptyAlt = 0;
  let imagesNonEmptyAlt = 0;

  let totalIframes = 0;
  let iframesMissingTitle = 0;
  let iframesWithTitle = 0;

  let totalFormControls = 0;
  let unlabeledControls = 0;

  let totalButtons = 0;
  let buttonsMissingName = 0;
  let buttonsWithTitleOnly = 0;

  let totalLinks = 0;
  let linksMissingName = 0;
  let linksWithTitleOnly = 0;

  let emptyAriaAttributesCount = 0;
  let hasMainLandmark = false;

  let totalTables = 0;
  let tablesWithHeaders = 0;

  let positiveTabindexCount = 0;

  // Track elements and ID mappings for form label association
  const labelForSet = new Set();
  const inputList = []; // { id, tag, type, hasAriaLabel, hasWrappingLabel }

  let currentTagStack = [];
  let inLabel = false;
  let activeElement = null; // for text buffering inside button / a

  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        const tagName = name.toLowerCase();
        currentTagStack.push(tagName);

        if (tagName === 'main') {
          hasMainLandmark = true;
        }

        // 1. Image alt check
        if (tagName === 'img') {
          totalImages++;
          if (!Object.prototype.hasOwnProperty.call(attribs, 'alt')) {
            imagesMissingAlt++;
          } else {
            const altVal = attribs.alt.trim();
            if (altVal.length === 0) {
              imagesEmptyAlt++;
            } else {
              imagesNonEmptyAlt++;
            }
          }
        }

        // 2. Iframe title check
        if (tagName === 'iframe') {
          totalIframes++;
          const titleAttr = (attribs.title || '').trim();
          if (!titleAttr) {
            iframesMissingTitle++;
          } else {
            iframesWithTitle++;
          }
        }

        // 3. Label for collection
        if (tagName === 'label') {
          inLabel = true;
          if (attribs.for) {
            labelForSet.add(attribs.for.trim());
          }
        }

        // 4. Form control tracking
        if (['input', 'textarea', 'select'].includes(tagName)) {
          const typeAttr = (attribs.type || 'text').toLowerCase();
          const isExcludedInput =
            tagName === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(typeAttr);

          if (!isExcludedInput) {
            totalFormControls++;
            const id = (attribs.id || '').trim();
            const hasAriaLabel = !!(
              (attribs['aria-label'] || '').trim() || (attribs['aria-labelledby'] || '').trim()
            );
            const hasWrappingLabel = inLabel || currentTagStack.includes('label');

            inputList.push({
              id,
              tag: tagName,
              type: typeAttr,
              hasAriaLabel,
              hasWrappingLabel,
            });
          }
        }

        // 5. Button tracking
        if (tagName === 'button') {
          totalButtons++;
          const hasAriaLabel = !!(
            (attribs['aria-label'] || '').trim() || (attribs['aria-labelledby'] || '').trim()
          );
          const hasTitle = !!(attribs.title || '').trim();

          activeElement = {
            type: 'button',
            textBuffer: '',
            hasAriaLabel,
            hasTitle,
            hasImageAlt: false,
          };
        }

        // 6. Link tracking
        if (tagName === 'a') {
          totalLinks++;
          const hasAriaLabel = !!(
            (attribs['aria-label'] || '').trim() || (attribs['aria-labelledby'] || '').trim()
          );
          const hasTitle = !!(attribs.title || '').trim();

          activeElement = {
            type: 'link',
            textBuffer: '',
            hasAriaLabel,
            hasTitle,
            hasImageAlt: false,
          };
        }

        // If inside active button or link and encounting an img with alt
        if (activeElement && tagName === 'img') {
          const altVal = (attribs.alt || '').trim();
          if (altVal.length > 0) {
            activeElement.hasImageAlt = true;
          }
        }

        // 7. Empty ARIA attribute check
        ['aria-label', 'aria-labelledby', 'aria-describedby'].forEach((attr) => {
          if (Object.prototype.hasOwnProperty.call(attribs, attr)) {
            if ((attribs[attr] || '').trim().length === 0) {
              emptyAriaAttributesCount++;
            }
          }
        });

        // 8. Table header check
        if (tagName === 'table') {
          totalTables++;
        }
        if (tagName === 'th' && totalTables > 0) {
          tablesWithHeaders++;
        }

        // 9. Positive tabindex check
        if (Object.prototype.hasOwnProperty.call(attribs, 'tabindex')) {
          const tabVal = parseInt(attribs.tabindex, 10);
          if (!isNaN(tabVal) && tabVal > 0) {
            positiveTabindexCount++;
          }
        }
      },

      ontext(text) {
        if (activeElement) {
          activeElement.textBuffer += text;
        }
      },

      onclosetag(name) {
        const tagName = name.toLowerCase();
        if (tagName === 'label') {
          inLabel = false;
        }

        if (activeElement && activeElement.type === 'button' && tagName === 'button') {
          const hasText = activeElement.textBuffer.trim().length > 0;
          const hasStrongSignal = hasText || activeElement.hasAriaLabel || activeElement.hasImageAlt;

          if (!hasStrongSignal) {
            if (activeElement.hasTitle) {
              buttonsWithTitleOnly++;
            } else {
              buttonsMissingName++;
            }
          }

          activeElement = null;
        }

        if (activeElement && activeElement.type === 'link' && tagName === 'a') {
          const hasText = activeElement.textBuffer.trim().length > 0;
          const hasStrongSignal = hasText || activeElement.hasAriaLabel || activeElement.hasImageAlt;

          if (!hasStrongSignal) {
            if (activeElement.hasTitle) {
              linksWithTitleOnly++;
            } else {
              linksMissingName++;
            }
          }

          activeElement = null;
        }

        currentTagStack.pop();
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  // Evaluate form label associations
  inputList.forEach((input) => {
    const isExplicitlyLabeled = input.id && labelForSet.has(input.id);
    if (!input.hasAriaLabel && !input.hasWrappingLabel && !isExplicitlyLabeled) {
      unlabeledControls++;
    }
  });

  const findings = [];

  // 1. Image alt check (id: "a11y-image-alt")
  const imageSummaryValue = {
    totalImages,
    imagesMissingAlt,
    imagesEmptyAlt,
    imagesNonEmptyAlt,
  };

  if (totalImages === 0) {
    findings.push({
      id: 'a11y-image-alt',
      category: 'accessibility',
      status: 'info',
      severity: 'info',
      title: 'Image Alt Attributes',
      message: 'No <img> elements found in document markup.',
      value: imageSummaryValue,
      recommendation: 'Ensure images added in future content include descriptive alt attributes or empty alt="" for decorative graphics.',
    });
  } else if (imagesMissingAlt > 0) {
    findings.push({
      id: 'a11y-image-alt',
      category: 'accessibility',
      status: 'warn',
      severity: 'medium',
      title: 'Missing Image Alt Attributes',
      message: `Found ${imagesMissingAlt} image(s) lacking an alt attribute.`,
      value: imageSummaryValue,
      recommendation: 'Add descriptive alt text to informative images or explicit alt="" for decorative graphics to support screen readers.',
    });
  } else {
    findings.push({
      id: 'a11y-image-alt',
      category: 'accessibility',
      status: 'pass',
      severity: 'info',
      title: 'Image Alt Markup Completeness',
      message: `All ${totalImages} image(s) specify alt attributes (${imagesNonEmptyAlt} descriptive, ${imagesEmptyAlt} empty/decorative).`,
      value: imageSummaryValue,
      recommendation: 'Maintain descriptive alt text for informative images and alt="" for decorative graphics.',
    });
  }

  // 2. Iframe title check (id: "a11y-iframe-title")
  const iframeSummaryValue = {
    totalIframes,
    iframesMissingTitle,
    iframesWithTitle,
  };

  if (totalIframes > 0) {
    if (iframesMissingTitle > 0) {
      findings.push({
        id: 'a11y-iframe-title',
        category: 'accessibility',
        status: 'warn',
        severity: 'medium',
        title: 'Missing Iframe Title Attributes',
        message: `Found ${iframesMissingTitle} <iframe> element(s) lacking a descriptive title attribute.`,
        value: iframeSummaryValue,
        recommendation: 'Add a concise title attribute to <iframe> elements to explain frame content for screen reader users.',
      });
    } else {
      findings.push({
        id: 'a11y-iframe-title',
        category: 'accessibility',
        status: 'pass',
        severity: 'info',
        title: 'Iframe Title Attributes',
        message: `All ${totalIframes} <iframe> element(s) specify descriptive title attributes.`,
        value: iframeSummaryValue,
        recommendation: 'Maintain concise, descriptive title attributes on all embedded iframes.',
      });
    }
  }

  // 3. Form control label check (id: "a11y-form-labels")
  const formLabelSummaryValue = {
    totalFormControls,
    unlabeledControls,
  };

  if (totalFormControls > 0) {
    if (unlabeledControls > 0) {
      findings.push({
        id: 'a11y-form-labels',
        category: 'accessibility',
        status: 'warn',
        severity: 'high',
        title: 'Unlabeled Form Controls',
        message: `Found ${unlabeledControls} form control(s) lacking accessible label associations (<label for>, wrapping <label>, or aria-label).`,
        value: formLabelSummaryValue,
        recommendation: 'Associate form inputs with explicit <label for="id"> tags, ancestor <label> wrappers, or aria-label attributes.',
      });
    } else {
      findings.push({
        id: 'a11y-form-labels',
        category: 'accessibility',
        status: 'pass',
        severity: 'info',
        title: 'Form Control Labels',
        message: `All ${totalFormControls} form control(s) have accessible label associations.`,
        value: formLabelSummaryValue,
        recommendation: 'Maintain explicit label associations for all interactive form inputs.',
      });
    }
  }

  // 4. Button accessible name check (id: "a11y-button-name")
  const buttonSummaryValue = {
    totalButtons,
    buttonsMissingName,
    buttonsWithTitleOnly,
  };

  if (totalButtons > 0) {
    if (buttonsMissingName > 0 || buttonsWithTitleOnly > 0) {
      findings.push({
        id: 'a11y-button-name',
        category: 'accessibility',
        status: 'warn',
        severity: 'medium',
        title: 'Empty or Weak Button Accessible Names',
        message: `Found ${buttonsMissingName + buttonsWithTitleOnly} button(s) lacking strong accessible names (${buttonsMissingName} empty, ${buttonsWithTitleOnly} title fallback only).`,
        value: buttonSummaryValue,
        recommendation: 'Provide visible button text or aria-label attributes rather than relying solely on title attributes.',
      });
    } else {
      findings.push({
        id: 'a11y-button-name',
        category: 'accessibility',
        status: 'pass',
        severity: 'info',
        title: 'Button Accessible Names',
        message: `All ${totalButtons} <button> element(s) provide strong accessible names (text, aria-label, or image alt).`,
        value: buttonSummaryValue,
        recommendation: 'Maintain clear text content or aria-label attributes for interactive buttons.',
      });
    }
  }

  // 5. Link accessible name check (id: "a11y-link-name")
  const linkSummaryValue = {
    totalLinks,
    linksMissingName,
    linksWithTitleOnly,
  };

  if (totalLinks > 0) {
    if (linksMissingName > 0 || linksWithTitleOnly > 0) {
      findings.push({
        id: 'a11y-link-name',
        category: 'accessibility',
        status: 'warn',
        severity: 'medium',
        title: 'Empty or Weak Link Accessible Names',
        message: `Found ${linksMissingName + linksWithTitleOnly} link(s) lacking strong accessible names (${linksMissingName} empty, ${linksWithTitleOnly} title fallback only).`,
        value: linkSummaryValue,
        recommendation: 'Ensure all <a> links contain descriptive text, nested image alt text, or aria-label attributes.',
      });
    } else {
      findings.push({
        id: 'a11y-link-name',
        category: 'accessibility',
        status: 'pass',
        severity: 'info',
        title: 'Link Accessible Names',
        message: `All ${totalLinks} <a> element(s) provide strong accessible names.`,
        value: linkSummaryValue,
        recommendation: 'Maintain descriptive link text and accessible image link alt text.',
      });
    }
  }

  // 6. Empty ARIA attribute check (id: "a11y-aria-attributes")
  if (emptyAriaAttributesCount > 0) {
    findings.push({
      id: 'a11y-aria-attributes',
      category: 'accessibility',
      status: 'warn',
      severity: 'medium',
      title: 'Empty ARIA Attributes',
      message: `Found ${emptyAriaAttributesCount} empty or whitespace-only ARIA attribute(s) (aria-label, aria-labelledby, or aria-describedby).`,
      value: { emptyAriaAttributesCount },
      recommendation: 'Remove empty ARIA attributes or populate them with valid element IDs and descriptive label text.',
    });
  } else {
    findings.push({
      id: 'a11y-aria-attributes',
      category: 'accessibility',
      status: 'pass',
      severity: 'info',
      title: 'ARIA Attribute Validity',
      message: 'No empty or whitespace-only ARIA labeling attributes detected.',
      value: { emptyAriaAttributesCount: 0 },
      recommendation: 'Maintain valid ARIA attribute content when implementing custom accessibility roles.',
    });
  }

  // 7. Landmark check (id: "a11y-landmarks")
  if (hasMainLandmark) {
    findings.push({
      id: 'a11y-landmarks',
      category: 'accessibility',
      status: 'pass',
      severity: 'info',
      title: 'Document Landmark Structure',
      message: 'Document includes a primary <main> content landmark.',
      value: { hasMainLandmark: true },
      recommendation: 'Maintain semantic landmark elements (<main>, <header>, <nav>, <footer>) for document navigation.',
    });
  } else {
    findings.push({
      id: 'a11y-landmarks',
      category: 'accessibility',
      status: 'info',
      severity: 'info',
      title: 'Document Main Landmark Missing',
      message: 'Document markup does not contain a primary <main> content landmark tag.',
      value: { hasMainLandmark: false },
      recommendation: 'Wrap primary page content in a <main> element to assist screen reader landmark navigation.',
    });
  }

  // 8. Data table header check (id: "a11y-table-markup")
  if (totalTables > 0) {
    if (tablesWithHeaders > 0) {
      findings.push({
        id: 'a11y-table-markup',
        category: 'accessibility',
        status: 'pass',
        severity: 'info',
        title: 'Data Table Header Structure',
        message: `Found ${totalTables} table(s); data headers (<th>) are present.`,
        value: { totalTables, tablesWithHeaders },
        recommendation: 'Maintain <th> header elements and scope attributes for data table accessibility.',
      });
    } else {
      findings.push({
        id: 'a11y-table-markup',
        category: 'accessibility',
        status: 'info',
        severity: 'info',
        title: 'Data Table Header Structure',
        message: `Found ${totalTables} table(s); zero explicit data header (<th>) elements detected.`,
        value: { totalTables, tablesWithHeaders: 0 },
        recommendation: 'Use <th> elements for table row/column headers to assist screen reader navigation.',
      });
    }
  }

  // 9. Positive tabindex check (id: "a11y-tabindex-positive")
  if (positiveTabindexCount > 0) {
    findings.push({
      id: 'a11y-tabindex-positive',
      category: 'accessibility',
      status: 'warn',
      severity: 'medium',
      title: 'Positive Tabindex Values Detected',
      message: `Found ${positiveTabindexCount} element(s) with positive tabindex values (tabindex > 0).`,
      value: { positiveTabindexCount },
      recommendation: 'Avoid positive tabindex values (use tabindex="0" or tabindex="-1") to preserve natural DOM keyboard tab order.',
    });
  } else {
    findings.push({
      id: 'a11y-tabindex-positive',
      category: 'accessibility',
      status: 'pass',
      severity: 'info',
      title: 'Keyboard Focus Order',
      message: 'No positive tabindex values detected; natural DOM tab order is preserved.',
      value: { positiveTabindexCount: 0 },
      recommendation: 'Rely on natural DOM structure and tabindex="0" for custom keyboard focusable elements.',
    });
  }

  // 9. Document Language check (id: "a11y-html-lang")
  const docLang = baseline.lang || null;
  if (docLang && docLang.trim().length > 0) {
    findings.push({
      id: 'a11y-html-lang',
      category: 'accessibility',
      status: 'pass',
      severity: 'info',
      title: 'Document Language Attribute',
      message: `Document specifies an HTML language attribute (lang="${docLang}").`,
      value: docLang,
      recommendation: 'Maintain a valid BCP 47 language code on the <html> tag for screen reader text-to-speech pronunciation.',
    });
  } else {
    findings.push({
      id: 'a11y-html-lang',
      category: 'accessibility',
      status: 'warn',
      severity: 'medium',
      title: 'Missing Document Language Attribute',
      message: 'Document <html> tag is missing a lang attribute.',
      value: null,
      recommendation: 'Add a valid lang attribute (e.g. <html lang="en">) to set the primary document language.',
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
  analyzeAccessibility,
};
