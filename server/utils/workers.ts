/**
 * Cloudflare Workers utilities and bindings
 * 
 * Provides type-safe access to Cloudflare services:
 * - KV Storage for caching and sessions
 * - R2 Storage for file uploads
 * - Analytics Engine for metrics
 * - Durable Objects for state management
 * - Queues for background processing
 */

// Types for Cloudflare bindings
export interface CloudflareBindings {
  KV: KVNamespace
  BLOB: R2Bucket
  ANALYTICS: AnalyticsEngineDataset
  MONITORING_STATE: DurableObjectNamespace
  TWITTER_CACHE: DurableObjectNamespace
  TWITTER_QUEUE: Queue
  QUESTION_QUEUE: Queue
}

// Environment interface
export interface WorkerEnvironment extends CloudflareBindings {
  // Secrets
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NUXT_SESSION_PASSWORD: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  OPENROUTER_API_KEY: string
  TWITTER_API_KEY: string
  WEBHOOK_SECRET: string
  MONITORING_SECRET: string
  
  // Variables
  APP_NAME: string
  BASE_URL: string
  NODE_ENV: string
  RATE_LIMIT_ENABLED: string
  MONITORING_ENABLED: string
  CACHE_TTL: string
}

/**
 * KV Storage utilities
 */
export class KVStore {
  private kv: KVNamespace
  
  constructor(kv: KVNamespace) {
    this.kv = kv
  }
  
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, { type: 'json' })
      return value as T
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error)
      return null
    }
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const options: KVNamespacePutOptions = {}
      if (ttl) {
        options.expirationTtl = ttl
      }
      
      await this.kv.put(key, JSON.stringify(value), options)
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error)
      throw error
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key)
    } catch (error) {
      console.error(`KV delete error for key ${key}:`, error)
      throw error
    }
  }
  
  async list(prefix?: string): Promise<KVNamespaceListResult<any, string>> {
    try {
      const options: KVNamespaceListOptions = {}
      if (prefix) {
        options.prefix = prefix
      }
      
      return await this.kv.list(options)
    } catch (error) {
      console.error('KV list error:', error)
      throw error
    }
  }
}

/**
 * R2 Storage utilities
 */
export class R2Store {
  private r2: R2Bucket
  
  constructor(r2: R2Bucket) {
    this.r2 = r2
  }
  
  async upload(key: string, data: ArrayBuffer | ReadableStream | string, metadata?: Record<string, string>): Promise<void> {
    try {
      const options: R2PutOptions = {}
      if (metadata) {
        options.customMetadata = metadata
      }
      
      await this.r2.put(key, data, options)
    } catch (error) {
      console.error(`R2 upload error for key ${key}:`, error)
      throw error
    }
  }
  
  async download(key: string): Promise<R2Object | null> {
    try {
      return await this.r2.get(key)
    } catch (error) {
      console.error(`R2 download error for key ${key}:`, error)
      return null
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.r2.delete(key)
    } catch (error) {
      console.error(`R2 delete error for key ${key}:`, error)
      throw error
    }
  }
  
  async list(prefix?: string): Promise<R2Objects> {
    try {
      const options: R2ListOptions = {}
      if (prefix) {
        options.prefix = prefix
      }
      
      return await this.r2.list(options)
    } catch (error) {
      console.error('R2 list error:', error)
      throw error
    }
  }
}

/**
 * Analytics utilities
 */
export class AnalyticsReporter {
  private analytics: AnalyticsEngineDataset
  
  constructor(analytics: AnalyticsEngineDataset) {
    this.analytics = analytics
  }
  
  writeDataPoint(point: AnalyticsEngineDataPoint): void {
    try {
      this.analytics.writeDataPoint(point)
    } catch (error) {
      console.error('Analytics write error:', error)
    }
  }
  
  recordEvent(event: string, properties: Record<string, any> = {}): void {
    const dataPoint: AnalyticsEngineDataPoint = {
      indexes: [event],
      doubles: [],
      blobs: []
    }
    
    // Convert properties to appropriate types
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'number') {
        dataPoint.doubles!.push(value)
        dataPoint.indexes!.push(`${key}:${value}`)
      } else if (typeof value === 'string') {
        dataPoint.blobs!.push(value)
        dataPoint.indexes!.push(`${key}:${value}`)
      }
    }
    
    this.writeDataPoint(dataPoint)
  }
  
  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const dataPoint: AnalyticsEngineDataPoint = {
      indexes: [name, ...Object.entries(tags).map(([k, v]) => `${k}:${v}`)],
      doubles: [value],
      blobs: [JSON.stringify(tags)]
    }
    
    this.writeDataPoint(dataPoint)
  }
}

/**
 * Queue utilities
 */
export class QueueManager {
  private queue: Queue
  
  constructor(queue: Queue) {
    this.queue = queue
  }
  
  async send(message: any, options?: QueueSendOptions): Promise<void> {
    try {
      await this.queue.send(message, options)
    } catch (error) {
      console.error('Queue send error:', error)
      throw error
    }
  }
  
