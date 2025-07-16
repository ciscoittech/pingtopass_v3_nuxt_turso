export interface AppError {
  code: string
  message: string
  details?: any
  severity: 'info' | 'warning' | 'error' | 'critical'
  timestamp: number
  context?: string
}

export const useErrorHandler = () => {
  const errors = ref<AppError[]>([])
  const currentError = ref<AppError | null>(null)
  
  // Error codes
  const ERROR_CODES = {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    
    // Session errors
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SESSION_SAVE_FAILED: 'SESSION_SAVE_FAILED',
    
    // Question errors
    QUESTION_LOAD_FAILED: 'QUESTION_LOAD_FAILED',
    QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
    
    // Auth errors
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    
    // Validation errors
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_ANSWER: 'INVALID_ANSWER'
  }
  
  // User-friendly error messages
  const ERROR_MESSAGES: Record<string, string> = {
    [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection.',
    [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
    [ERROR_CODES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
    [ERROR_CODES.SESSION_NOT_FOUND]: 'Session not found. Please start a new session.',
    [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please start a new session.',
    [ERROR_CODES.SESSION_SAVE_FAILED]: 'Failed to save your progress. Please check your connection.',
    [ERROR_CODES.QUESTION_LOAD_FAILED]: 'Failed to load questions. Please refresh the page.',
    [ERROR_CODES.QUESTION_NOT_FOUND]: 'Question not found. Please contact support.',
    [ERROR_CODES.AUTH_REQUIRED]: 'Please sign in to continue.',
    [ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ERROR_CODES.INVALID_INPUT]: 'Invalid input. Please check your data.',
    [ERROR_CODES.INVALID_ANSWER]: 'Please select an answer before submitting.'
  }
  
  // Handle different error types
  const handleError = (error: any, context?: string): AppError => {
    console.error(`[Error Handler] ${context || 'Unknown context'}:`, error)
    
    let appError: AppError
    
    // Network errors
    if (error?.name === 'FetchError' || error?.code === 'ECONNREFUSED') {
      appError = {
        code: ERROR_CODES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        severity: 'error',
        timestamp: Date.now(),
        context,
        details: error
      }
    }
    // Timeout errors
    else if (error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT') {
      appError = {
        code: ERROR_CODES.TIMEOUT_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
        severity: 'warning',
        timestamp: Date.now(),
        context,
        details: error
      }
    }
    // HTTP errors
    else if (error?.statusCode) {
      const code = error.statusCode === 404 ? ERROR_CODES.SESSION_NOT_FOUND :
                   error.statusCode === 401 ? ERROR_CODES.AUTH_REQUIRED :
                   error.statusCode === 403 ? ERROR_CODES.AUTH_EXPIRED :
                   ERROR_CODES.SERVER_ERROR
      
      appError = {
        code,
        message: error.statusMessage || ERROR_MESSAGES[code],
        severity: error.statusCode >= 500 ? 'critical' : 'error',
        timestamp: Date.now(),
        context,
        details: error
      }
    }
    // Application errors
    else if (error?.code && ERROR_MESSAGES[error.code]) {
      appError = {
        code: error.code,
        message: ERROR_MESSAGES[error.code],
        severity: error.severity || 'error',
        timestamp: Date.now(),
        context,
        details: error.details
      }
    }
    // Unknown errors
    else {
      appError = {
        code: ERROR_CODES.SERVER_ERROR,
        message: error?.message || ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
        severity: 'error',
        timestamp: Date.now(),
        context,
        details: error
      }
    }
    
    // Add to error list
    errors.value.unshift(appError)
    currentError.value = appError
    
    // Keep only last 50 errors
    if (errors.value.length > 50) {
      errors.value = errors.value.slice(0, 50)
    }
    
    return appError
  }
  
  // Clear current error
  const clearError = () => {
    currentError.value = null
  }
  
  // Clear all errors
  const clearAllErrors = () => {
    errors.value = []
    currentError.value = null
  }
  
  // Retry function with exponential backoff
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }
  
  // Check if error is recoverable
  const isRecoverable = (error: AppError): boolean => {
    return [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.SESSION_SAVE_FAILED
    ].includes(error.code)
  }
  
  // Get error by code
  const getErrorMessage = (code: string): string => {
    return ERROR_MESSAGES[code] || 'An unexpected error occurred'
  }
  
  return {
    errors: readonly(errors),
    currentError: readonly(currentError),
    ERROR_CODES,
    handleError,
    clearError,
    clearAllErrors,
    retryWithBackoff,
    isRecoverable,
    getErrorMessage
  }
}