import type { H3Error } from 'h3'
import { ZodError } from 'zod'

// Error type definitions
interface ApiError {
  statusCode: number
  statusMessage: string
  data?: any
  stack?: string
}

// Custom error classes
export class SessionNotFoundError extends Error {
  statusCode = 404
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`)
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401
  constructor(message = 'Authentication required') {
    super(message)
  }
}

export class ForbiddenError extends Error {
  statusCode = 403
  constructor(message = 'Access denied') {
    super(message)
  }
}

export class ValidationError extends Error {
  statusCode = 400
  data: any
  constructor(message: string, data?: any) {
    super(message)
    this.data = data
  }
}

export class ConflictError extends Error {
  statusCode = 409
  constructor(message: string) {
    super(message)
  }
}

// Error handler plugin
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error: H3Error, { event }) => {
    // Log error details
    console.error(`[${new Date().toISOString()}] API Error:`, {
      path: event.node.req.url,
      method: event.node.req.method,
      statusCode: error.statusCode,
      message: error.statusMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })

    // Handle Zod validation errors
    if (error.cause instanceof ZodError) {
      error.statusCode = 400
      error.statusMessage = 'Validation error'
      error.data = {
        errors: error.cause.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }
    }

    // Handle database errors
    if (error.message?.includes('SQLITE_CONSTRAINT')) {
      error.statusCode = 409
      error.statusMessage = 'Database constraint violation'
    }

    // Handle timeout errors
    if (error.message?.includes('TIMEOUT')) {
      error.statusCode = 504
      error.statusMessage = 'Request timeout'
    }

    // Ensure error has proper structure
    const apiError: ApiError = {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
      data: error.data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }

    // Set response headers
    setHeader(event, 'content-type', 'application/json')
    setResponseStatus(event, apiError.statusCode)

    // Send error response
    return apiError
  })

  // Hook for successful responses to ensure consistent format
  nitroApp.hooks.hook('beforeResponse', async (event, response) => {
    // Only process API routes
    if (!event.node.req.url?.startsWith('/api/')) return

    // Skip if already processed or is an error
    if (response?.success !== undefined || response?.statusCode) return

    // Ensure consistent success response format
    if (response && typeof response === 'object') {
      event.node.res.statusCode = 200
      return {
        success: true,
        data: response
      }
    }
  })
})

// Helper functions for error handling
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error)
  
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid reference to related data'
    })
  }
  
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Duplicate entry'
    })
  }
  
  throw createError({
    statusCode: 500,
    statusMessage: 'Database operation failed'
  })
}

export function handleAuthError(message?: string): never {
  throw createError({
    statusCode: 401,
    statusMessage: message || 'Authentication required'
  })
}

export function handleValidationError(errors: any): never {
  throw createError({
    statusCode: 400,
    statusMessage: 'Validation failed',
    data: errors
  })
}

export function handleNotFoundError(resource: string, id?: string): never {
  throw createError({
    statusCode: 404,
    statusMessage: id ? `${resource} not found: ${id}` : `${resource} not found`
  })
}

export function handleForbiddenError(message?: string): never {
  throw createError({
    statusCode: 403,
    statusMessage: message || 'Access denied'
  })
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(userId: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = requestCounts.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (userLimit.count >= limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests',
      data: {
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      }
    })
  }
  
  userLimit.count++
  return true
}