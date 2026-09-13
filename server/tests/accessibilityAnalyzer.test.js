const { analyzeAccessibility } = require('../src/scanners/accessibilityAnalyzer');

describe('Accessibility Analyzer Unit Tests (M6)', () => {
  it('throws TypeError if html input is not a string', () => {
    expect(() => analyzeAccessibility(null)).toThrow(TypeError);
    expect(() => analyzeAccessibility(123)).toThrow(TypeError);
  });

  it('evaluates image alt markup states (missing alt, empty alt="", non-empty alt)', () => {
    const html = `
      <html>
        <body>
          <img src="1.jpg" alt="Informative logo">
          <img src="2.jpg" alt="">
          <img src="3.jpg">
        </body>
      </html>
    `;

    const res = analyzeAccessibility(html, {});
    const altFinding = res.findings.find((f) => f.id === 'a11y-image-alt');

    expect(altFinding.status).toBe('warn');
    expect(altFinding.value.totalImages).toBe(3);
    expect(altFinding.value.imagesMissingAlt).toBe(1);
    expect(altFinding.value.imagesEmptyAlt).toBe(1);
    expect(altFinding.value.imagesNonEmptyAlt).toBe(1);
  });

  it('passes image alt check when all images specify alt attributes', () => {
    const html = '<html><body><img src="1.jpg" alt="Valid"><img src="2.jpg" alt=""></body></html>';
    const res = analyzeAccessibility(html, {});
    const altFinding = res.findings.find((f) => f.id === 'a11y-image-alt');

    expect(altFinding.status).toBe('pass');
  });

  it('evaluates iframe title attribute presence', () => {
    const html = `
      <html>
        <body>
          <iframe src="1.html" title="Interactive map"></iframe>
          <iframe src="2.html"></iframe>
        </body>
      </html>
    `;

    const res = analyzeAccessibility(html, {});
    const iframeFinding = res.findings.find((f) => f.id === 'a11y-iframe-title');

    expect(iframeFinding.status).toBe('warn');
    expect(iframeFinding.value.totalIframes).toBe(2);
    expect(iframeFinding.value.iframesMissingTitle).toBe(1);
    expect(iframeFinding.value.iframesWithTitle).toBe(1);
  });

  it('evaluates form control label associations (label for, wrapping label, aria-label, excluding hidden/button inputs)', () => {
    const html = `
      <html>
        <body>
          <form>
            <input type="hidden" name="csrf" value="123">
            <input type="submit" value="Submit">
            <label for="username">Username</label>
            <input type="text" id="username" name="username">
            
            <label>
              Email
              <input type="email" name="email">
            </label>

            <input type="text" name="search" aria-label="Search site">

            <input type="text" name="unlabeled">
          </form>
        </body>
      </html>
    `;

    const res = analyzeAccessibility(html, {});
    const labelFinding = res.findings.find((f) => f.id === 'a11y-form-labels');

    expect(labelFinding.status).toBe('warn');
    expect(labelFinding.value.totalFormControls).toBe(4);
    expect(labelFinding.value.unlabeledControls).toBe(1);
  });

  it('evaluates button and link accessible names (text, aria-label, image alt, title fallback)', () => {
    const html = `
      <html>
        <body>
          <button>Submit Form</button>
          <button aria-label="Close modal"></button>
          <button><img src="icon.png" alt="Search"></button>
          <button title="Settings Only"></button>
          <button></button>

          <a href="/home">Home Page</a>
          <a href="/profile" title="Profile Fallback"></a>
          <a href="/cart"></a>
        </body>
      </html>
    `;

    const res = analyzeAccessibility(html, {});
    const btnFinding = res.findings.find((f) => f.id === 'a11y-button-name');
    const linkFinding = res.findings.find((f) => f.id === 'a11y-link-name');

    expect(btnFinding.status).toBe('warn');
    expect(btnFinding.value.totalButtons).toBe(5);
    expect(btnFinding.value.buttonsMissingName).toBe(1);
    expect(btnFinding.value.buttonsWithTitleOnly).toBe(1);

    expect(linkFinding.status).toBe('warn');
    expect(linkFinding.value.totalLinks).toBe(3);
    expect(linkFinding.value.linksMissingName).toBe(1);
    expect(linkFinding.value.linksWithTitleOnly).toBe(1);
  });

  it('evaluates empty or whitespace-only ARIA attributes', () => {
    const html = `
      <html>
        <body>
          <div aria-label=""></div>
          <div aria-labelledby="   "></div>
          <div aria-label="Valid Label"></div>
        </body>
      </html>
    `;

    const res = analyzeAccessibility(html, {});
    const ariaFinding = res.findings.find((f) => f.id === 'a11y-aria-attributes');

    expect(ariaFinding.status).toBe('warn');
    expect(ariaFinding.value.emptyAriaAttributesCount).toBe(2);
  });

  it('evaluates <main> landmark presence and HTML document language from baseline', () => {
    const htmlWithMain = '<html><body><main><h1>Title</h1></main></body></html>';
    const resPass = analyzeAccessibility(htmlWithMain, { lang: 'en' });

    expect(resPass.findings.find((f) => f.id === 'a11y-landmarks').status).toBe('pass');
    expect(resPass.findings.find((f) => f.id === 'a11y-html-lang').status).toBe('pass');

    const htmlNoMain = '<html><body><div>No Main</div></body></html>';
    const resWarn = analyzeAccessibility(htmlNoMain, { lang: '' });

    expect(resWarn.findings.find((f) => f.id === 'a11y-landmarks').status).toBe('info');
    expect(resWarn.findings.find((f) => f.id === 'a11y-html-lang').status).toBe('warn');
  });

  it('evaluates data table <th> headers and positive tabindex values', () => {
    const html = `
      <html>
        <body>
          <table>
            <tr><th>Header 1</th></tr>
            <tr><td>Data 1</td></tr>
          </table>
          <button tabindex="1">First focus</button>
          <button tabindex="0">Normal focus</button>
          <button tabindex="-1">Programmatic focus</button>
        </body>
      </html>
    `;

    const res = analyzeAccessibility(html, {});
    expect(res.findings.find((f) => f.id === 'a11y-table-markup')).toBeDefined();

    const tabindexFinding = res.findings.find((f) => f.id === 'a11y-tabindex-positive');
    expect(tabindexFinding.status).toBe('warn');
    expect(tabindexFinding.value.positiveTabindexCount).toBe(1);
  });

  it('verifies summary consistency: sum(findings by status) equals category summary', () => {
    const html = '<html><body><main><img src="test.jpg" alt="test"><button>OK</button></main></body></html>';
    const res = analyzeAccessibility(html, { lang: 'en' });

    expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
    expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
    expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
    expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
  });
});