  async sendBatch(messages: any[], options?: QueueSendBatchOptions): Promise<void> {
    try {
      await this.queue.sendBatch(messages, options)
    } catch (error) {
      console.error('Queue send batch error:', error)
      throw error
    }
  }
}

/**
 * Worker context helpers
 */
export function getWorkerBindings(event: any): CloudflareBindings {
  const context = event.context?.cloudflare
  
  if (!context) {
    throw new Error('Cloudflare bindings not available')
  }
  
  return {
    KV: context.env.KV,
    BLOB: context.env.BLOB,
    ANALYTICS: context.env.ANALYTICS,
    MONITORING_STATE: context.env.MONITORING_STATE,
    TWITTER_CACHE: context.env.TWITTER_CACHE,
    TWITTER_QUEUE: context.env.TWITTER_QUEUE,
    QUESTION_QUEUE: context.env.QUESTION_QUEUE
  }
}

export function getWorkerEnvironment(event: any): WorkerEnvironment {
  const context = event.context?.cloudflare
  
  if (!context) {
    throw new Error('Cloudflare environment not available')
  }
  
  return context.env as WorkerEnvironment
}

/**
 * Utility to create service instances
 */
export function createWorkerServices(bindings: CloudflareBindings) {
  return {
    kv: new KVStore(bindings.KV),
    r2: new R2Store(bindings.BLOB),
    analytics: new AnalyticsReporter(bindings.ANALYTICS),
    twitterQueue: new QueueManager(bindings.TWITTER_QUEUE),
    questionQueue: new QueueManager(bindings.QUESTION_QUEUE)
  }
}

/**
 * Caching utilities for Workers
 */
export class WorkerCache {
  private kv: KVStore
  private defaultTTL: number
  
  constructor(kv: KVStore, defaultTTL = 3600) {
    this.kv = kv
    this.defaultTTL = defaultTTL
  }
  
  private getCacheKey(prefix: string, key: string): string {
    return `cache:${prefix}:${key}`
  }
  
  async get<T>(prefix: string, key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(prefix, key)
    return await this.kv.get<T>(cacheKey)
  }
  
  async set<T>(prefix: string, key: string, value: T, ttl?: number): Promise<void> {
    const cacheKey = this.getCacheKey(prefix, key)
    await this.kv.set(cacheKey, value, ttl || this.defaultTTL)
  }
  
  async delete(prefix: string, key: string): Promise<void> {
    const cacheKey = this.getCacheKey(prefix, key)
    await this.kv.delete(cacheKey)
  }
  
  async invalidatePrefix(prefix: string): Promise<void> {
    const keys = await this.kv.list(`cache:${prefix}:`)
    
    for (const key of keys.keys) {
      await this.kv.delete(key.name)
    }
  }
}

/**
 * Rate limiting for Workers
 */
export class WorkerRateLimit {
  private kv: KVStore
  
  constructor(kv: KVStore) {
    this.kv = kv
  }
  
  private getRateLimitKey(identifier: string, window: string): string {
    return `rate_limit:${identifier}:${window}`
  }
  
  async checkLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Math.floor(Date.now() / 1000)
    const window = Math.floor(now / windowSeconds)
    const key = this.getRateLimitKey(identifier, window.toString())
    
    const current = await this.kv.get<{ count: number; resetTime: number }>(key)
    
    if (!current) {
      // First request in window
      const resetTime = (window + 1) * windowSeconds
      await this.kv.set(key, { count: 1, resetTime }, windowSeconds)
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime
      }
    }
    
    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      }
    }
    
    // Increment counter
    await this.kv.set(key, { count: current.count + 1, resetTime: current.resetTime }, windowSeconds)
    
    return {
      allowed: true,
      remaining: maxRequests - current.count - 1,
      resetTime: current.resetTime
    }
  }
}

/**
 * Feature flags for Workers
 */
export class WorkerFeatureFlags {
  private kv: KVStore
  
  constructor(kv: KVStore) {
    this.kv = kv
  }
  
  async isEnabled(flag: string, defaultValue = false): Promise<boolean> {
    const value = await this.kv.get<boolean>(`feature_flag:${flag}`)
    return value !== null ? value : defaultValue
  }
  
  async setFlag(flag: string, enabled: boolean): Promise<void> {
    await this.kv.set(`feature_flag:${flag}`, enabled)
  }
  
  async getAllFlags(): Promise<Record<string, boolean>> {
    const flags: Record<string, boolean> = {}
    const keys = await this.kv.list('feature_flag:')
    
    for (const key of keys.keys) {
      const flagName = key.name.replace('feature_flag:', '')
      const value = await this.kv.get<boolean>(key.name)
      flags[flagName] = value || false
    }
    
    return flags
  }
}

// Export factory function for creating all worker utilities
export function createWorkerUtils(bindings: CloudflareBindings) {
  const kv = new KVStore(bindings.KV)
  
  return {
    ...createWorkerServices(bindings),
    cache: new WorkerCache(kv),
    rateLimit: new WorkerRateLimit(kv),
    featureFlags: new WorkerFeatureFlags(kv)
  }
}