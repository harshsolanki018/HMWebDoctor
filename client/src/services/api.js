const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch system health status from server (/api/health)
 */
export const fetchHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to backend server',
      },
    };
  }
};

/**
 * Execute baseline scan for target URL (/api/scans)
 * @param {string} url Target website URL
 */
export const executeScan = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to communicate with scanning server',
      },
    };
  }
};

/**
 * Retrieve public scan report by scanId (/api/scans/:scanId)
 * @param {string} scanId Standard scan ID (scan_[16 hex chars])
 */
export const getScanById = async (scanId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/scans/${encodeURIComponent(scanId)}`);
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to retrieve scan report from server',
      },
    };
  }
};

