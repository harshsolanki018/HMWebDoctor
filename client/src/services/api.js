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
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      // Handle malformed JSON API responses (e.g. {"hello": "world"} or {"success": true} without data)
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success && (!result.data || typeof result.data !== 'object')) {
          return {
            success: false,
            data: null,
            error: {
              code: 'INVALID_RESPONSE',
              message: 'Server returned a malformed or incomplete scan report payload.',
            },
          };
        }
        return result;
      }
      return {
        success: false,
        data: null,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Server returned a malformed response envelope.',
        },
      };
    }
    return {
      success: false,
      data: null,
      error: {
        code: response.status === 503 ? 'DATABASE_UNAVAILABLE' : 'SERVER_ERROR',
        message: response.status === 503
          ? 'Report storage is temporarily unavailable.'
          : `Server returned unexpected response (HTTP ${response.status}).`,
      },
    };
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return {
        success: false,
        data: null,
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Request timed out while communicating with the server.',
        },
      };
    }
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

/**
 * Fetch system readiness status from server (/api/ready)
 */
export const fetchReadiness = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ready`);
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result;
    }
    return {
      success: false,
      data: null,
      error: {
        code: 'SERVICE_NOT_READY',
        message: 'Report storage service is not ready.',
      },
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to readiness endpoint',
      },
    };
  }
};

