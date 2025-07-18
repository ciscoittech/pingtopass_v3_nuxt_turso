export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

export function useRetry() {
  const defaultOptions: RetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error) => {
      // Retry on network errors and 5xx server errors
      if (!error.statusCode) return true
      return error.statusCode >= 500 && error.statusCode < 600
    }
  }

  async function retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...defaultOptions, ...options }
    let lastError: any
    
    for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        // Check if we should retry
        if (attempt === opts.maxRetries || !opts.shouldRetry!(error)) {
          throw error
        }
        
        // Call retry callback
        if (opts.onRetry) {
          opts.onRetry(attempt + 1, error)
        }
        
        // Calculate delay with exponential backoff
        const delay = opts.retryDelay! * Math.pow(opts.backoffMultiplier!, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }

  return {
    retry
  }
}