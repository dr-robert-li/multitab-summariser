// Enhanced error handling utilities for Multi-Tab Summarizer

class ExtensionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

const ErrorCodes = {
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  TAB_ACCESS_DENIED: 'TAB_ACCESS_DENIED',
  SCREENSHOT_FAILED: 'SCREENSHOT_FAILED',
  CONTENT_SCRIPT_FAILED: 'CONTENT_SCRIPT_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

function handleApiError(error, response) {
  const status = response?.status;
  const statusText = response?.statusText || '';
  
  switch (status) {
    case 401:
      return new ExtensionError(
        'Invalid API key. Please check your OpenAI API key.',
        ErrorCodes.API_KEY_INVALID,
        { status, statusText }
      );
    
    case 429:
      return new ExtensionError(
        'Rate limit exceeded. Please wait a moment before trying again.',
        ErrorCodes.API_RATE_LIMIT,
        { status, statusText }
      );
    
    case 403:
      return new ExtensionError(
        'API quota exceeded or access denied. Check your OpenAI account.',
        ErrorCodes.API_QUOTA_EXCEEDED,
        { status, statusText }
      );
    
    case 500:
    case 502:
    case 503:
      return new ExtensionError(
        'OpenAI service temporarily unavailable. Please try again later.',
        ErrorCodes.NETWORK_ERROR,
        { status, statusText }
      );
    
    default:
      return new ExtensionError(
        `API error: ${statusText || 'Unknown error'}`,
        ErrorCodes.UNKNOWN_ERROR,
        { status, statusText, originalError: error.message }
      );
  }
}

function handleTabError(error, tabId) {
  if (error.message.includes('Cannot access')) {
    return new ExtensionError(
      'Cannot access this tab. Some pages block extensions.',
      ErrorCodes.TAB_ACCESS_DENIED,
      { tabId, originalError: error.message }
    );
  }
  
  if (error.message.includes('No tab with id')) {
    return new ExtensionError(
      'Tab was closed or is no longer available.',
      ErrorCodes.TAB_ACCESS_DENIED,
      { tabId, originalError: error.message }
    );
  }
  
  return new ExtensionError(
    'Failed to process tab content.',
    ErrorCodes.CONTENT_SCRIPT_FAILED,
    { tabId, originalError: error.message }
  );
}

function handleScreenshotError(error, tabId) {
  return new ExtensionError(
    'Failed to capture page screenshot.',
    ErrorCodes.SCREENSHOT_FAILED,
    { tabId, originalError: error.message }
  );
}

function logError(error, context = {}) {
  console.error('Extension Error:', {
    name: error.name,
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: error.timestamp,
    context
  });
}

function getErrorMessage(error) {
  if (error instanceof ExtensionError) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

function isRetryableError(error) {
  if (!(error instanceof ExtensionError)) return false;
  
  return [
    ErrorCodes.API_RATE_LIMIT,
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.SCREENSHOT_FAILED
  ].includes(error.code);
}

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ExtensionError,
    ErrorCodes,
    handleApiError,
    handleTabError,
    handleScreenshotError,
    logError,
    getErrorMessage,
    isRetryableError,
    retryWithBackoff
  };
}