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

    it('handles null, undefined, and non-string types safely', () => {
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
      expect(sanitizeCsvCell(404)).toBe('"404"');
    });
  });

  describe('generateFindingsCsv', () => {
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

      expect(lines[0]).toBe('"Category","Finding ID","Status","Severity","Title","Message","Value","Recommendation"');
      expect(lines[1]).toContain('"seo","seo-title-missing","fail","high"');
      // Verify CSV injection protection on line 2 (prefixed with single quote)
      expect(lines[2]).toContain('"\'=DANGEROUS_FORMULA()"');
    });

    it('returns empty string if report or categories are missing', () => {
      expect(generateFindingsCsv(null)).toBe('');
      expect(generateFindingsCsv({})).toBe('');
    });
  });

  describe('Download triggers', () => {
    it('safely handles JSON and CSV export triggers', () => {
      const createSpy = vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeSpy = vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});

      const mockReport = {
        scanId: 'scan_0123456789abcdef',
        categories: {},
      };

      exportReportToJson(mockReport);
      expect(createSpy).toHaveBeenCalled();

      exportReportToCsv(mockReport);
      expect(createSpy).toHaveBeenCalledTimes(2);

      createSpy.mockRestore();
      revokeSpy.mockRestore();
    });
  });
});
