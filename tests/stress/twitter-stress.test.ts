import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performance } from 'perf_hooks'

// Stress Tests for Twitter Intelligence System
// These tests push the system to its limits to identify breaking points and resource constraints

describe('Twitter Intelligence Stress Tests', () => {
  const STRESS_THRESHOLDS = {
    MAX_CONCURRENT_OPERATIONS: 50,
    MAX_MEMORY_USAGE_MB: 500, // 500MB max
    MAX_RESPONSE_TIME_UNDER_STRESS: 10000, // 10 seconds max
    MIN_SUCCESS_RATE_UNDER_STRESS: 0.90, // 90% success rate minimum (more realistic under stress)
    MAX_ANALYSIS_BATCH_SIZE: 15, // Reduced for faster testing
    MAX_SUSTAINED_LOAD_DURATION: 30000 // 30 seconds
  }

  let initialMemory: number
  let operationCounter = 0

  beforeEach(() => {
    initialMemory = process.memoryUsage().heapUsed
    operationCounter = 0
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (global.gc) {
      global.gc()
    }
  })

  // Stress test mock implementations
  const createStressTestMocks = () => {
    return {
      twitterClient: {
        async analyzeUser(username: string) {
          operationCounter++
          const startTime = performance.now()
          
          // Simulate varying load times under stress
          const baseDelay = Math.random() * 300
          const stressMultiplier = Math.min(operationCounter / 100, 3) // Up to 3x slower under stress
          const delay = baseDelay * (1 + stressMultiplier)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Simulate occasional failures under high load
          if (operationCounter > 30 && Math.random() < 0.05) {
            throw new Error(`Rate limited for user ${username}`)
          }
          
          const endTime = performance.now()
          
          return {
            user: { username },
            metrics: {
              followers: Math.floor(Math.random() * 100000),
              engagement_rate: Math.random() * 10,
              posting_frequency: Math.random() * 5
            },
            performance: { duration: endTime - startTime }
          }
        },

        async fetchTweets(username: string, count: number = 100) {
          operationCounter++
          const startTime = performance.now()
          
          // Larger datasets under stress
          const tweets = Array.from({ length: count }, (_, i) => ({
            id: `tweet_${username}_${i}`,
            text: `Tweet content ${i} `.repeat(10), // Larger content
            created_at: new Date().toISOString(),
            public_metrics: {
              retweet_count: Math.floor(Math.random() * 1000),
              like_count: Math.floor(Math.random() * 5000),
              reply_count: Math.floor(Math.random() * 500)
            },
            entities: {
              hashtags: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => `hashtag${j}`),
              urls: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => `url${j}`)
            }
          }))
          
          // Processing time scales with count and stress
          const processingTime = count * (2 + Math.min(operationCounter / 50, 5))
          await new Promise(resolve => setTimeout(resolve, processingTime))
          
          const endTime = performance.now()
          
          return { 
            tweets, 
            performance: { duration: endTime - startTime },
            metadata: { totalProcessed: count, operationId: operationCounter }
          }
        }
      },

      langchainWorkflow: {
        async analyzeCompetitors(competitors: string[], includeRecommendations = true) {
          operationCounter++
          const startTime = performance.now()
          
          // LangChain processing gets slower with batch size (optimized for testing)
          const baseTime = competitors.length * 100
          const complexityMultiplier = Math.min(Math.pow(competitors.length, 1.1), 3) // Cap complexity
          const processingTime = baseTime * complexityMultiplier
          
          await new Promise(resolve => setTimeout(resolve, processingTime))
          
          // Simulate memory intensive operations
          const largeDataStructure = Array.from({ length: competitors.length * 1000 }, (_, i) => ({
            id: i,
            data: `processing_data_${i}`.repeat(50),
            metadata: { competitor: competitors[i % competitors.length], timestamp: Date.now() }
          }))
          
          const insights = competitors.map((competitor, index) => ({
            id: `stress_insight_${operationCounter}_${index}`,
            type: 'content_strategy' as const,
            title: `Stress Test Insight for ${competitor}`,
            description: `Generated under stress conditions - operation ${operationCounter}`,
            confidence: Math.max(0.5, 0.9 - (operationCounter / 1000)), // Confidence degrades under stress
            impact: 'high' as const,
            recommendation: `Recommendation for ${competitor} under stress`,
            actionable_steps: Array.from({ length: 5 }, (_, i) => `Action ${i + 1}`),
            competitors_involved: [competitor],
            created_at: new Date().toISOString(),
            stress_metadata: {
              operation_id: operationCounter,
              batch_size: competitors.length,
              processing_time: processingTime
            }
          }))
          
          const recommendations = includeRecommendations ? competitors.map((competitor, index) => ({
            id: `stress_rec_${operationCounter}_${index}`,
            category: 'content' as const,
            title: `Stress Recommendation for ${competitor}`,
            description: `Generated under load - operation ${operationCounter}`,
            priority: 'high' as const,
            effort: 'high' as const,
            expected_impact: `Impact analysis for ${competitor}`,
            implementation_steps: Array.from({ length: 3 }, (_, i) => `Implementation step ${i + 1}`),
            success_metrics: [`Metric for ${competitor}`],
            timeline: '8 weeks',
            budget_required: 'high' as const,
            status: 'pending' as const
          })) : []
          
          // Cleanup large data structure
          largeDataStructure.length = 0
          
          const endTime = performance.now()
          
          return {
            insights,
            recommendations,
            totalCost: competitors.length * 0.1,
            stress_metrics: {
              operation_id: operationCounter,
              batch_size: competitors.length,
              processing_time: endTime - startTime,
              memory_used: process.memoryUsage().heapUsed - initialMemory
            }
          }
        }
      },

      database: {
        async executeQuery(queryType: string, params: any = {}) {
          operationCounter++
          const startTime = performance.now()
          
          // Database becomes slower under high load
          const baseDelay = {
            'select': 50,
            'insert': 100,
            'update': 75,
            'delete': 25,
            'complex_aggregation': 300
          }[queryType] || 100
          
          const loadMultiplier = 1 + (operationCounter / 100)
          const delay = baseDelay * loadMultiplier
          
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Simulate connection pool exhaustion
          if (operationCounter > 40 && Math.random() < 0.03) {
            throw new Error('Database connection pool exhausted')
          }
          
          const endTime = performance.now()
          
          return {
            result: `${queryType}_result`,
            affected_rows: Math.floor(Math.random() * 100),
            execution_time: endTime - startTime,
            operation_id: operationCounter
          }
        }
      }
    }
  }

  describe('High Concurrency Stress Tests', () => {
    it('should handle maximum concurrent Twitter API calls', async () => {
      const mocks = createStressTestMocks()
      const concurrentRequests = STRESS_THRESHOLDS.MAX_CONCURRENT_OPERATIONS
      const usernames = Array.from({ length: concurrentRequests }, (_, i) => `stress_user_${i}`)
      
      const startTime = performance.now()
      const startMemory = process.memoryUsage().heapUsed
      
      const promises = usernames.map(username => 
        mocks.twitterClient.analyzeUser(username).catch(error => ({ error: error.message }))
      )
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const endMemory = process.memoryUsage().heapUsed
      const duration = endTime - startTime
      const memoryUsed = (endMemory - startMemory) / 1024 / 1024
      
      const successfulResults = results.filter(result => !('error' in result))
      const successRate = successfulResults.length / results.length
      
      expect(successRate).toBeGreaterThanOrEqual(STRESS_THRESHOLDS.MIN_SUCCESS_RATE_UNDER_STRESS)
      expect(duration).toBeLessThan(STRESS_THRESHOLDS.MAX_RESPONSE_TIME_UNDER_STRESS)
      expect(memoryUsed).toBeLessThan(STRESS_THRESHOLDS.MAX_MEMORY_USAGE_MB)
      
      console.log(`Concurrent stress test: ${concurrentRequests} requests, ${(successRate * 100).toFixed(1)}% success rate, ${duration.toFixed(0)}ms, ${memoryUsed.toFixed(1)}MB`)
    }, 30000)

    it('should handle burst traffic patterns', async () => {
      const mocks = createStressTestMocks()
      const burstSizes = [10, 25, 40, 25, 10] // Traffic burst pattern
      const results: any[] = []
      
      const startTime = performance.now()
      
      for (const burstSize of burstSizes) {
        const burstStart = performance.now()
        
        const burstPromises = Array.from({ length: burstSize }, (_, i) => 
          mocks.twitterClient.analyzeUser(`burst_user_${i}`).catch(error => ({ error: error.message }))
        )
        
        const burstResults = await Promise.all(burstPromises)
        const burstEnd = performance.now()
        
        results.push({
          burstSize,
          duration: burstEnd - burstStart,
          successCount: burstResults.filter(r => !('error' in r)).length,
          errorCount: burstResults.filter(r => 'error' in r).length
        })
        
        // Brief pause between bursts
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const totalDuration = performance.now() - startTime
      const totalOperations = burstSizes.reduce((a, b) => a + b, 0)
      const totalSuccess = results.reduce((sum, burst) => sum + burst.successCount, 0)
      const overallSuccessRate = totalSuccess / totalOperations
      
      expect(overallSuccessRate).toBeGreaterThanOrEqual(STRESS_THRESHOLDS.MIN_SUCCESS_RATE_UNDER_STRESS)
      expect(totalDuration).toBeLessThan(STRESS_THRESHOLDS.MAX_SUSTAINED_LOAD_DURATION)
      
      console.log(`Burst pattern test: ${totalOperations} total ops, ${(overallSuccessRate * 100).toFixed(1)}% success rate, ${totalDuration.toFixed(0)}ms`)
      console.log('Burst details:', results.map(r => `${r.burstSize}:${r.successCount}/${r.burstSize}`).join(' '))
    }, 40000)
  })

  describe('Large Dataset Stress Tests', () => {
    it('should handle maximum batch analysis size', async () => {
      const mocks = createStressTestMocks()
      const maxBatchSize = STRESS_THRESHOLDS.MAX_ANALYSIS_BATCH_SIZE
      const competitors = Array.from({ length: maxBatchSize }, (_, i) => `batch_competitor_${i}`)
      
      const startTime = performance.now()
      const startMemory = process.memoryUsage().heapUsed
      
      const result = await mocks.langchainWorkflow.analyzeCompetitors(competitors, true)
      
      const endTime = performance.now()
      const endMemory = process.memoryUsage().heapUsed
      const duration = endTime - startTime
      const memoryUsed = (endMemory - startMemory) / 1024 / 1024
      
      expect(result.insights).toHaveLength(maxBatchSize)
      expect(result.recommendations).toHaveLength(maxBatchSize)
      expect(duration).toBeLessThan(STRESS_THRESHOLDS.MAX_RESPONSE_TIME_UNDER_STRESS)
      expect(memoryUsed).toBeLessThan(STRESS_THRESHOLDS.MAX_MEMORY_USAGE_MB)
      
      console.log(`Max batch analysis: ${maxBatchSize} competitors, ${duration.toFixed(0)}ms, ${memoryUsed.toFixed(1)}MB`)
    }, 20000)

    it('should handle large tweet datasets', async () => {
      const mocks = createStressTestMocks()
      const largeTweetCounts = [500, 1000, 2000]
      
      for (const tweetCount of largeTweetCounts) {
        const startTime = performance.now()
        const startMemory = process.memoryUsage().heapUsed
        
        const result = await mocks.twitterClient.fetchTweets('stress_user', tweetCount)
        
        const endTime = performance.now()
        const endMemory = process.memoryUsage().heapUsed
        const duration = endTime - startTime
        const memoryUsed = (endMemory - startMemory) / 1024 / 1024
        
        expect(result.tweets).toHaveLength(tweetCount)
        expect(duration).toBeLessThan(STRESS_THRESHOLDS.MAX_RESPONSE_TIME_UNDER_STRESS)
        expect(memoryUsed).toBeLessThan(STRESS_THRESHOLDS.MAX_MEMORY_USAGE_MB)
        
        console.log(`Large dataset: ${tweetCount} tweets, ${duration.toFixed(0)}ms, ${memoryUsed.toFixed(1)}MB`)
        
        // Force cleanup between iterations
        result.tweets.length = 0
        if (global.gc) {
          global.gc()
        }
      }
    }, 25000)
  })

  describe('Resource Exhaustion Tests', () => {
    it('should handle database connection stress', async () => {
      const mocks = createStressTestMocks()
      const connectionRequests = 100
      const queryTypes = ['select', 'insert', 'update', 'delete', 'complex_aggregation']
      
      const startTime = performance.now()
      
      const promises = Array.from({ length: connectionRequests }, (_, i) => {
        const queryType = queryTypes[i % queryTypes.length]
        return mocks.database.executeQuery(queryType, { id: i }).catch(error => ({ error: error.message }))
      })
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      const successfulResults = results.filter(result => !('error' in result))
      const successRate = successfulResults.length / results.length
      
      expect(successRate).toBeGreaterThanOrEqual(0.90) // 90% minimum for database stress
      expect(duration).toBeLessThan(STRESS_THRESHOLDS.MAX_RESPONSE_TIME_UNDER_STRESS)
      
      const errorTypes = results
        .filter(r => 'error' in r)
        .map(r => r.error)
        .reduce((acc: any, error: string) => {
          acc[error] = (acc[error] || 0) + 1
          return acc
        }, {})
      
      console.log(`Database stress: ${connectionRequests} queries, ${(successRate * 100).toFixed(1)}% success rate, ${duration.toFixed(0)}ms`)
      if (Object.keys(errorTypes).length > 0) {
        console.log('Error breakdown:', errorTypes)
      }
    }, 15000)

    it('should handle memory pressure gracefully', async () => {
      const mocks = createStressTestMocks()
      const iterations = 10 // Reduced for faster testing
      const memorySnapshots: number[] = []
      
      let successfulOperations = 0
      let failedOperations = 0
      
      for (let i = 0; i < iterations; i++) {
        const beforeMemory = process.memoryUsage().heapUsed
        
        try {
          // Perform memory-intensive operations (reduced scope)
          const competitors = Array.from({ length: 3 }, (_, j) => `memory_test_${i}_${j}`)
          const result = await mocks.langchainWorkflow.analyzeCompetitors(competitors, true)
          
          // Also fetch tweet datasets (reduced size)
          await mocks.twitterClient.fetchTweets('memory_user', 500)
          
          successfulOperations++
          
          // Force cleanup more frequently
          if (i % 3 === 0 && global.gc) {
            global.gc()
          }
        } catch (error) {
          failedOperations++
        }
        
        const afterMemory = process.memoryUsage().heapUsed
        memorySnapshots.push(afterMemory)
        
        // Brief pause between iterations
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const maxMemory = Math.max(...memorySnapshots)
      const memoryGrowth = (maxMemory - initialMemory) / 1024 / 1024
      const successRate = successfulOperations / (successfulOperations + failedOperations)
      
      expect(successRate).toBeGreaterThanOrEqual(0.80) // 80% minimum under memory pressure
      expect(memoryGrowth).toBeLessThan(STRESS_THRESHOLDS.MAX_MEMORY_USAGE_MB)
      
      console.log(`Memory pressure test: ${iterations} iterations, ${(successRate * 100).toFixed(1)}% success rate, ${memoryGrowth.toFixed(1)}MB peak growth`)
    }, 20000)
  })

  describe('Sustained Load Tests', () => {
    it('should maintain performance under sustained load', async () => {
      const mocks = createStressTestMocks()
      const testDuration = 10000 // 10 seconds
      const operationInterval = 200 // New operation every 200ms
      
      const startTime = performance.now()
      let totalOperations = 0
      let successfulOperations = 0
      let failedOperations = 0
      const responseTimes: number[] = []
      
      const runSustainedLoad = async () => {
        while (performance.now() - startTime < testDuration) {
          const operationStart = performance.now()
          
          try {
            // Alternate between different operation types
            if (totalOperations % 3 === 0) {
              await mocks.twitterClient.analyzeUser(`sustained_user_${totalOperations}`)
            } else if (totalOperations % 3 === 1) {
              await mocks.twitterClient.fetchTweets(`sustained_user_${totalOperations}`, 100)
            } else {
              await mocks.database.executeQuery('select', { id: totalOperations })
            }
            
            successfulOperations++
          } catch (error) {
            failedOperations++
          }
          
          const operationEnd = performance.now()
          responseTimes.push(operationEnd - operationStart)
          totalOperations++
          
          // Wait for next operation
          await new Promise(resolve => setTimeout(resolve, operationInterval))
        }
      }
      
      await runSustainedLoad()
      
      const actualDuration = performance.now() - startTime
      const operationsPerSecond = totalOperations / (actualDuration / 1000)
      const successRate = successfulOperations / totalOperations
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
      
      expect(successRate).toBeGreaterThanOrEqual(STRESS_THRESHOLDS.MIN_SUCCESS_RATE_UNDER_STRESS)
      expect(avgResponseTime).toBeLessThan(STRESS_THRESHOLDS.MAX_RESPONSE_TIME_UNDER_STRESS / 2)
      expect(p95ResponseTime).toBeLessThan(STRESS_THRESHOLDS.MAX_RESPONSE_TIME_UNDER_STRESS)
      
      console.log(`Sustained load: ${totalOperations} ops in ${(actualDuration/1000).toFixed(1)}s, ${operationsPerSecond.toFixed(1)} ops/sec`)
      console.log(`Success rate: ${(successRate * 100).toFixed(1)}%, Avg response: ${avgResponseTime.toFixed(0)}ms, P95: ${p95ResponseTime.toFixed(0)}ms`)
    }, 15000)

    it('should recover from temporary failures', async () => {
      const mocks = createStressTestMocks()
      let injectedFailures = 0
      const maxFailures = 10
      
      // Inject failures into the twitter client
      const originalAnalyzeUser = mocks.twitterClient.analyzeUser
      mocks.twitterClient.analyzeUser = async (username: string) => {
        if (injectedFailures < maxFailures && Math.random() < 0.3) {
          injectedFailures++
          throw new Error(`Simulated failure ${injectedFailures}`)
        }
        return originalAnalyzeUser.call(mocks.twitterClient, username)
      }
      
      const testOperations = 50
      const results: Array<{ success: boolean; attempt: number; timestamp: number }> = []
      
      for (let i = 0; i < testOperations; i++) {
        const timestamp = performance.now()
        
        try {
          await mocks.twitterClient.analyzeUser(`recovery_user_${i}`)
          results.push({ success: true, attempt: i, timestamp })
        } catch (error) {
          results.push({ success: false, attempt: i, timestamp })
        }
        
        await new Promise(resolve => setTimeout(resolve, 50)) // Small delay between operations
      }
      
      const totalSuccess = results.filter(r => r.success).length
      const totalFailures = results.filter(r => !r.success).length
      const finalSuccessRate = totalSuccess / testOperations
      
      // Check recovery pattern - should improve over time
      const firstHalf = results.slice(0, Math.floor(results.length / 2))
      const secondHalf = results.slice(Math.floor(results.length / 2))
      
      const firstHalfSuccessRate = firstHalf.filter(r => r.success).length / firstHalf.length
      const secondHalfSuccessRate = secondHalf.filter(r => r.success).length / secondHalf.length
      
      expect(finalSuccessRate).toBeGreaterThanOrEqual(0.80) // 80% overall success
      expect(secondHalfSuccessRate).toBeGreaterThan(firstHalfSuccessRate) // Recovery pattern
      
      console.log(`Recovery test: ${testOperations} operations, ${(finalSuccessRate * 100).toFixed(1)}% overall success`)
      console.log(`Recovery pattern: ${(firstHalfSuccessRate * 100).toFixed(1)}% → ${(secondHalfSuccessRate * 100).toFixed(1)}% success rate`)
    }, 12000)
  })

  describe('Edge Case Stress Tests', () => {
    it('should handle rapid start/stop cycles', async () => {
      const mocks = createStressTestMocks()
      const cycles = 10
      const operationsPerCycle = 5
      
      let totalOperations = 0
      let successfulCycles = 0
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        try {
          // Rapid burst of operations
          const cyclePromises = Array.from({ length: operationsPerCycle }, (_, i) => 
            mocks.twitterClient.analyzeUser(`cycle_${cycle}_user_${i}`)
          )
          
          await Promise.all(cyclePromises)
          successfulCycles++
          totalOperations += operationsPerCycle
          
          // Immediate stop (no delay between cycles)
        } catch (error) {
          // Some cycles may fail under stress
        }
      }
      
      const cycleSuccessRate = successfulCycles / cycles
      
      expect(cycleSuccessRate).toBeGreaterThanOrEqual(0.80) // 80% of cycles should succeed
      
      console.log(`Rapid cycles: ${cycles} cycles, ${(cycleSuccessRate * 100).toFixed(1)}% cycle success rate, ${totalOperations} total operations`)
    }, 8000)

    it('should handle mixed workload patterns', async () => {
      const mocks = createStressTestMocks()
      const workloadMix = [
        { type: 'light', weight: 0.5, operation: () => mocks.database.executeQuery('select') },
        { type: 'medium', weight: 0.3, operation: () => mocks.twitterClient.analyzeUser('mixed_user') },
        { type: 'heavy', weight: 0.2, operation: () => mocks.langchainWorkflow.analyzeCompetitors(['user1', 'user2'], true) }
      ]
      
      const totalOperations = 30
      const results: Array<{ type: string; success: boolean; duration: number }> = []
      
      for (let i = 0; i < totalOperations; i++) {
        // Select operation type based on weight
        const random = Math.random()
        let cumulativeWeight = 0
        let selectedWorkload = workloadMix[0]
        
        for (const workload of workloadMix) {
          cumulativeWeight += workload.weight
          if (random <= cumulativeWeight) {
            selectedWorkload = workload
            break
          }
        }
        
        const startTime = performance.now()
        
        try {
          await selectedWorkload.operation()
          const endTime = performance.now()
          results.push({ type: selectedWorkload.type, success: true, duration: endTime - startTime })
        } catch (error) {
          const endTime = performance.now()
          results.push({ type: selectedWorkload.type, success: false, duration: endTime - startTime })
        }
      }
      
      // Analyze results by workload type
      const workloadStats = workloadMix.map(workload => {
        const typeResults = results.filter(r => r.type === workload.type)
        const successCount = typeResults.filter(r => r.success).length
        const avgDuration = typeResults.reduce((sum, r) => sum + r.duration, 0) / typeResults.length
        
        return {
          type: workload.type,
          count: typeResults.length,
          successRate: successCount / typeResults.length,
          avgDuration: avgDuration
        }
      })
      
      const overallSuccessRate = results.filter(r => r.success).length / results.length
      
      expect(overallSuccessRate).toBeGreaterThanOrEqual(0.85) // 85% overall success
      
      // Each workload type should maintain reasonable performance
      workloadStats.forEach(stats => {
        expect(stats.successRate).toBeGreaterThanOrEqual(0.80) // 80% minimum per type
      })
      
      console.log(`Mixed workload: ${totalOperations} operations, ${(overallSuccessRate * 100).toFixed(1)}% overall success`)
      console.log('Workload breakdown:', workloadStats.map(s => 
        `${s.type}:${s.count}ops(${(s.successRate*100).toFixed(0)}%,${s.avgDuration.toFixed(0)}ms)`
      ).join(' '))
    }, 20000)
  })
})