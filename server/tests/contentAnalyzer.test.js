const http = require('http');
const https = require('https');
const dns = require('dns');
const { analyzeContent } = require('../src/scanners/contentAnalyzer');

describe('contentAnalyzer Scanner (M7)', () => {
  test('throws TypeError if HTML is not a string', () => {
    expect(() => analyzeContent(null)).toThrow(TypeError);
    expect(() => analyzeContent(123)).toThrow(TypeError);
  });

  describe('Zero-Network Activity Proof', () => {
    test('performs ZERO outbound network or DNS requests when analyzing document containing all resource and link types', () => {
      const httpReqSpy = vi.spyOn(http, 'request');
      const httpGetSpy = vi.spyOn(http, 'get');
      const httpsReqSpy = vi.spyOn(https, 'request');
      const httpsGetSpy = vi.spyOn(https, 'get');
      const dnsLookupSpy = vi.spyOn(dns, 'lookup');
      const dnsResolveSpy = vi.spyOn(dns, 'resolve');

      const complexHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>Zero Network Test Page</title>
          </head>
          <body>
            <div id="wrapper">
              <p>This is a paragraph with more than eight words to test duplicate block text detection.</p>
              <p>This is a paragraph with more than eight words to test duplicate block text detection.</p>
              <p>This is a paragraph with more than eight words to test duplicate block text detection.</p>
            </div>
            <a href="/internal-page">Internal Link</a>
            <a href="https://external-domain.com/path">External Link</a>
            <a href="#section-hash">Anchor Link</a>
            <a href="mailto:support@domain.com">Mailto Link</a>
            <a href="tel:+18005550199">Tel Link</a>
            <a href="javascript:void(0)">JS Link</a>
            <a href="http://:invalid url">Malformed Link</a>
            <img src="https://cdn.example.com/image.jpg" width="800" height="600" alt="Image">
            <iframe src="https://embed.example.com/frame"></iframe>
            <script src="https://scripts.example.com/app.js"></script>
            <audio src="https://media.example.com/audio.mp3"></audio>
            <video src="https://media.example.com/video.mp4"></video>
            <div id="dup-1">Div 1</div>
            <div id="dup-1">Div 2</div>
          </body>
        </html>
      `;

      const result = analyzeContent(complexHtml, { finalUrl: 'https://example.com/' });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();

      // Assert ZERO network or DNS calls occurred
      expect(httpReqSpy).not.toHaveBeenCalled();
      expect(httpGetSpy).not.toHaveBeenCalled();
      expect(httpsReqSpy).not.toHaveBeenCalled();
      expect(httpsGetSpy).not.toHaveBeenCalled();
      expect(dnsLookupSpy).not.toHaveBeenCalled();
      expect(dnsResolveSpy).not.toHaveBeenCalled();
    });
  });

  describe('Visible Text & Word/Char Counting Semantics', () => {
    test('ignores text in head, script, style, noscript, template, svg, and HTML comments', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Head Title Ignored</title>
            <style>body { color: red; } /* Style text ignored */</style>
            <script>console.log('Script text ignored');</script>
          </head>
          <body>
            <!-- HTML Comment Ignored -->
            <noscript>Noscript text ignored</noscript>
            <template><p>Template text ignored</p></template>
            <svg><text>SVG text ignored</text></svg>
            <p>This is visible body text with sufficient word count to verify body text extraction logic properly.</p>
          </body>
        </html>
      `;
      const res = analyzeContent(html);
      const wordCountFinding = res.findings.find(f => f.id.startsWith('content-') && (f.id.includes('word') || f.id.includes('volume') || f.id.includes('empty')));
      expect(wordCountFinding).toBeDefined();
      expect(wordCountFinding.value.wordCount).toBe(16);
    });

    test('accurately counts Unicode code points for character counting', () => {
      const html = `<html><body><p>Hello 🚀 world!</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.value && f.value.charCount !== undefined);
      // 'Hello 🚀 world!' -> 14 code points
      expect(finding.value.charCount).toBe(14);
    });

    test('flags 0 visible words as content-empty-page (warn)', () => {
      const html = `<html><body></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-empty-page');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('warn');
      expect(finding.severity).toBe('medium');
    });

    test('flags 1 visible word as content-low-volume (warn)', () => {
      const html = `<html><body><p>Hello</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-low-volume');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('warn');
      expect(finding.value.wordCount).toBe(1);
    });

    test('flags 49 visible words as content-low-volume (warn)', () => {
      const words = Array(49).fill('word').join(' ');
      const html = `<html><body><p>${words}</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-low-volume');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('warn');
      expect(finding.value.wordCount).toBe(49);
    });

    test('flags 50 visible words as content-word-count (pass)', () => {
      const words = Array(50).fill('word').join(' ');
      const html = `<html><body><p>${words}</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-word-count');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('pass');
      expect(finding.value.wordCount).toBe(50);
    });
  });

  describe('Duplicate Block Text & Nested Container Semantics', () => {
    test('enforces word threshold: 7 words (not candidate) vs 8 words (candidate)', () => {
      const text7 = 'Word one two three four five six'; // 7 words
      const text8 = 'Word one two three four five six seven'; // 8 words

      const html7 = `<html><body><p>${text7}</p><p>${text7}</p><p>${text7}</p></body></html>`;
      let res = analyzeContent(html7);
      expect(res.findings.find(f => f.id === 'content-duplicate-paragraphs')).toBeUndefined();

      const html8 = `<html><body><p>${text8}</p><p>${text8}</p><p>${text8}</p></body></html>`;
      res = analyzeContent(html8);
      const finding = res.findings.find(f => f.id === 'content-duplicate-paragraphs');
      expect(finding).toBeDefined();
      expect(finding.value.duplicateBlockPatterns).toBe(1);
    });

    test('enforces occurrence threshold: 2 occurrences (not flagged) vs 3 occurrences (flagged)', () => {
      const text8 = 'Word one two three four five six seven'; // 8 words

      const html2 = `<html><body><p>${text8}</p><p>${text8}</p></body></html>`;
      let res = analyzeContent(html2);
      expect(res.findings.find(f => f.id === 'content-duplicate-paragraphs')).toBeUndefined();

      const html3 = `<html><body><p>${text8}</p><p>${text8}</p><p>${text8}</p></body></html>`;
      res = analyzeContent(html3);
      const finding = res.findings.find(f => f.id === 'content-duplicate-paragraphs');
      expect(finding).toBeDefined();
      expect(finding.value.duplicateBlockPatterns).toBe(1);
    });

    test('handles nested container block cases without double-counting wrapper elements', () => {
      const text8 = 'Word one two three four five six seven';

      // 1. Qualifying parent container wrapper with 0 direct text and child block
      const htmlWrapperZeroDirect = `
        <html>
          <body>
            <div class="card">
              <p>${text8}</p>
            </div>
            <div class="card">
              <p>${text8}</p>
            </div>
          </body>
        </html>
      `;
      let res = analyzeContent(htmlWrapperZeroDirect);
      // Repeated 2 times at paragraph level; wrapper divs have 0 direct words, so they are not candidates.
      expect(res.findings.find(f => f.id === 'content-duplicate-paragraphs')).toBeUndefined();

      // 2. Parent and child having identical visible text (parent wrapper has no direct text of its own)
      const htmlIdentical = `
        <html>
          <body>
            <div><p>${text8}</p></div>
            <div><p>${text8}</p></div>
          </body>
        </html>
      `;
      res = analyzeContent(htmlIdentical);
      expect(res.findings.find(f => f.id === 'content-duplicate-paragraphs')).toBeUndefined();

      // 3. Deeply nested wrappers: <article><section><div><p>...</p></div></section></article>
      const htmlDeepNested = `
        <html>
          <body>
            <article><section><div><p>${text8}</p></div></section></article>
            <article><section><div><p>${text8}</p></div></section></article>
          </body>
        </html>
      `;
      res = analyzeContent(htmlDeepNested);
      expect(res.findings.find(f => f.id === 'content-duplicate-paragraphs')).toBeUndefined();

      // 4. Adjacent independent qualifying blocks
      const htmlAdjacent = `
        <html>
          <body>
            <p>${text8}</p>
            <p>${text8}</p>
            <p>${text8}</p>
          </body>
        </html>
      `;
      res = analyzeContent(htmlAdjacent);
      expect(res.findings.find(f => f.id === 'content-duplicate-paragraphs')).toBeDefined();

      // 5. Wrapper with its own direct text (>= 8 words) plus descendant text
      const htmlDirectAndChild = `
        <html>
          <body>
            <div>
              Direct wrapper text containing more than eight words to qualify independently.
              <p>${text8}</p>
            </div>
            <div>
              Direct wrapper text containing more than eight words to qualify independently.
              <p>${text8}</p>
            </div>
            <div>
              Direct wrapper text containing more than eight words to qualify independently.
              <p>${text8}</p>
            </div>
          </body>
        </html>
      `;
      res = analyzeContent(htmlDirectAndChild);
      const finding = res.findings.find(f => f.id === 'content-duplicate-paragraphs');
      expect(finding).toBeDefined();
      // Both wrapper direct text and child paragraph text repeated 3 times -> 2 duplicate patterns!
      expect(finding.value.duplicateBlockPatterns).toBe(2);
    });
  });

  describe('Document Structure 3-State Evaluation', () => {
    test('returns pass when html, head, and body tags are all present', () => {
      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><p>Body</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-document-structure');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('pass');
    });

    test('returns warn and identifies missing <html> tag', () => {
      const html = `<head><title>Test</title></head><body><p>Body</p></body>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-document-structure');
      expect(finding.status).toBe('warn');
      expect(finding.value.missingTags).toEqual(['<html>']);
    });

    test('returns warn and identifies missing <head> tag', () => {
      const html = `<html><body><p>Body</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-document-structure');
      expect(finding.status).toBe('warn');
      expect(finding.value.missingTags).toEqual(['<head>']);
    });

    test('returns warn and identifies missing <body> tag', () => {
      const html = `<html><head><title>Test</title></head></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-document-structure');
      expect(finding.status).toBe('warn');
      expect(finding.value.missingTags).toEqual(['<body>']);
    });
  });

  describe('Duplicate Element IDs', () => {
    test('returns pass when 0 duplicate IDs exist', () => {
      const html = `<html><body><div id="main"></div><div id="content"></div></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-duplicate-ids');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('pass');
      expect(finding.value.totalDuplicates).toBe(0);
    });

    test('bounds duplicate ID list to max 10 items and sets hasMoreDuplicates flag when > 10', () => {
      const duplicateIds = Array.from({ length: 12 }, (_, i) => `<div id="dup-${i}"></div><div id="dup-${i}"></div>`).join('');
      const html = `<html><body>${duplicateIds}</body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-duplicate-ids');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('warn');
      expect(finding.value.totalDuplicates).toBe(12);
      expect(finding.value.duplicateIds.length).toBe(10);
      expect(finding.value.hasMoreDuplicates).toBe(true);
    });
  });

  describe('Link Classification & Placeholder Href Thresholds', () => {
    test('evaluates empty/placeholder href thresholds: 0 (pass), 1 (info), 2 (info), 3 (warn)', () => {
      // 0 placeholders -> pass
      let res = analyzeContent(`<html><body><a href="/about">Link</a></body></html>`);
      let finding = res.findings.find(f => f.id === 'content-href-markup');
      expect(finding.status).toBe('pass');

      // 1 placeholder -> info
      res = analyzeContent(`<html><body><a href="">Link 1</a></body></html>`);
      finding = res.findings.find(f => f.id === 'content-href-markup');
      expect(finding.status).toBe('info');

      // 2 placeholders -> info
      res = analyzeContent(`<html><body><a href="">Link 1</a><a href="#">Link 2</a></body></html>`);
      finding = res.findings.find(f => f.id === 'content-href-markup');
      expect(finding.status).toBe('info');

      // 3 placeholders -> warn
      res = analyzeContent(`<html><body><a href="">Link 1</a><a href="#">Link 2</a><a href="javascript:;">Link 3</a></body></html>`);
      finding = res.findings.find(f => f.id === 'content-href-markup');
      expect(finding.status).toBe('warn');
    });

    test('handles malformed href strings safely without throwing', () => {
      const html = `<html><body><a href="http://:invalid url">Link</a></body></html>`;
      expect(() => analyzeContent(html)).not.toThrow();
    });
  });

  describe('Resource Src Validity', () => {
    test('returns pass when all media/script resources specify valid src', () => {
      const html = `
        <html>
          <body>
            <img src="logo.png" />
            <iframe src="frame.html"></iframe>
            <script src="app.js"></script>
            <audio src="audio.mp3"></audio>
            <video src="video.mp4"></video>
          </body>
        </html>
      `;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-src-markup');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('pass');
    });

    test('flags missing/empty src on img, iframe, script, audio, video as warn', () => {
      const html = `
        <html>
          <body>
            <img src="" />
            <iframe></iframe>
            <script src="#"></script>
            <audio src="javascript:void(0)"></audio>
            <video></video>
          </body>
        </html>
      `;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-src-markup');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('warn');
      expect(finding.value.invalidSrcCount).toBe(5);
    });
  });

  describe('Image Dimensions Markup', () => {
    test('returns pass when all images have valid positive integer width and height attributes', () => {
      const html = `<html><body><img src="pic.jpg" width="800" height="600" /></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-image-dimensions');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('pass');
    });

    test('flags missing, empty, non-numeric, 0, or negative dimensions as warn', () => {
      const html = `
        <html>
          <body>
            <img src="pic1.jpg" width="800" /> <!-- missing height -->
            <img src="pic2.jpg" width="" height="600" /> <!-- empty width -->
            <img src="pic3.jpg" width="abc" height="600" /> <!-- non-numeric -->
            <img src="pic4.jpg" width="0" height="100" /> <!-- zero width -->
            <img src="pic5.jpg" width="-50" height="100" /> <!-- negative width -->
          </body>
        </html>
      `;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-image-dimensions');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('warn');
      expect(finding.value.imagesMissingOrInvalidDimensions).toBe(5);
    });

    test('returns info when 0 images present', () => {
      const html = `<html><body><p>No images here</p></body></html>`;
      const res = analyzeContent(html);
      const finding = res.findings.find(f => f.id === 'content-image-dimensions');
      expect(finding).toBeDefined();
      expect(finding.status).toBe('info');
    });
  });

  describe('Sensitive Data Non-Leakage Proof', () => {
    test('does NOT expose raw sensitive href or src query parameters/tokens in finding objects', () => {
      const sensitiveToken = 'SECRET_SENSITIVE_API_TOKEN_99999_EXPLICIT_NON_LEAK_CHECK';
      const html = `
        <html>
          <body>
            <a href="https://example.com/reset-password?token=${sensitiveToken}">Reset Password</a>
            <img src="https://cdn.example.com/avatar.jpg?auth_key=${sensitiveToken}" width="100" height="100">
          </body>
        </html>
      `;
      const res = analyzeContent(html, { finalUrl: 'https://example.com/' });
      const serializedResult = JSON.stringify(res);

      expect(serializedResult).not.toContain(sensitiveToken);
    });
  });
});
