/**
 * Performance optimization utilities for Cloudflare Workers
 * 
 * Provides performance monitoring, optimization helpers, and
 * bundle size management for edge computing environments.
 */

import { recordMetric } from './monitoring'

// Performance tracking
interface PerformanceEntry {
  name: string
  startTime: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceTracker {
  private entries = new Map<string, PerformanceEntry>()
  
  start(name: string, metadata?: Record<string, any>): void {
    this.entries.set(name, {
      name,
      startTime: Date.now(),
      metadata
    })
  }
  
  end(name: string): number {
    const entry = this.entries.get(name)
    if (!entry) {
      console.warn(`Performance entry ${name} not found`)
      return 0
    }
    
    const duration = Date.now() - entry.startTime
    entry.duration = duration
    
    // Record metric
    recordMetric(`performance.${name}`, duration, {
      operation: name,
      ...entry.metadata
    }, 'duration')
    
    this.entries.delete(name)
    return duration
  }
  
  measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T
  measure<T>(name: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): T | Promise<T> {
    this.start(name, metadata)
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => this.end(name))
      } else {
        this.end(name)
        return result
      }
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

export const performance = new PerformanceTracker()

/**
 * Bundle size optimization helpers
 */
export function createLazyImport<T>(importFn: () => Promise<T>): () => Promise<T> {
  let module: T | null = null
  
  return async () => {
    if (module === null) {
      module = await importFn()
    }
    return module
  }
}

// Lazy imports for heavy dependencies
export const lazyOpenRouter = createLazyImport(() => import('./openrouter'))
export const lazyTwitterClient = createLazyImport(() => import('./twitterClient'))
export const lazyTwitterAnalysisAgent = createLazyImport(() => import('./twitterAnalysisAgent'))

/**
 * Memory optimization utilities
 */
export class MemoryManager {
  private static instance: MemoryManager
  private caches = new Map<string, Map<string, any>>()
  private maxCacheSize = 1000
  private maxItemAge = 5 * 60 * 1000 // 5 minutes
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }
  
  getCache(name: string): Map<string, any> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Map())
    }
    return this.caches.get(name)!
  }
  
  set(cacheName: string, key: string, value: any, ttl?: number): void {
    const cache = this.getCache(cacheName)
    
    // Clean up old entries if cache is too large
    if (cache.size >= this.maxCacheSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    const expiryTime = Date.now() + (ttl || this.maxItemAge)
    cache.set(key, { value, expiry: expiryTime })
  }
  
  get(cacheName: string, key: string): any | null {
    const cache = this.getCache(cacheName)
    const item = cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  delete(cacheName: string, key: string): void {
    const cache = this.getCache(cacheName)
    cache.delete(key)
  }
  
  clear(cacheName?: string): void {
    if (cacheName) {
      this.caches.delete(cacheName)
    } else {
      this.caches.clear()
    }
  }
  
  cleanup(): void {
    const now = Date.now()
    
    for (const [cacheName, cache] of this.caches) {
      for (const [key, item] of cache) {
        if (now > item.expiry) {
          cache.delete(key)
        }
      }
      
      // Remove empty caches
      if (cache.size === 0) {
        this.caches.delete(cacheName)
      }
    }
  }
  
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [cacheName, cache] of this.caches) {
      stats[cacheName] = {
        size: cache.size,
        keys: Array.from(cache.keys()).slice(0, 10) // First 10 keys for debugging
      }
    }
    
    return {
      totalCaches: this.caches.size,
      totalItems: Array.from(this.caches.values()).reduce((sum, cache) => sum + cache.size, 0),
      maxCacheSize: this.maxCacheSize,
      maxItemAge: this.maxItemAge,
      caches: stats
    }
  }
}

export const memoryManager = MemoryManager.getInstance()

/**
 * Response optimization
 */
export function optimizeResponse(data: any, options: {
  compress?: boolean
  removeNulls?: boolean
  minify?: boolean
} = {}): any {
  let optimized = data
  
  // Remove null values to reduce payload size
  if (options.removeNulls) {
    optimized = removeNullValues(optimized)
  }
  
  // Minify object keys (for large datasets)
  if (options.minify) {
    optimized = minifyKeys(optimized)
  }
  
  return optimized
}

function removeNullValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(item => item !== undefined)
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeNullValues(value)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
      }
    }
    return cleaned
  }
  
  return obj
}

function minifyKeys(obj: any, keyMap?: Map<string, string>): any {
  if (!keyMap) {
    keyMap = new Map([
      ['timestamp', 't'],
      ['username', 'u'],
      ['followers_count', 'f'],
      ['engagement_rate', 'e'],
      ['description', 'd'],
      ['metrics', 'm'],
      ['insights', 'i'],
      ['recommendations', 'r']
    ])
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => minifyKeys(item, keyMap))
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const minified: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = keyMap.get(key) || key
      minified[newKey] = minifyKeys(value, keyMap)
    }
    return minified
  }
  
  return obj
}

/**
 * Async operation batching
 */
