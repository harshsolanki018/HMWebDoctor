const { analyzeBaseline } = require('../src/scanners/baselineAnalyzer');

describe('Baseline HTML Analyzer Unit Tests', () => {
  it('should extract title, lang, charset, description, and doctype from full HTML document', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Test Page Title — HMWebDoctor</title>
          <meta name="description" content="This is a test meta description for diagnostic baseline evaluation." />
        </head>
        <body>
          <h1>Welcome</h1>
        </body>
      </html>
    `;

    const result = analyzeBaseline(html);

    expect(result.title).toBe('Test Page Title — HMWebDoctor');
    expect(result.lang).toBe('en');
    expect(result.charset).toBe('utf-8');
    expect(result.description).toBe(
      'This is a test meta description for diagnostic baseline evaluation.'
    );
    expect(result.hasDoctype).toBe(true);
    expect(result.documentSizeBytes).toBeGreaterThan(0);
  });

  it('should extract charset from meta http-equiv content-type', () => {
    const html = `
      <html>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
        </head>
        <body></body>
      </html>
    `;

    const result = analyzeBaseline(html);
    expect(result.charset).toBe('ISO-8859-1');
  });

  it('should extract description from og:description if name="description" is not present', () => {
    const html = `
      <html>
        <head>
          <meta property="og:description" content="OpenGraph fallback description" />
        </head>
        <body></body>
      </html>
    `;

    const result = analyzeBaseline(html);
    expect(result.description).toBe('OpenGraph fallback description');
  });

  it('should handle missing tags gracefully without throwing errors', () => {
    const html = '<div>Simple HTML Fragment</div>';

    const result = analyzeBaseline(html);

    expect(result.title).toBeNull();
    expect(result.lang).toBeNull();
    expect(result.charset).toBeNull();
    expect(result.description).toBeNull();
    expect(result.hasDoctype).toBe(false);
  });

  it('should throw TypeError if input is not a string', () => {
    expect(() => analyzeBaseline(null)).toThrow(TypeError);
    expect(() => analyzeBaseline(123)).toThrow(TypeError);
  });
});
