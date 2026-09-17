const fs = require('fs');
const path = require('path');
const { remediationRegistry, remediationSchema } = require('../src/remediation/remediationRegistry');
const { getRemediationForFinding } = require('../src/remediation/remediationEngine');

describe('Remediation Registry & Engine Suite (M8)', () => {
  let emittedFindingIds = [];

  beforeAll(() => {
    const scannerDir = path.join(__dirname, '../src/scanners');
    const files = fs.readdirSync(scannerDir).filter(f => f.endsWith('.js') && f !== 'baselineAnalyzer.js');
    const idSet = new Set();

    files.forEach((file) => {
      const content = fs.readFileSync(path.join(scannerDir, file), 'utf8');
      const matches = Array.from(content.matchAll(/id:\s*['"]([^'"]+)['"]/g)).map(m => m[1]);
      matches.forEach(id => idSet.add(id));
    });

    emittedFindingIds = Array.from(idSet).sort();
  });

  test('dynamically extracts exact 55 finding IDs from accepted scanner source code', () => {
    expect(emittedFindingIds.length).toBe(55);
  });

  test('enforces CURRENT_EMITTED_FINDING_IDS ⊆ REMEDIATION_REGISTRY_IDS', () => {
    const registryIds = new Set(Object.keys(remediationRegistry));
    const missingIds = emittedFindingIds.filter(id => !registryIds.has(id));

    expect(missingIds).toEqual([]);
  });

  test('enforces REMEDIATION_REGISTRY_IDS - CURRENT_EMITTED_FINDING_IDS is empty (no stale entries)', () => {
    const emittedSet = new Set(emittedFindingIds);
    const registryIds = Object.keys(remediationRegistry);
    const staleIds = registryIds.filter(id => !emittedSet.has(id));

    expect(staleIds).toEqual([]);
  });

  test('validates every single entry in remediationRegistry against remediationSchema', () => {
    Object.entries(remediationRegistry).forEach(([_id, guide]) => {
      const result = remediationSchema.safeParse(guide);
      expect(result.success).toBe(true);
      expect(guide.summary.length).toBeGreaterThanOrEqual(10);
      expect(guide.impact.length).toBeGreaterThanOrEqual(10);
      expect(guide.steps.length).toBeGreaterThanOrEqual(1);
      expect(guide.verification.length).toBeGreaterThanOrEqual(10);
      if (guide.codeFix !== null) {
        expect(guide.codeFix.length).toBeGreaterThanOrEqual(5);
      }
    });
  });

  test('does NOT include category-error in remediationRegistry', () => {
    expect(remediationRegistry['category-error']).toBeUndefined();
    expect(getRemediationForFinding({ id: 'category-error' })).toBeNull();
  });

  test('returns null for unknown finding IDs or invalid inputs', () => {
    expect(getRemediationForFinding(null)).toBeNull();
    expect(getRemediationForFinding(undefined)).toBeNull();
    expect(getRemediationForFinding({})).toBeNull();
    expect(getRemediationForFinding({ id: 'unknown-future-id-123' })).toBeNull();
  });

  test('contains only static text and generic placeholders in remediation guides', () => {
    const sensitiveTokens = ['SECRET_KEY', 'SECRET_TOKEN', 'PASSWORD123', '127.0.0.1', 'LOCALHOST'];
    Object.values(remediationRegistry).forEach((guide) => {
      const jsonStr = JSON.stringify(guide).toUpperCase();
      sensitiveTokens.forEach((token) => {
        expect(jsonStr).not.toContain(token);
      });
    });
  });
});
