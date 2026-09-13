const { analyzeMobile } = require('../src/scanners/mobileAnalyzer');

describe('Mobile Responsiveness Markup Analyzer Unit Tests (M6)', () => {
  it('throws TypeError if html input is not a string', () => {
    expect(() => analyzeMobile(null)).toThrow(TypeError);
    expect(() => analyzeMobile(123)).toThrow(TypeError);
  });

  it('evaluates viewport zoom restrictions (user-scalable=no, maximum-scale=1.0)', () => {
    const htmlRestricted = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        </head>
        <body></body>
      </html>
    `;

    const resRestricted = analyzeMobile(htmlRestricted, {});
    const zoomFindingWarn = resRestricted.findings.find((f) => f.id === 'mobile-viewport-zoom');
    expect(zoomFindingWarn.status).toBe('warn');

    const htmlAllowed = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body></body>
      </html>
    `;

    const resAllowed = analyzeMobile(htmlAllowed, {});
    const zoomFindingPass = resAllowed.findings.find((f) => f.id === 'mobile-viewport-zoom');
    expect(zoomFindingPass.status).toBe('pass');
  });

  it('evaluates specialized mobile form input types without flagging generic text inputs as errors', () => {
    const html = `
      <html>
        <body>
          <form>
            <input type="text" name="name">
            <input type="tel" name="phone">
            <input type="email" name="email">
            <input type="number" name="age">
          </form>
        </body>
      </html>
    `;

    const res = analyzeMobile(html, {});
    const typesFinding = res.findings.find((f) => f.id === 'mobile-input-types');

    expect(typesFinding.status).toBe('pass');
    expect(typesFinding.value.totalInputs).toBe(4);
    expect(typesFinding.value.specializedInputTypesCount).toBe(3);
    expect(typesFinding.value.genericTextInputCount).toBe(1);
  });

  it('evaluates virtual keyboard inputmode hints, autocomplete tokens, and mobile meta tags', () => {
    const html = `
      <html>
        <head>
          <meta name="theme-color" content="#0f172a">
          <meta name="apple-mobile-web-app-capable" content="yes">
        </head>
        <body>
          <form>
            <input type="text" name="pin" inputmode="numeric" autocomplete="one-time-code">
          </form>
        </body>
      </html>
    `;

    const res = analyzeMobile(html, {});

    const inputmodeFinding = res.findings.find((f) => f.id === 'mobile-inputmode');
    expect(inputmodeFinding.status).toBe('pass');
    expect(inputmodeFinding.value.inputmodeCount).toBe(1);

    const autocompleteFinding = res.findings.find((f) => f.id === 'mobile-autocomplete');
    expect(autocompleteFinding.status).toBe('pass');
    expect(autocompleteFinding.value.autocompleteCount).toBe(1);

    const metaFinding = res.findings.find((f) => f.id === 'mobile-meta-tags');
    expect(metaFinding.status).toBe('info');
    expect(metaFinding.value.hasThemeColorMeta).toBe(true);
    expect(metaFinding.value.hasAppleWebAppMeta).toBe(true);
  });

  it('verifies summary consistency: sum(findings by status) equals category summary', () => {
    const html = '<html><head><meta name="viewport" content="width=device-width"></head><body></body></html>';
    const res = analyzeMobile(html, {});

    expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
    expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
    expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
    expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
  });
});
