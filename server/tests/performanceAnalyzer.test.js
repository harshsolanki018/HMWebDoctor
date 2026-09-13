const { analyzePerformance } = require('../src/scanners/performanceAnalyzer');

describe('Performance & Resource Analyzer Unit Tests (M5)', () => {
  it('throws TypeError if html input is not a string', () => {
    expect(() => analyzePerformance(null)).toThrow(TypeError);
    expect(() => analyzePerformance(123)).toThrow(TypeError);
  });

  it('evaluates script tag classifications (synchronous head scripts, async, defer, module, inline)', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://example.com/sync-head.js"></script>
          <script src="https://example.com/async-head.js" async></script>
          <script src="https://example.com/defer-head.js" defer></script>
          <script src="https://example.com/module-head.js" type="module"></script>
        </head>
        <body>
          <script>console.log("Inline script 1");</script>
          <script src="https://example.com/body-sync.js"></script>
        </body>
      </html>
    `;

    const res = analyzePerformance(html, {});
    const scriptFinding = res.findings.find((f) => f.id === 'perf-blocking-scripts');

    expect(scriptFinding.status).toBe('warn');
    expect(scriptFinding.value.totalScripts).toBe(6);
    expect(scriptFinding.value.headSynchronousScripts).toBe(1);
    expect(scriptFinding.value.asyncScripts).toBe(1);
    expect(scriptFinding.value.deferScripts).toBe(1);
    expect(scriptFinding.value.moduleScripts).toBe(1);
    expect(scriptFinding.value.inlineScripts).toBe(1);
  });

  it('passes script check when all head scripts are non-blocking or placed in body', () => {
    const html = `
      <html>
        <head>
          <script src="/script1.js" defer></script>
          <script src="/script2.js" async></script>
        </head>
        <body></body>
      </html>
    `;

    const res = analyzePerformance(html, {});
    const scriptFinding = res.findings.find((f) => f.id === 'perf-blocking-scripts');
    expect(scriptFinding.status).toBe('pass');
  });

  it('evaluates external stylesheets, inline style count, and inline CSS payload size', () => {
    const inlineCssText = '.class { color: red; } '.repeat(10);
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/style1.css">
          <link rel="stylesheet" href="/style2.css">
          <style>${inlineCssText}</style>
        </head>
        <body></body>
      </html>
    `;

    const res = analyzePerformance(html, {});
    const cssFinding = res.findings.find((f) => f.id === 'perf-stylesheets-css');

    expect(cssFinding.status).toBe('pass');
    expect(cssFinding.value.externalStylesheetCount).toBe(2);
    expect(cssFinding.value.inlineStyleCount).toBe(1);
    expect(cssFinding.value.aggregateInlineCssBytes).toBeGreaterThan(0);
    expect(res.findings.some((f) => f.id === 'perf-inline-css')).toBe(false);
  });

  it('flags aggregate inline CSS payload exceeding 20KB threshold with info finding', () => {
    const largeCss = 'p { font-size: 16px; } '.repeat(1000); // > 20KB
    const html = `<html><head><style>${largeCss}</style></head><body></body></html>`;

    const res = analyzePerformance(html, {});
    const inlineCssFinding = res.findings.find((f) => f.id === 'perf-inline-css');

    expect(inlineCssFinding).toBeDefined();
    expect(inlineCssFinding.status).toBe('info');
    expect(inlineCssFinding.value.aggregateInlineCssBytes).toBeGreaterThan(20480);
  });

  it('evaluates browser resource hints (preconnect, dns-prefetch, preload, modulepreload)', () => {
    const htmlWithHints = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="dns-prefetch" href="https://cdn.example.com">
          <link rel="preload" href="/hero.png" as="image">
          <link rel="modulepreload" href="/app.js">
        </head>
        <body></body>
      </html>
    `;

    const resWithHints = analyzePerformance(htmlWithHints, {});
    const hintsFindingPass = resWithHints.findings.find((f) => f.id === 'perf-resource-hints');

    expect(hintsFindingPass.status).toBe('pass');
    expect(hintsFindingPass.value.preconnectCount).toBe(1);
    expect(hintsFindingPass.value.dnsPrefetchCount).toBe(1);
    expect(hintsFindingPass.value.preloadCount).toBe(1);
    expect(hintsFindingPass.value.modulepreloadCount).toBe(1);

    const htmlNoHints = '<html><head></head><body></body></html>';
    const resNoHints = analyzePerformance(htmlNoHints, {});
    const hintsFindingInfo = resNoHints.findings.find((f) => f.id === 'perf-resource-hints');

    expect(hintsFindingInfo.status).toBe('info');
  });

  it('evaluates total DOM element count and resource element footprints (img, video, audio, iframe)', () => {
    const html = `
      <html>
        <body>
          <div>
            <img src="img1.jpg" alt="test">
            <video src="video.mp4"></video>
            <audio src="audio.mp3"></audio>
            <iframe src="frame.html"></iframe>
          </div>
        </body>
      </html>
    `;

    const res = analyzePerformance(html, {});
    const domFinding = res.findings.find((f) => f.id === 'perf-dom-footprint');

    expect(domFinding.status).toBe('pass');
    expect(domFinding.value.imgCount).toBe(1);
    expect(domFinding.value.videoCount).toBe(1);
    expect(domFinding.value.audioCount).toBe(1);
    expect(domFinding.value.iframeCount).toBe(1);
  });

  it('flags DOM element footprint exceeding 1,500 elements threshold', () => {
    const manyElements = '<div><span>item</span></div>'.repeat(800); // > 1600 elements
    const html = `<html><body>${manyElements}</body></html>`;

    const res = analyzePerformance(html, {});
    const domFinding = res.findings.find((f) => f.id === 'perf-dom-footprint');

    expect(domFinding.status).toBe('info');
    expect(domFinding.value.totalElements).toBeGreaterThan(1500);
  });

  it('evaluates image lazy-loading attribute markup (loading="lazy")', () => {
    const html = `
      <html>
        <body>
          <img src="1.jpg" loading="lazy">
          <img src="2.jpg" loading="lazy">
          <img src="3.jpg" loading="eager">
          <img src="4.jpg">
        </body>
      </html>
    `;

    const res = analyzePerformance(html, {});
    const imgFinding = res.findings.find((f) => f.id === 'perf-image-lazyloading');

    expect(imgFinding.status).toBe('pass');
    expect(imgFinding.value.totalImages).toBe(4);
    expect(imgFinding.value.lazyLoadedImages).toBe(2);
    expect(imgFinding.value.eagerOrUnspecifiedImages).toBe(2);
  });

  it('verifies summary consistency: summary counts equal count of findings matching status', () => {
    const html = '<html><head><title>Test</title></head><body><script src="test.js"></script></body></html>';
    const res = analyzePerformance(html, {});

    expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
    expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
    expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
    expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
  });

  it('handles empty and malformed HTML strings gracefully without throwing errors', () => {
    const emptyRes = analyzePerformance('', {});
    expect(emptyRes.summary).toBeDefined();

    const malformedRes = analyzePerformance('<div class="unclosed"><script src="test.js"><link rel="stylesheet">', {});
    expect(malformedRes.summary).toBeDefined();
  });

  it('verifies performanceAnalyzer performs zero outbound network calls during analysis', () => {
    const http = require('http');
    const https = require('https');
    const httpSpy = vi.spyOn(http, 'request');
    const httpsSpy = vi.spyOn(https, 'request');

    const html = '<html><head><link rel="preconnect" href="https://example.com"><script src="https://example.com/test.js"></script></head><body></body></html>';
    analyzePerformance(html, {});

    expect(httpSpy).not.toHaveBeenCalled();
    expect(httpsSpy).not.toHaveBeenCalled();

    httpSpy.mockRestore();
    httpsSpy.mockRestore();
  });
});
