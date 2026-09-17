const { remediationRegistry } = require('./remediationRegistry');

/**
 * Deterministic Remediation Engine (M8)
 * Performs static lookup against the remediation registry.
 * Performs ZERO dynamic parameter interpolation, ZERO network calls, and ZERO AI calls.
 *
 * @param {object} finding Finding object
 * @returns {object|null} Static remediation guide or null if unavailable / error finding
 */
function getRemediationForFinding(finding) {
  if (!finding || typeof finding !== 'object') {
    return null;
  }

  const { id } = finding;
  if (!id || id === 'category-error') {
    return null;
  }

  const guide = remediationRegistry[id];
  if (!guide) {
    return null;
  }

  // Return static clone of remediation guide object
  return {
    summary: guide.summary,
    impact: guide.impact,
    codeFix: guide.codeFix,
    steps: [...guide.steps],
    verification: guide.verification,
  };
}

module.exports = {
  getRemediationForFinding,
};
