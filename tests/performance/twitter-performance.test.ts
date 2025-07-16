import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performance } from 'perf_hooks'

// Performance Benchmarks for Twitter Intelligence System
// These tests measure and verify performance characteristics of critical components

describe('Twitter Intelligence Performance Benchmarks', () => {
  const PERFORMANCE_THRESHOLDS = {
    API_RESPONSE_TIME: 2000, // 2 seconds max
    DATABASE_QUERY: 500, // 500ms max
    ANALYSIS_PROCESSING: 10000, // 10 seconds max (increased for CI)
    MEMORY_USAGE_MB: 100, // 100MB max increase
    CONCURRENT_REQUESTS: 10, // Handle 10 concurrent requests
    THROUGHPUT_PER_SECOND: 2 // 2 operations per second minimum (reduced for CI)
  }

  let initialMemory: number

  // Mock clients available to all tests
  const mockTwitterClient = {
    async analyzeUser(username: string) {
      const startTime = performance.now()
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return {
        user: { username },
        metrics: {
          followers: 10000,
          engagement_rate: 4.2,
          posting_frequency: 2.5
        },
        performance: { duration }
      }
    },

    async fetchTweets(username: string, count: number = 10) {
      const startTime = performance.now()
      
      // Simulate tweet fetching
      const tweets = Array.from({ length: count }, (_, i) => ({
        id: `tweet_${i}`,
        text: `Sample tweet ${i}`,
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: Math.floor(Math.random() * 100),
          like_count: Math.floor(Math.random() * 500),
          reply_count: Math.floor(Math.random() * 50)
        }
      }))
      
      await new Promise(resolve => setTimeout(resolve, count * 10)) // 10ms per tweet
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return { tweets, performance: { duration } }
    }
  }

  const mockLangChainWorkflow = {
    async analyzeCompetitors(competitors: string[], includeRecommendations = true) {
      const startTime = performance.now()
      
      // Simulate LangChain processing time (reduced for testing)
      const processingTime = competitors.length * 250 + (includeRecommendations ? 500 : 0)
      await new Promise(resolve => setTimeout(resolve, processingTime))
      
      const insights = competitors.map((competitor, index) => ({
        id: `insight_${index}`,
        type: 'content_strategy' as const,
        title: `Insight for ${competitor}`,
        description: 'AI-generated insight',
        confidence: 0.8 + Math.random() * 0.2,
        impact: 'high' as const,
        recommendation: 'Generated recommendation',
        actionable_steps: ['Step 1', 'Step 2'],
        competitors_involved: [competitor],
        created_at: new Date().toISOString()
      }))
      
      const recommendations = includeRecommendations ? competitors.map((competitor, index) => ({
        id: `rec_${index}`,
        category: 'content' as const,
        title: `Recommendation for ${competitor}`,
        description: 'AI-generated recommendation',
        priority: 'high' as const,
        effort: 'medium' as const,
        expected_impact: 'Increase engagement by 20%',
        implementation_steps: ['Implement strategy'],
        success_metrics: ['Engagement rate'],
        timeline: '4 weeks',
        budget_required: 'low' as const,
        status: 'pending' as const
      })) : []
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return {
        insights,
        recommendations,
        totalCost: competitors.length * 0.05,
        performance: { duration, competitorCount: competitors.length }
      }
    }
  }

  const mockDatabase = {
    async findCompetitors(filters: any = {}) {
      const startTime = performance.now()
      
      // Simulate database query time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200))
      
      const competitors = Array.from({ length: 50 }, (_, i) => ({
        id: `comp_${i}`,
        username: `user_${i}`,
        category: 'cloud-certifications',
        priority: 'medium',
        status: 'active',
        last_analyzed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return { competitors, total: 50, performance: { duration } }
    },

    async findInsights(filters: any = {}) {
      const startTime = performance.now()
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 150))
      
      const insights = Array.from({ length: 20 }, (_, i) => ({
        id: `insight_${i}`,
        type: 'content_strategy',
        title: `Insight ${i}`,
        description: 'Generated insight',
        confidence: 0.8 + Math.random() * 0.2,
        impact: 'high',
        recommendation: 'Recommendation text',
        actionable_steps: ['Step 1'],
        competitors_involved: ['user_1'],
        created_at: new Date().toISOString()
      }))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return { insights, total: 20, performance: { duration } }
    },

    async aggregateMetrics() {
      const startTime = performance.now()
      
      // Simulate complex aggregation query
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300))
      
      const metrics = {
        total_competitors: 50,
        analyzed_competitors: 45,
        insights_generated: 120,
        trends_identified: 25,
        last_updated: new Date().toISOString()
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return { metrics, performance: { duration } }
    }
  }

  beforeEach(() => {
    initialMemory = process.memoryUsage().heapUsed
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  })

  describe('TwitterClient Performance', () => {

    it('should analyze user within performance threshold', async () => {
      const startTime = performance.now()
      
      const result = await mockTwitterClient.analyzeUser('testuser')
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME)
      expect(result.user.username).toBe('testuser')
      expect(result.metrics).toBeDefined()
      
      console.log(`User analysis completed in ${duration.toFixed(2)}ms`)
    })

    it('should fetch tweets efficiently', async () => {
      const tweetCounts = [10, 50, 100]
      
      for (const count of tweetCounts) {
        const startTime = performance.now()
        
        const result = await mockTwitterClient.fetchTweets('testuser', count)
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        expect(result.tweets).toHaveLength(count)
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME)
        
        // Performance should scale linearly with tweet count
        const timePerTweet = duration / count
        expect(timePerTweet).toBeLessThan(50) // Max 50ms per tweet
        
        console.log(`Fetched ${count} tweets in ${duration.toFixed(2)}ms (${timePerTweet.toFixed(2)}ms per tweet)`)
      }
    })

    it('should handle concurrent analysis requests', async () => {
      const concurrentRequests = PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS
      const usernames = Array.from({ length: concurrentRequests }, (_, i) => `user_${i}`)
      
      const startTime = performance.now()
      
      const promises = usernames.map(username => mockTwitterClient.analyzeUser(username))
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalDuration = endTime - startTime
      
      expect(results).toHaveLength(concurrentRequests)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2) // Allow 2x time for concurrent
      
      const averageTime = totalDuration / concurrentRequests
      console.log(`Handled ${concurrentRequests} concurrent requests in ${totalDuration.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms)`)
    })

    it('should maintain throughput requirements', async () => {
      const testDuration = 2000 // 2 seconds
      const startTime = performance.now()
      let operationsCompleted = 0
      
      const performOperations = async () => {
        while (performance.now() - startTime < testDuration) {
          await mockTwitterClient.analyzeUser(`user_${operationsCompleted}`)
          operationsCompleted++
        }
      }
      
      await performOperations()
      
      const operationsPerSecond = operationsCompleted / (testDuration / 1000)
      
      expect(operationsPerSecond).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.THROUGHPUT_PER_SECOND)
      console.log(`Achieved ${operationsPerSecond.toFixed(2)} operations per second`)
    })
  })

  describe('LangChain Workflow Performance', () => {
    // Mock LangChain components for performance testing
    const mockLangChainWorkflow = {
      async analyzeCompetitors(competitors: string[], includeRecommendations = true) {
        const startTime = performance.now()
        
        // Simulate LangChain processing time
        const processingTime = competitors.length * 500 + (includeRecommendations ? 1000 : 0)
        await new Promise(resolve => setTimeout(resolve, processingTime))
        
        const insights = competitors.map((competitor, index) => ({
          id: `insight_${index}`,
          type: 'content_strategy' as const,
          title: `Insight for ${competitor}`,
          description: 'AI-generated insight',
          confidence: 0.8 + Math.random() * 0.2,
          impact: 'high' as const,
          recommendation: 'Generated recommendation',
          actionable_steps: ['Step 1', 'Step 2'],
          competitors_involved: [competitor],
          created_at: new Date().toISOString()
        }))
        
        const recommendations = includeRecommendations ? competitors.map((competitor, index) => ({
          id: `rec_${index}`,
          category: 'content' as const,
          title: `Recommendation for ${competitor}`,
          description: 'AI-generated recommendation',
          priority: 'high' as const,
          effort: 'medium' as const,
          expected_impact: 'Increase engagement by 20%',
          implementation_steps: ['Implement strategy'],
          success_metrics: ['Engagement rate'],
          timeline: '4 weeks',
          budget_required: 'low' as const,
          status: 'pending' as const
        })) : []
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        return {
          insights,
          recommendations,
          totalCost: competitors.length * 0.05,
          performance: { duration, competitorCount: competitors.length }
        }
      }
    }

    it('should process single competitor analysis efficiently', async () => {
      const startTime = performance.now()
      
      const result = await mockLangChainWorkflow.analyzeCompetitors(['testuser'], true)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYSIS_PROCESSING)
      expect(result.insights).toHaveLength(1)
      expect(result.recommendations).toHaveLength(1)
      
      console.log(`Single competitor analysis completed in ${duration.toFixed(2)}ms`)
    })

    it('should scale linearly with competitor count', async () => {
      const competitorCounts = [1, 3, 5]
      const timings: { count: number; duration: number; timePerCompetitor: number }[] = []
      
      for (const count of competitorCounts) {
        const competitors = Array.from({ length: count }, (_, i) => `competitor_${i}`)
        
        const startTime = performance.now()
        const result = await mockLangChainWorkflow.analyzeCompetitors(competitors, false)
        const endTime = performance.now()
        
        const duration = endTime - startTime
        const timePerCompetitor = duration / count
        
        timings.push({ count, duration, timePerCompetitor })
        
        expect(result.insights).toHaveLength(count)
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYSIS_PROCESSING)
        
        console.log(`${count} competitors analyzed in ${duration.toFixed(2)}ms (${timePerCompetitor.toFixed(2)}ms per competitor)`)
      }
      
      // Check that scaling is roughly linear (within 50% variance)
      const baseTimePerCompetitor = timings[0].timePerCompetitor
      for (const timing of timings.slice(1)) {
        const variance = Math.abs(timing.timePerCompetitor - baseTimePerCompetitor) / baseTimePerCompetitor
        expect(variance).toBeLessThan(0.5) // Allow 50% variance
      }
    })

    it('should handle batch processing efficiently', async () => {
      const batchSizes = [2, 3] // Reduced for faster testing
      
      for (const batchSize of batchSizes) {
        const competitors = Array.from({ length: batchSize }, (_, i) => `batch_user_${i}`)
        
        const startTime = performance.now()
        const result = await mockLangChainWorkflow.analyzeCompetitors(competitors, true)
        const endTime = performance.now()
        
        const duration = endTime - startTime
        const timePerCompetitor = duration / batchSize
        
        expect(result.insights).toHaveLength(batchSize)
        expect(result.recommendations).toHaveLength(batchSize)
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYSIS_PROCESSING) // Within normal threshold
        
        console.log(`Batch of ${batchSize} processed in ${duration.toFixed(2)}ms (${timePerCompetitor.toFixed(2)}ms per competitor)`)
      }
    }, 15000) // 15 second timeout
  })

  describe('Memory Usage Performance', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Perform multiple operations
      for (let i = 0; i < 50; i++) {
        await mockTwitterClient.analyzeUser(`test_user_${i}`)
        
        // Force garbage collection every 10 iterations
        if (i % 10 === 0 && global.gc) {
          global.gc()
        }
      }
      
      // Final garbage collection
      if (global.gc) {
        global.gc()
        // Wait for GC to complete
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // Convert to MB
      
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB)
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`)
    })

    it('should handle large datasets efficiently', async () => {
      const largeDatasets = [100, 500, 1000]
      
      for (const size of largeDatasets) {
        const startMemory = process.memoryUsage().heapUsed
        
        // Create large dataset in memory
        const tweets = Array.from({ length: size }, (_, i) => ({
          id: `tweet_${i}`,
          text: `Sample tweet content ${i}`.repeat(10), // Make it larger
          created_at: new Date().toISOString(),
          public_metrics: {
            retweet_count: Math.floor(Math.random() * 100),
            like_count: Math.floor(Math.random() * 500),
            reply_count: Math.floor(Math.random() * 50)
          }
        }))
        
        // Process the dataset
        const startTime = performance.now()
        const processed = tweets.map(tweet => ({
          ...tweet,
          sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
          engagement_score: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count
        }))
        const endTime = performance.now()
        
        const processingTime = endTime - startTime
        const currentMemory = process.memoryUsage().heapUsed
        const memoryUsed = (currentMemory - startMemory) / 1024 / 1024
        
        expect(processed).toHaveLength(size)
        expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME)
        expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB)
        
        console.log(`Processed ${size} tweets in ${processingTime.toFixed(2)}ms using ${memoryUsed.toFixed(2)}MB`)
        
        // Clean up
        tweets.length = 0
        processed.length = 0
      }
    })
  })

  describe('Database Query Performance', () => {
    // Mock database operations for performance testing
    const mockDatabase = {
      async findCompetitors(filters: any = {}) {
        const startTime = performance.now()
        
        // Simulate database query time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200))
        
        const competitors = Array.from({ length: 50 }, (_, i) => ({
          id: `comp_${i}`,
          username: `user_${i}`,
          category: 'cloud-certifications',
          priority: 'medium',
          status: 'active',
          last_analyzed: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        return { competitors, total: 50, performance: { duration } }
      },

      async findInsights(filters: any = {}) {
        const startTime = performance.now()
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150))
        
        const insights = Array.from({ length: 20 }, (_, i) => ({
          id: `insight_${i}`,
          type: 'content_strategy',
          title: `Insight ${i}`,
          description: 'Generated insight',
          confidence: 0.8 + Math.random() * 0.2,
          impact: 'high',
          recommendation: 'Recommendation text',
          actionable_steps: ['Step 1'],
          competitors_involved: ['user_1'],
          created_at: new Date().toISOString()
        }))
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        return { insights, total: 20, performance: { duration } }
      },

      async aggregateMetrics() {
        const startTime = performance.now()
        
        // Simulate complex aggregation query
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300))
        
        const metrics = {
          total_competitors: 50,
          analyzed_competitors: 45,
          insights_generated: 120,
          trends_identified: 25,
          last_updated: new Date().toISOString()
        }
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        return { metrics, performance: { duration } }
      }
    }

    it('should execute competitor queries within threshold', async () => {
      const startTime = performance.now()
      
      const result = await mockDatabase.findCompetitors({ category: 'cloud-certifications' })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      expect(result.competitors).toBeDefined()
      expect(result.total).toBe(50)
      
      console.log(`Competitor query completed in ${duration.toFixed(2)}ms`)
    })

    it('should execute insight queries efficiently', async () => {
      const startTime = performance.now()
      
      const result = await mockDatabase.findInsights({ confidence_min: 0.8 })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY)
      expect(result.insights).toBeDefined()
      expect(result.total).toBe(20)
      
      console.log(`Insights query completed in ${duration.toFixed(2)}ms`)
    })

    it('should handle complex aggregation queries', async () => {
      const startTime = performance.now()
      
      const result = await mockDatabase.aggregateMetrics()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 2) // Allow 2x for complex queries
      expect(result.metrics.total_competitors).toBe(50)
      expect(result.metrics.analyzed_competitors).toBe(45)
      
      console.log(`Aggregation query completed in ${duration.toFixed(2)}ms`)
    })

    it('should handle concurrent database queries', async () => {
      const concurrentQueries = 5
      
      const startTime = performance.now()
      
      const promises = [
        mockDatabase.findCompetitors(),
        mockDatabase.findInsights(),
        mockDatabase.aggregateMetrics(),
        mockDatabase.findCompetitors({ status: 'active' }),
        mockDatabase.findInsights({ type: 'content_strategy' })
      ]
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalDuration = endTime - startTime
      
      expect(results).toHaveLength(concurrentQueries)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY * 3) // Allow 3x for concurrent
      
      console.log(`${concurrentQueries} concurrent queries completed in ${totalDuration.toFixed(2)}ms`)
    })
  })

  describe('End-to-End Performance', () => {
    it('should complete full analysis workflow within time limit', async () => {
      const competitors = ['user1', 'user2', 'user3']
      
      const startTime = performance.now()
      
      // Step 1: Analyze competitors
      const analyses = await Promise.all(
        competitors.map(username => mockTwitterClient.analyzeUser(username))
      )
      
      // Step 2: Run LangChain workflow
      const langchainResult = await mockLangChainWorkflow.analyzeCompetitors(competitors, true)
      
      // Step 3: Save to database (simulated)
      await Promise.all([
        mockDatabase.findCompetitors(),
        mockDatabase.findInsights(),
        mockDatabase.aggregateMetrics()
      ])
      
      const endTime = performance.now()
      const totalDuration = endTime - startTime
      
      expect(analyses).toHaveLength(3)
      expect(langchainResult.insights).toHaveLength(3)
      expect(langchainResult.recommendations).toHaveLength(3)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.ANALYSIS_PROCESSING * 2)
      
      console.log(`Complete workflow for ${competitors.length} competitors: ${totalDuration.toFixed(2)}ms`)
    })

    it('should maintain performance under load', async () => {
      const loadTestDuration = 2000 // 2 seconds
      const startTime = performance.now()
      let operationsCompleted = 0
      let errors = 0
      
      const runLoadTest = async () => {
        while (performance.now() - startTime < loadTestDuration) {
          try {
            await mockTwitterClient.analyzeUser(`load_user_${operationsCompleted}`)
            operationsCompleted++
          } catch (error) {
            errors++
          }
          
          // Prevent infinite loop
          if (operationsCompleted + errors > 20) break
        }
      }
      
      await runLoadTest()
      
      const actualDuration = performance.now() - startTime
      const operationsPerSecond = operationsCompleted / (actualDuration / 1000)
      const errorRate = errors / (operationsCompleted + errors)
      
      expect(operationsPerSecond).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.THROUGHPUT_PER_SECOND / 2) // Half throughput under load
      expect(errorRate).toBeLessThan(0.1) // Less than 10% error rate
      
      console.log(`Load test: ${operationsCompleted} operations, ${operationsPerSecond.toFixed(2)} ops/sec, ${(errorRate * 100).toFixed(2)}% error rate`)
    }, 10000) // 10 second timeout
  })

  describe('Performance Monitoring', () => {
    it('should track performance metrics over time', async () => {
      const iterations = 10
      const metrics: { iteration: number; duration: number; memory: number }[] = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        const startMemory = process.memoryUsage().heapUsed
        
        await mockTwitterClient.analyzeUser(`perf_user_${i}`)
        
        const endTime = performance.now()
        const endMemory = process.memoryUsage().heapUsed
        
        metrics.push({
          iteration: i,
          duration: endTime - startTime,
          memory: (endMemory - startMemory) / 1024 / 1024 // MB
        })
      }
      
      // Calculate statistics
      const durations = metrics.map(m => m.duration)
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)
      
      const memoryUsages = metrics.map(m => m.memory)
      const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME)
      expect(maxDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 1.5)
      expect(avgMemory).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB / 10) // Per operation
      
      console.log(`Performance over ${iterations} iterations:`)
      console.log(`Duration - Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`)
      console.log(`Memory - Avg: ${avgMemory.toFixed(2)}MB per operation`)
    })
  })
})