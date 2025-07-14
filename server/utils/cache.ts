// Simple in-memory cache for server-side caching
// In production, this would be replaced with Redis or similar

interface CacheEntry {
  data: any
  expiry: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data, expiry })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Export singleton instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  exam: (id: string) => `exam:${id}`,
  exams: (filter?: string) => `exams:${filter || 'all'}`,
  questions: (examId: string, limit: number, offset: number) => `questions:${examId}:${limit}:${offset}`,
  objectives: (examId?: string) => `objectives:${examId || 'all'}`,
  userProgress: (userId: string) => `progress:${userId}`,
  userStats: (userId: string, period: string) => `stats:${userId}:${period}`,
  leaderboard: (category: string, timeframe: string) => `leaderboard:${category}:${timeframe}`,
  vendors: () => 'vendors:all'
}

// Helper function for cached API responses
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  cache.set(key, data, ttlSeconds)
  
  return data
}

// Cache invalidation helpers
export const invalidateCache = {
  exam: (id: string) => {
    cache.delete(cacheKeys.exam(id))
    cache.invalidatePattern('exams:*')
    cache.invalidatePattern(`questions:${id}:*`)
    cache.invalidatePattern(`objectives:${id}*`)
  },
  
  question: (questionId: string, examId: string) => {
    cache.invalidatePattern(`questions:${examId}:*`)
    cache.invalidatePattern('stats:*') // Questions affect user stats
  },
  
  objective: (objectiveId: string, examId: string) => {
    cache.invalidatePattern(`objectives:${examId}*`)
    cache.invalidatePattern('objectives:all')
  },
  
  userProgress: (userId: string) => {
    cache.delete(cacheKeys.userProgress(userId))
    cache.invalidatePattern(`stats:${userId}:*`)
    cache.invalidatePattern('leaderboard:*') // Progress affects leaderboards
  },
  
  vendor: () => {
    cache.delete(cacheKeys.vendors())
    cache.invalidatePattern('exams:*') // Vendors affect exam listings
  }
}

// Performance monitoring
export function getCacheStats() {
  return cache.getStats()
}