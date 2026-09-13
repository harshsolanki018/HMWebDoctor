const { analyzeCrawlability } = require('../src/scanners/crawlabilityAnalyzer');

describe('Crawlability Analyzer Boundary Verification Suite', () => {
  it('detects X-Robots-Tag header and HTML sitemap link tag', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      statusCode: 200,
      html: 'User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml',
    });

    const html = '<html><head><link rel="sitemap" href="/sitemap.xml"></head></html>';
    const headers = { 'x-robots-tag': 'noindex, nofollow' };
    const res = await analyzeCrawlability(html, headers, 'https://example.com/page/1', mockFetch);

    expect(res.findings.find((f) => f.id === 'crawl-x-robots-tag').status).toBe('info');
    expect(res.findings.find((f) => f.id === 'crawl-html-sitemap').status).toBe('pass');

    // Verify robots.txt fetch was invoked exactly once with origin/robots.txt
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/robots.txt');

    const robotsFinding = res.findings.find((f) => f.id === 'crawl-robots-txt');
    expect(robotsFinding.status).toBe('pass');
    expect(robotsFinding.value.exists).toBe(true);
    expect(robotsFinding.value.disallowRuleCount).toBe(1);
    expect(robotsFinding.value.sitemapDirectiveCount).toBe(1);
  });

  it('verifies strict bounds: sitemap URLs and rule paths in robots.txt are NOT fetched or crawled', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      statusCode: 200,
      html: 'User-agent: *\nDisallow: /secret-admin-area\nDisallow: /private-user-data\nSitemap: https://example.com/sitemap_index.xml\nSitemap: https://example.com/sitemap_news.xml',
    });

    const html = '<html><head></head><body><a href="/secret-admin-area">Link</a></body></html>';
    const res = await analyzeCrawlability(html, {}, 'https://example.com/blog/article-1', mockFetch);

    // Strictly 1 request to origin/robots.txt
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/robots.txt');
    expect(mockFetch).not.toHaveBeenCalledWith('https://example.com/sitemap_index.xml');
    expect(mockFetch).not.toHaveBeenCalledWith('https://example.com/secret-admin-area');

    const robotsFinding = res.findings.find((f) => f.id === 'crawl-robots-txt');
    expect(robotsFinding.value.disallowRuleCount).toBe(2);
    expect(robotsFinding.value.sitemapDirectiveCount).toBe(2);
  });

  it('handles robots.txt HTTP 404 or network error gracefully without failing primary scan', async () => {
    const mockFetch404 = vi.fn().mockResolvedValue({ statusCode: 404, html: 'Not Found' });
    const res404 = await analyzeCrawlability('', {}, 'https://example.com', mockFetch404);
    expect(mockFetch404).toHaveBeenCalledTimes(1);
    expect(res404.findings.find((f) => f.id === 'crawl-robots-txt').status).toBe('info');
    expect(res404.findings.find((f) => f.id === 'crawl-robots-txt').value.exists).toBe(false);

    const mockFetchErr = vi.fn().mockRejectedValue(new Error('Network unreachable'));
    const resErr = await analyzeCrawlability('', {}, 'https://example.com', mockFetchErr);
    expect(mockFetchErr).toHaveBeenCalledTimes(1);
    expect(resErr.findings.find((f) => f.id === 'crawl-robots-txt').status).toBe('info');
    expect(resErr.findings.find((f) => f.id === 'crawl-robots-txt').value.exists).toBe(false);
  });

  it('verifies summary consistency: summary counts equal count of findings matching status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ statusCode: 404 });
    const res = await analyzeCrawlability('', {}, 'https://example.com', mockFetch);

    expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
    expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
    expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
    expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
  });
});
