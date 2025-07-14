// Security utilities for input validation and sanitization

import { z } from 'zod'

// Common validation schemas
export const schemas = {
  id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  pagination: z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0)
  }),
  examData: z.object({
    code: z.string().min(1).max(20).trim(),
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(2000).optional(),
    vendorId: z.string().min(1),
    passingScore: z.number().min(0).max(100),
    timeLimit: z.number().min(1).max(480), // Max 8 hours
    questionCount: z.number().min(1).max(1000),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional()
  }),
  questionData: z.object({
    questionText: z.string().min(1).max(2000).trim(),
    optionA: z.string().min(1).max(500).trim(),
    optionB: z.string().min(1).max(500).trim(),
    optionC: z.string().min(1).max(500).trim(),
    optionD: z.string().min(1).max(500).trim(),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().max(2000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    examId: z.string().min(1),
    objectiveId: z.string().optional()
  })
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Rate limiting utilities
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
  
  const current = rateLimitMap.get(identifier)
  
  if (!current || current.resetTime < now) {
    // New window
    const resetTime = now + windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  current.count++
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.resetTime 
  }
}

// SQL injection prevention
export function validateSQLInput(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
    /[';]/, // Semicolons and single quotes
    /-{2}/, // SQL comments
    /\/\*.*\*\//s // Block comments
  ]
  
  return !sqlPatterns.some(pattern => pattern.test(input))
}

// Input sanitization for database queries
export function sanitizeDbInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().slice(0, 2000) // Limit length and trim
  }
  
  if (typeof input === 'number') {
    return isFinite(input) ? input : 0
  }
  
  if (Array.isArray(input)) {
    return input.slice(0, 100).map(sanitizeDbInput) // Limit array size
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === 'string' && key.length <= 50) {
        sanitized[key] = sanitizeDbInput(value)
      }
    }
    return sanitized
  }
  
  return input
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) score += 1
  else feedback.push('Password must be at least 8 characters long')
  
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Password must contain lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Password must contain uppercase letters')
  
  if (/\d/.test(password)) score += 1
  else feedback.push('Password must contain numbers')
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  else feedback.push('Password must contain special characters')
  
  return {
    isValid: score >= 4,
    score,
    feedback
  }
}

// CSRF token utilities
export function generateCSRFToken(): string {
  return crypto.randomUUID()
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length > 0
}

// Content Security Policy headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Nuxt needs unsafe-eval
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' api.openrouter.ai",
      "frame-ancestors 'none'"
    ].join('; ')
  }
}

// IP address utilities
export function getClientIP(event: any): string {
  const headers = getHeaders(event)
  
  // Check various headers for real IP
  const forwarded = headers['x-forwarded-for']
  const realIP = headers['x-real-ip']
  const remoteAddr = headers['remote-addr']
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

// Request validation middleware
export function validateRequest(event: any, schema: z.ZodSchema): any {
  try {
    const data = event.context.body || getQuery(event)
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }
    throw error
  }
}

// Enhanced security schemas for agent systems
export const agentSchemas = {
  twitterUsername: z.string()
    .min(1)
    .max(15)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform(val => val.toLowerCase()),
  
  competitorData: z.object({
    username: z.string().min(1).max(15).regex(/^[a-zA-Z0-9_]+$/),
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    category: z.enum(['direct', 'indirect', 'influencer']),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    notes: z.string().max(1000).optional()
  }),

  analysisRequest: z.object({
    competitorIds: z.array(z.string().min(1)).min(1).max(10),
    includeRecommendations: z.boolean().default(true),
    analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed')
  }),

  monitoringJobConfig: z.object({
    name: z.string().min(1).max(100).trim(),
    type: z.enum(['competitor_analysis', 'trend_monitoring', 'hashtag_tracking']),
    competitors: z.array(z.string()).max(20).optional(),
    keywords: z.array(z.string().max(50)).max(50).optional(),
    hashtags: z.array(z.string().max(30)).max(30).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    alerts: z.object({
      follower_change_threshold: z.number().min(0).max(100).default(20),
      engagement_change_threshold: z.number().min(0).max(100).default(30),
      viral_content_threshold: z.number().min(0).max(10000).default(1000),
      new_competitor_mentions: z.boolean().default(true)
    }),
    analysis_depth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed')
  }),

  questionGeneration: z.object({
    examId: z.string().min(1),
    objectiveIds: z.array(z.string()).max(50).optional(),
    totalCount: z.number().min(1).max(100),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
    modelId: z.string().min(1).optional()
  })
}

// API key security for external services
export function validateAPIKey(key: string, service: 'twitter' | 'openrouter'): boolean {
  if (!key || typeof key !== 'string') return false
  
  switch (service) {
    case 'twitter':
      // Twitter API keys are typically 50+ characters
      return key.length >= 20 && /^[a-zA-Z0-9]+$/.test(key)
    
    case 'openrouter':
      // OpenRouter keys start with specific prefix
      return key.startsWith('sk-or-') && key.length >= 20
    
    default:
      return false
  }
}

