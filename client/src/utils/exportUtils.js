/**
 * Sanitizes a cell string to prevent CSV formula injection attacks in Excel / Google Sheets.
 * If a cell string starts with =, +, -, @, \t, or \r, prefixes it with a single quote (').
 * Also escapes double quotes and wraps cells containing commas or newlines in double quotes.
 *
 * @param {any} val Cell value
 * @returns {string} Safe CSV cell string
 */
export const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // CSV Formula Injection mitigation: prefix with single quote if leading char is unsafe
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Double up existing double quotes
  const escaped = str.replace(/"/g, '""');

  // Wrap in double quotes if it contains quotes, commas, or newlines
  return `"${escaped}"`;
};

/**
 * Converts a public report DTO into a CSV string listing all findings across all 8 categories.
 *
 * @param {object} report Public report DTO
 * @returns {string} CSV content
 */
export const generateFindingsCsv = (report) => {
  if (!report || !report.categories) return '';

  const headers = ['Finding ID', 'Category', 'Status', 'Severity', 'Title', 'Message', 'Value', 'Recommendation'];
  const rows = [headers.map(sanitizeCsvCell).join(',')];

  const categoryKeys = Object.keys(report.categories);

  categoryKeys.forEach((catKey) => {
    const categoryObj = report.categories[catKey];
    if (categoryObj && Array.isArray(categoryObj.findings)) {
      categoryObj.findings.forEach((finding) => {
        const row = [
          finding.id || finding.findingId || '',
          catKey,
          finding.status || '',
          finding.severity || '',
          finding.title || '',
          finding.message || '',
          finding.value !== null && finding.value !== undefined ? finding.value : '',
          finding.recommendation || '',
        ];
        rows.push(row.map(sanitizeCsvCell).join(','));
      });
    }
  });

  return rows.join('\r\n');
};

/**
 * Triggers a browser file download for text or blob data.
 *
 * @param {string} filename 
 * @param {string} mimeType 
 * @param {string} content 
 */
export const downloadFile = (filename, mimeType, content) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports the public report DTO as a downloadable JSON file.
 *
 * @param {object} report 
 */
export const exportReportToJson = (report) => {
  if (!report || !report.scanId) return;
  const filename = `${report.scanId}.json`;
  const jsonContent = JSON.stringify(report, null, 2);
  downloadFile(filename, 'application/json', jsonContent);
};

/**
 * Exports the report's findings as a downloadable CSV file.
 *
 * @param {object} report 
 */
export const exportReportToCsv = (report) => {
  if (!report || !report.scanId) return;
  const filename = `${report.scanId}-findings.csv`;
  const csvContent = generateFindingsCsv(report);
  downloadFile(filename, 'text/csv;charset=utf-8;', csvContent);
};