export class BatchProcessor<T, R> {
  private queue: Array<{
    item: T
    resolve: (result: R) => void
    reject: (error: Error) => void
  }> = []
  
  private processing = false
  private batchSize: number
  private batchDelay: number
  private processor: (items: T[]) => Promise<R[]>
  
  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: {
      batchSize?: number
      batchDelay?: number
    } = {}
  ) {
    this.processor = processor
    this.batchSize = options.batchSize || 10
    this.batchDelay = options.batchDelay || 100
  }
  
  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject })
      
      if (!this.processing) {
        this.scheduleProcessing()
      }
    })
  }
  
  private scheduleProcessing(): void {
    this.processing = true
    
    setTimeout(async () => {
      await this.processBatch()
      
      if (this.queue.length > 0) {
        this.scheduleProcessing()
      } else {
        this.processing = false
      }
    }, this.batchDelay)
  }
  
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return
    
    const batch = this.queue.splice(0, this.batchSize)
    const items = batch.map(b => b.item)
    
    try {
      const results = await this.processor(items)
      
      batch.forEach((b, index) => {
        if (results[index] !== undefined) {
          b.resolve(results[index])
        } else {
          b.reject(new Error('No result for item'))
        }
      })
    } catch (error) {
      batch.forEach(b => b.reject(error as Error))
    }
  }
}

/**
 * CPU time management for Workers
 */
export class CPUTimeManager {
  private startTime: number
  private maxCPUTime: number
  private operations: Array<{ name: string; time: number }> = []
  
  constructor(maxCPUTime = 10000) { // 10 seconds default
    this.startTime = Date.now()
    this.maxCPUTime = maxCPUTime
  }
  
  checkTime(operationName?: string): boolean {
    const elapsed = Date.now() - this.startTime
    
    if (operationName) {
      this.operations.push({ name: operationName, time: elapsed })
    }
    
    if (elapsed > this.maxCPUTime) {
      console.warn(`CPU time limit exceeded: ${elapsed}ms > ${this.maxCPUTime}ms`)
      return false
    }
    
    return true
  }
  
  getRemainingTime(): number {
    const elapsed = Date.now() - this.startTime
    return Math.max(0, this.maxCPUTime - elapsed)
  }
  
  getStats(): {
    elapsed: number
    remaining: number
    operations: Array<{ name: string; time: number }>
  } {
    const elapsed = Date.now() - this.startTime
    
    return {
      elapsed,
      remaining: this.getRemainingTime(),
      operations: this.operations
    }
  }
}

/**
 * Edge-optimized database operations
 */
export function createOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey?: string,
  ttl = 300 // 5 minutes
): () => Promise<T> {
  return async () => {
    const startTime = Date.now()
    
    // Try cache first
    if (cacheKey) {
      const cached = memoryManager.get('database', cacheKey)
      if (cached) {
        recordMetric('database.cache_hit', 1, { query: cacheKey }, 'count')
        return cached
      }
    }
    
    // Execute query
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    // Cache result
    if (cacheKey) {
      memoryManager.set('database', cacheKey, result, ttl * 1000)
      recordMetric('database.cache_miss', 1, { query: cacheKey }, 'count')
    }
    
    recordMetric('database.query_time', duration, { 
      query: cacheKey || 'unknown',
      cached: false 
    }, 'duration')
    
    return result
  }
}

/**
 * Worker-specific optimizations
 */
export function optimizeForWorkers() {
  // Clean up memory caches periodically
  setInterval(() => {
    memoryManager.cleanup()
  }, 60000) // Every minute
  
  // Monitor memory usage
  if (process.memoryUsage) {
    setInterval(() => {
      const memory = process.memoryUsage()
      recordMetric('worker.memory.heap_used', memory.heapUsed, {}, 'bytes')
      recordMetric('worker.memory.heap_total', memory.heapTotal, {}, 'bytes')
      recordMetric('worker.memory.rss', memory.rss, {}, 'bytes')
    }, 30000) // Every 30 seconds
  }
}

/**
 * Bundle size analysis (development only)
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return
  
  const modules = Object.keys(require.cache || {})
  const sizes: Record<string, number> = {}
  
  modules.forEach(modulePath => {
    try {
      const stats = require('fs').statSync(modulePath)
      const name = modulePath.split('/').pop() || modulePath
      sizes[name] = stats.size
    } catch (error) {
      // Ignore errors
    }
  })
  
  console.log('Bundle analysis:', {
    totalModules: modules.length,
    largestModules: Object.entries(sizes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, size]) => ({ name, size: `${(size / 1024).toFixed(2)}KB` }))
  })
}

// Auto-optimize when module is loaded
if (typeof global !== 'undefined') {
  optimizeForWorkers()
}

export default {
  performance,
  memoryManager,
  optimizeResponse,
  BatchProcessor,
  CPUTimeManager,
  createOptimizedQuery,
  optimizeForWorkers,
  analyzeBundleSize,
  lazyOpenRouter,
  lazyTwitterClient,
  lazyTwitterAnalysisAgent
}