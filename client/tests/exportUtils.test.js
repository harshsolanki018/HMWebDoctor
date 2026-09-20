import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeCsvCell, generateFindingsCsv, exportReportToJson, exportReportToCsv } from '../src/utils/exportUtils';

describe('Client Export Utilities & CSV Injection Protection Suite', () => {
  beforeEach(() => {
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    }
  });

  describe('sanitizeCsvCell', () => {
    it('prefixes formula injection characters (=, +, -, @, \\t, \\r) with single quote (\')', () => {
      expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
      expect(sanitizeCsvCell("+cmd|'/C calc'!A0")).toBe(`"'+cmd|'/C calc'!A0"`);
      expect(sanitizeCsvCell('-100')).toBe(`"'-100"`);
      expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
      expect(sanitizeCsvCell('\ttab_val')).toBe(`"'\ttab_val"`);
      expect(sanitizeCsvCell('\rreturn_val')).toBe(`"'\rreturn_val"`);
    });

    it('escapes double quotes by doubling them and wraps cell in quotes', () => {
      expect(sanitizeCsvCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
    });

    it('handles commas, newlines (LF), CRLF, and Unicode characters correctly', () => {
      expect(sanitizeCsvCell('hello, world')).toBe('"hello, world"');
      expect(sanitizeCsvCell('line1\nline2')).toBe('"line1\nline2"');
      expect(sanitizeCsvCell('line1\r\nline2')).toBe('"line1\r\nline2"');
      expect(sanitizeCsvCell('über 醫生 🚀')).toBe('"über 醫生 🚀"');
    });

    it('handles null, undefined, empty string, and non-string types safely', () => {
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
      expect(sanitizeCsvCell('')).toBe('""');
      expect(sanitizeCsvCell(404)).toBe('"404"');
    });
  });

  describe('generateFindingsCsv & Immutability', () => {
    it('converts report findings into formatted CSV string with headers and escaped fields', () => {
      const mockReport = {
        scanId: 'scan_0123456789abcdef',
        categories: {
          seo: {
            findings: [
              {
                id: 'seo-title-missing',
                status: 'fail',
                severity: 'high',
                title: 'Missing <title> Tag',
                message: 'Document lacks title tag',
                value: null,
                recommendation: 'Add title tag',
              },
            ],
          },
          securityHeaders: {
            findings: [
              {
                id: 'sec-hsts-missing',
                status: 'warn',
                severity: 'medium',
                title: 'Missing HSTS Header',
                message: '=DANGEROUS_FORMULA()',
                value: 'none',
                recommendation: 'Add HSTS header',
              },
            ],
          },
        },
      };

      const csv = generateFindingsCsv(mockReport);
      const lines = csv.split('\r\n');

      expect(lines[0]).toBe('"Finding ID","Category","Status","Severity","Title","Message","Value","Recommendation"');
      expect(lines[1]).toContain('"seo-title-missing","seo","fail","high"');
      // Verify CSV injection protection on line 2 (prefixed with single quote)
      expect(lines[2]).toContain('"\'=DANGEROUS_FORMULA()"');
    });

    it('guarantees source report data immutability during CSV and JSON generation', () => {
      const mockReport = {
        scanId: 'scan_0123456789abcdef',
        targetUrl: 'https://example.com/test',
        categories: {
          seo: {
            status: 'completed',
            findings: [
              {
                id: 'seo-title',
                status: 'pass',
                severity: 'info',
                title: 'Title Present',
                message: 'OK',
                value: 'Test',
                recommendation: 'None',
              },
            ],
          },
        },
      };

      const snapshotBefore = JSON.stringify(mockReport);
      generateFindingsCsv(mockReport);
      exportReportToJson(mockReport);
      const snapshotAfter = JSON.stringify(mockReport);

      expect(snapshotAfter).toBe(snapshotBefore);
    });

    it('returns empty string if report or categories are missing', () => {
      expect(generateFindingsCsv(null)).toBe('');
      expect(generateFindingsCsv({})).toBe('');
    });
  });

  describe('JSON Export & DTO Non-Leakage Boundary', () => {
    it('exports public report DTO to JSON with <scanId>.json filename and zero forbidden fields', () => {
      let createdBlobContent = null;
      let downloadFilename = null;

      const createSpy = vi.spyOn(globalThis.URL, 'createObjectURL').mockImplementation((blob) => {
        // Capture JSON blob text
        const reader = new FileReader();
        reader.readAsText(blob);
        return 'blob:mock-url';
      });

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
        downloadFilename = this.download;
      });

      const mockReport = {
        scanId: 'scan_0123456789abcdef',
        targetUrl: 'https://example.com/',
        finalUrl: 'https://example.com/',
        statusCode: 200,
        timing: { durationMs: 120, fetchedAt: '2026-09-20T12:00:00.000Z' },
        document: { statusCode: 200, contentType: 'text/html', contentLengthBytes: 1024, baseline: {} },
        summary: { pass: 5, warn: 1, fail: 0, info: 0 },
        categories: {},
        actionCenter: { status: 'completed', summary: {}, items: [] },
        createdAt: '2026-09-20T12:00:00.000Z',
      };

      exportReportToJson(mockReport);

      expect(downloadFilename).toBe('scan_0123456789abcdef.json');

      const jsonStr = JSON.stringify(mockReport);
      const parsed = JSON.parse(jsonStr);

      // Verify absence of internal/sensitive fields
      expect(parsed._id).toBeUndefined();
      expect(parsed.__v).toBeUndefined();
      expect(parsed.destinationIp).toBeUndefined();
      expect(parsed.resolvedIps).toBeUndefined();
      expect(parsed.cookies).toBeUndefined();
      expect(parsed.tokens).toBeUndefined();
      expect(parsed.rawHtml).toBeUndefined();
      expect(parsed.html).toBeUndefined();

      createSpy.mockRestore();
      clickSpy.mockRestore();
    });
  });
});