// Secure token generation for agent authentication
export function generateAgentToken(agentType: string, permissions: string[]): string {
  const payload = {
    type: agentType,
    permissions,
    issued: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    nonce: crypto.randomUUID()
  }
  
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// Validate agent tokens
export function validateAgentToken(token: string, requiredPermissions: string[] = []): {
  valid: boolean
  payload?: any
  error?: string
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'))
    
    // Check expiry
    if (Date.now() > payload.expires) {
      return { valid: false, error: 'Token expired' }
    }
    
    // Check permissions
    for (const permission of requiredPermissions) {
      if (!payload.permissions?.includes(permission)) {
        return { valid: false, error: `Missing permission: ${permission}` }
      }
    }
    
    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Invalid token format' }
  }
}

// Enhanced rate limiting for different agent actions
export function checkAgentRateLimit(
  identifier: string,
  action: 'analysis' | 'generation' | 'monitoring' | 'api_call'
): { allowed: boolean; remaining: number; resetTime: number } {
  const limits = {
    analysis: { max: 10, window: 60000 }, // 10 per minute
    generation: { max: 5, window: 300000 }, // 5 per 5 minutes
    monitoring: { max: 20, window: 3600000 }, // 20 per hour
    api_call: { max: 100, window: 60000 } // 100 per minute
  }
  
  const limit = limits[action] || limits.api_call
  return checkRateLimit(`${identifier}:${action}`, limit.max, limit.window)
}

// Data privacy and PII detection
export function detectPII(text: string): {
  hasPII: boolean
  types: string[]
  sanitized: string
} {
  const piiPatterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
  }
  
  const detected: string[] = []
  let sanitized = text
  
  for (const [type, pattern] of Object.entries(piiPatterns)) {
    if (pattern.test(text)) {
      detected.push(type)
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`)
    }
  }
  
  return {
    hasPII: detected.length > 0,
    types: detected,
    sanitized
  }
}

// Content filtering for AI responses
export function filterAIContent(content: string): {
  safe: boolean
  filtered: string
  warnings: string[]
} {
  const warnings: string[] = []
  let filtered = content
  
  // Remove potential code injection
  const codePatterns = [
    { pattern: /```[\s\S]*?```/g, warning: 'Code blocks removed' },
    { pattern: /`[^`]*`/g, warning: 'Inline code removed' },
    { pattern: /<script[\s\S]*?<\/script>/gi, warning: 'Script tags removed' }
  ]
  
  for (const { pattern, warning } of codePatterns) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[CODE_REMOVED]')
      warnings.push(warning)
    }
  }
  
  // Check for inappropriate content
  const inappropriatePatterns = [
    /\b(hack|exploit|bypass|vulnerability)\b/gi,
    /\b(password|secret|token|key)\s*[:=]\s*\S+/gi
  ]
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[FILTERED]')
      warnings.push('Potentially sensitive content filtered')
    }
  }
  
  return {
    safe: warnings.length === 0,
    filtered,
    warnings
  }
}

// Security audit functions
export function auditAPIEndpoint(endpoint: string, data: any) {
  const issues: string[] = []
  
  // Check for potential SQL injection
  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && !validateSQLInput(value)) {
        issues.push(`Potential SQL injection in field: ${key}`)
      }
    }
  }
  
  // Check for XSS vectors
  const xssPatterns = [/<script/i, /javascript:/i, /onload=/i, /onerror=/i]
  if (typeof data === 'string') {
    for (const pattern of xssPatterns) {
      if (pattern.test(data)) {
        issues.push('Potential XSS vector detected')
        break
      }
    }
  }
  
  // Check for PII exposure
  if (typeof data === 'string') {
    const piiCheck = detectPII(data)
    if (piiCheck.hasPII) {
      issues.push(`PII detected: ${piiCheck.types.join(', ')}`)
    }
  }
  
  return {
    endpoint,
    timestamp: new Date().toISOString(),
    issues,
    severity: issues.length > 0 ? 'high' : 'low'
  }
}

// Production security configuration
export const productionSecurityConfig = {
  // API rate limits
  rateLimits: {
    global: { windowMs: 60000, max: 1000 },
    auth: { windowMs: 900000, max: 5 }, // 5 attempts per 15 minutes
    analysis: { windowMs: 60000, max: 10 },
    generation: { windowMs: 300000, max: 5 }
  },
  
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
    'font-src': ["'self'", "fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "blob:", "unavatar.io"],
    'connect-src': ["'self'", "api.openrouter.ai", "api.twitterapi.io"],
    'frame-ancestors': ["'none'"]
  },
  
  // Security headers
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// Security monitoring for agent systems
export function monitorAgentSecurity(agentType: string, action: string, metadata: any = {}) {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    agentType,
    action,
    metadata: sanitizeDbInput(metadata),
    risk: calculateRiskScore(action, metadata)
  }
  
  // Log high-risk events
  if (securityEvent.risk >= 7) {
    console.warn('[SECURITY ALERT]', securityEvent)
  }
  
  return securityEvent
}

function calculateRiskScore(action: string, metadata: any): number {
  let score = 0
  
  // Base risk by action type
  const actionRisks = {
    'competitor_analysis': 3,
    'question_generation': 4,
    'twitter_monitoring': 5,
    'admin_access': 8,
    'data_export': 9
  }
  
  score += actionRisks[action] || 2
  
  // Increase risk for bulk operations
  if (metadata.count && metadata.count > 10) {
    score += 2
  }
  
  // Increase risk for external API calls
  if (metadata.external_api) {
    score += 1
  }
  
  return Math.min(score, 10)
}