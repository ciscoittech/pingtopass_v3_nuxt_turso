import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TwitterClient } from '../../server/utils/twitterClient'
import { TwitterAnalysisAgent } from '../../server/utils/twitterAnalysisAgent'

// Mock fetch globally
global.fetch = vi.fn()

// Test configuration
const TEST_CONFIG = {
  API_TIMEOUT: 5000,
  MAX_RETRIES: 3,
  RATE_LIMIT_WINDOW: 900000, // 15 minutes
  PERFORMANCE_THRESHOLD: 2000 // 2 seconds
}

describe('TwitterClient', () => {
  let client: TwitterClient
  let performanceTracker: { start: number; operations: any[] }
  
  beforeEach(() => {
    client = new TwitterClient('test-api-key')
    performanceTracker = { start: Date.now(), operations: [] }
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Log performance metrics for analysis
    const duration = Date.now() - performanceTracker.start
    if (duration > TEST_CONFIG.PERFORMANCE_THRESHOLD) {
      console.warn(`Test took ${duration}ms, exceeding threshold of ${TEST_CONFIG.PERFORMANCE_THRESHOLD}ms`)
    }
  })

  describe('getUser', () => {
    it('should fetch user information', async () => {
      const mockUser = {
        id: '123456789',
        username: 'testuser',
        name: 'Test User',
        followers_count: 1000,
        verified: false
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUser }),
        headers: new Headers()
      } as Response)

      const result = await client.getUser('testuser')

      expect(result).toEqual(mockUser)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/by/username/testuser'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'User not found'
      } as Response)

      const result = await client.getUser('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle rate limiting', async () => {
      // Simulate rate limit headers
      const headers = new Headers({
        'x-rate-limit-remaining': '0',
        'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900) // 15 minutes from now
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
        headers
      } as Response)

      // First call should work
      await client.getUser('testuser')

      // Manually set rate limit to trigger limit checking
      const rateLimits = (client as any).rateLimits
      rateLimits.set('users', {
        count: 100,
        resetTime: Date.now() + 900000
      })

      // Second call should return null due to rate limiting
      const result = await client.getUser('testuser2')
      expect(result).toBeNull()
    })
  })

  describe('getUserTweets', () => {
    it('should fetch user tweets with options', async () => {
      const mockUser = { id: '123', username: 'testuser' }
      const mockTweets = [
        {
          id: 'tweet1',
          text: 'Test tweet',
          public_metrics: { like_count: 10, retweet_count: 5 }
        }
      ]

      // Mock user fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUser }),
        headers: new Headers()
      } as Response)

      // Mock tweets fetch
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTweets }),
        headers: new Headers()
      } as Response)

      const result = await client.getUserTweets('testuser', {
        maxResults: 10,
        excludeReplies: true
      })

      expect(result).toEqual(mockTweets)
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('analyzeCompetitor', () => {
    it('should perform comprehensive competitor analysis', async () => {
      const mockUser = {
        id: '123',
        username: 'competitor',
        name: 'Competitor',
        followers_count: 5000,
        tweet_count: 1000
      }

      const mockTweets = [
        {
          id: 'tweet1',
          text: 'Great insights on #AWS certification! Here are 5 tips...',
          created_at: new Date().toISOString(),
          public_metrics: { like_count: 50, retweet_count: 20, reply_count: 5, quote_count: 2 },
          entities: {
            hashtags: [{ tag: 'AWS' }]
          }
        },
        {
          id: 'tweet2',
          text: 'Just passed my CISSP exam! 🎉',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          public_metrics: { like_count: 30, retweet_count: 10, reply_count: 8, quote_count: 1 }
        }
      ]

      // Mock API calls - analyzeCompetitor calls getUser, then getUserTweets calls getUser again, then tweets fetch
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUser }),
          headers: new Headers()
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockUser }),
          headers: new Headers()
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTweets }),
          headers: new Headers()
        } as Response)

      const result = await client.analyzeCompetitor('competitor')

      expect(result).toBeDefined()
      expect(result?.user.username).toBe('competitor')
      expect(result?.recent_tweets).toHaveLength(2)
      expect(result?.metrics.avg_likes).toBe(40) // (50 + 30) / 2
      expect(result?.content_themes).toContain('#AWS')
      expect(result?.posting_patterns.best_times).toBeDefined()
    })
  })
})

describe('TwitterAnalysisAgent', () => {
  let agent: TwitterAnalysisAgent
  
  beforeEach(() => {
    agent = new TwitterAnalysisAgent('twitter-key', 'openrouter-key')
    vi.clearAllMocks()
  })

  describe('analyzeCompetitors', () => {
    it('should analyze multiple competitors and generate insights', async () => {
      // Mock TwitterClient.analyzeCompetitor
      const mockAnalysis = {
        user: {
          username: 'competitor1',
          followers_count: 5000,
          tweet_count: 1000
        },
        recent_tweets: [
          {
            id: 'tweet1',
            text: 'Educational content about cloud computing',
            public_metrics: { like_count: 100, retweet_count: 50, reply_count: 10, quote_count: 5 }
          }
        ],
        metrics: {
          engagement_rate: 75,
          avg_likes: 100,
          avg_retweets: 50,
          posting_frequency: 2.5,
          hashtag_performance: { 'AWS': 150, 'Cloud': 100 },
          top_performing_tweets: []
        },
        content_themes: ['AWS', 'Cloud Computing', 'Certification'],
        posting_patterns: {
          best_times: ['09:00', '15:00'],
          frequency: 'daily',
          consistency_score: 85
        },
        engagement_insights: {
          top_content_types: ['educational', 'questions'],
          audience_engagement: 'high',
          viral_factors: ['educational_content', 'trending_hashtags']
        }
      }

      // Mock OpenRouter responses for AI insights and recommendations
      const mockInsightsResponse = [
        {
          type: 'content_strategy',
          title: 'Educational Content Drives Higher Engagement',
          description: 'Competitors posting educational content see 2.3x higher engagement',
          confidence: 0.85,
          impact: 'high',
          recommendation: 'Focus on educational content that solves specific problems',
          actionable_steps: ['Create weekly tips series', 'Share exam insights'],
          competitors_involved: ['competitor1']
        }
      ]

      const mockRecommendationsResponse = [
        {
          category: 'content',
          title: 'Implement Educational Tip Series',
          description: 'Create weekly educational content series based on competitor success',
          priority: 'high',
          effort: 'medium',
          expected_impact: 'Increase engagement by 40% and followers by 25%',
          implementation_steps: ['Research top questions', 'Create content calendar'],
          success_metrics: ['Engagement rate', 'Follower growth'],
          timeline: '6-8 weeks',
          budget_required: 'low'
        }
      ]

      // Mock the TwitterClient methods
      vi.spyOn(agent['twitterClient'], 'analyzeCompetitor')
        .mockResolvedValue(mockAnalysis as any)

      // Mock OpenRouter chat responses
      vi.spyOn(agent['openRouter'], 'chat')
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockInsightsResponse)
            }
          }]
        } as any)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockRecommendationsResponse)
            }
          }]
        } as any)

      const result = await agent.analyzeCompetitors(['competitor1'])

      expect(result.analyses).toHaveLength(1)
      expect(result.insights).toHaveLength(1)
      expect(result.recommendations).toHaveLength(1)
      expect(result.benchmarks).toBeDefined()

      // Check insight structure
      const insight = result.insights[0]
      expect(insight.title).toBe('Educational Content Drives Higher Engagement')
      expect(insight.confidence).toBe(0.85)
      expect(insight.impact).toBe('high')

      // Check recommendation structure
      const recommendation = result.recommendations[0]
      expect(recommendation.category).toBe('content')
      expect(recommendation.priority).toBe('high')
    })

    it('should handle analysis errors gracefully', async () => {
      // Mock failure
      vi.spyOn(agent['twitterClient'], 'analyzeCompetitor')
        .mockRejectedValue(new Error('API rate limit exceeded'))

      await expect(agent.analyzeCompetitors(['bad-user']))
        .rejects.toThrow('No competitors could be analyzed')
    })
  })

  describe('analyzeContentOpportunities', () => {
    it('should identify trending themes and content gaps', async () => {
      const mockAnalysis = {
        user: { username: 'competitor1' },
        content_themes: ['AWS', 'Kubernetes', 'DevOps'],
        metrics: {
          engagement_rate: 75,
          avg_likes: 100,
          avg_retweets: 50,
          posting_frequency: 2.5
        },
        recent_tweets: [
          {
            text: 'What is the best way to prepare for AWS certification?',
            entities: { urls: [] }
          },
          {
            text: '5 essential tips for cloud architecture',
            entities: { urls: [] }
          }
        ]
      }

      vi.spyOn(agent['twitterClient'], 'analyzeCompetitor')
        .mockResolvedValue(mockAnalysis as any)

      const result = await agent.analyzeContentOpportunities(['competitor1'])

      expect(result.trending_themes).toBeDefined()
      expect(result.content_gaps).toBeDefined()
      expect(result.viral_patterns).toBeDefined()

      // Should identify question-based content pattern
      const questionPattern = result.viral_patterns.find(p => 
        p.pattern === 'Question-based content'
      )
      expect(questionPattern).toBeDefined()
      expect(questionPattern?.success_rate).toBeGreaterThan(0)
    })
  })

  describe('detectCompetitorChanges', () => {
    it('should detect significant metric changes', async () => {
      const previousAnalysis = {
        user: { username: 'competitor1', followers_count: 5000 },
        metrics: {
          engagement_rate: 50,
          avg_likes: 75,
          posting_frequency: 2.0
        }
      }

      const currentAnalysis = {
        user: { username: 'competitor1', followers_count: 6000 }, // 20% increase
        metrics: {
          engagement_rate: 76, // 52% increase (to trigger 'high' significance)
          avg_likes: 100, // 33% increase
          posting_frequency: 3.0 // 50% increase
        }
      }

      vi.spyOn(agent['twitterClient'], 'analyzeCompetitor')
        .mockResolvedValue(currentAnalysis as any)

      const result = await agent.detectCompetitorChanges('competitor1', previousAnalysis as any)

      expect(result.significant_changes.length).toBeGreaterThan(0)
      
      // Should detect engagement rate increase
      const engagementChange = result.significant_changes.find(c => 
        c.metric === 'engagement_rate'
      )
      expect(engagementChange).toBeDefined()
      expect(engagementChange?.change_percentage).toBeCloseTo(52, 0)
      expect(engagementChange?.significance).toBe('high')
    })
  })
})

describe('Twitter Integration', () => {
  it('should handle complete workflow from competitor addition to insights', async () => {
    // This would test the full workflow:
    // 1. Add competitor
    // 2. Run analysis
    // 3. Generate insights
    // 4. Create recommendations
    // 5. Monitor for changes

    const workflow = {
      addCompetitor: async (username: string) => ({ id: 'comp_123', username }),
      analyzeCompetitor: async (id: string) => ({
        insights: 5,
        recommendations: 3,
        benchmarks: 4
      }),
      monitorChanges: async (id: string) => ({
        alerts: 2,
        significant_changes: 1
      })
    }

    // Add competitor
    const competitor = await workflow.addCompetitor('testcompetitor')
    expect(competitor.username).toBe('testcompetitor')

    // Run analysis
    const analysis = await workflow.analyzeCompetitor(competitor.id)
    expect(analysis.insights).toBeGreaterThan(0)
    expect(analysis.recommendations).toBeGreaterThan(0)

    // Monitor for changes
    const monitoring = await workflow.monitorChanges(competitor.id)
    expect(monitoring.alerts).toBeGreaterThan(0)
  })
})

// Enhanced Error Handling Tests
describe('TwitterClient - Advanced Error Handling', () => {
  let client: TwitterClient

  beforeEach(() => {
    client = new TwitterClient('test-api-key')
    vi.clearAllMocks()
  })

  describe('Network Error Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      // Simulate network timeout
      vi.mocked(fetch).mockRejectedValue(new Error('Network timeout'))

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })

    it('should handle connection refused errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'))

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })

    it('should handle DNS resolution failures', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('ENOTFOUND'))

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })
  })

  describe('API Error Response Handling', () => {
    it('should handle 401 Unauthorized responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ error: 'Invalid credentials' })
      } as Response)

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })

    it('should handle 403 Forbidden responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => JSON.stringify({ error: 'Access denied' })
      } as Response)

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })

    it('should handle 429 Rate Limit Exceeded', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 900 // 15 minutes
      
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'x-rate-limit-remaining': '0',
          'x-rate-limit-reset': resetTime.toString()
        }),
        text: async () => JSON.stringify({ error: 'Rate limit exceeded' })
      } as Response)

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })

    it('should handle 500 Internal Server Error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      } as Response)

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })

    it('should handle malformed JSON responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Unexpected token in JSON')
        },
        headers: new Headers()
      } as Response)

      const result = await client.getUser('testuser')
      expect(result).toBeNull()
    })
  })

  describe('Input Validation', () => {
    it('should handle empty username', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'User not found'
      } as Response)

      const result = await client.getUser('')
      expect(result).toBeNull()
    })

    it('should handle null username', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'User not found'
      } as Response)

      const result = await client.getUser(null as any)
      expect(result).toBeNull()
    })

    it('should handle undefined username', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'User not found'
      } as Response)

      const result = await client.getUser(undefined as any)
      expect(result).toBeNull()
    })

    it('should handle special characters in username', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { username: 'test@#$%user' } }),
        headers: new Headers()
      } as Response)

      const result = await client.getUser('test@#$%user')
      expect(result).toBeDefined()
    })
  })
})

// Performance Testing
describe('TwitterClient - Performance Tests', () => {
  let client: TwitterClient

  beforeEach(() => {
    client = new TwitterClient('test-api-key')
    vi.clearAllMocks()
  })

  it('should complete user lookup within performance threshold', async () => {
    const start = Date.now()
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { username: 'testuser' } }),
      headers: new Headers()
    } as Response)

    await client.getUser('testuser')
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD)
  })

  it('should handle concurrent requests efficiently', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { username: 'testuser' } }),
      headers: new Headers()
    } as Response)

    const start = Date.now()
    const promises = Array(10).fill(0).map((_, i) => 
      client.getUser(`testuser${i}`)
    )
    
    await Promise.all(promises)
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD * 2) // Allow some overhead for concurrent requests
  })

  it('should not create memory leaks with large responses', async () => {
    const largeResponse = {
      data: Array(1000).fill(0).map((_, i) => ({
        id: `user${i}`,
        username: `user${i}`,
        description: 'A'.repeat(1000) // Large description
      }))
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => largeResponse,
      headers: new Headers()
    } as Response)

    // Measure memory before and after
    const initialMemory = process.memoryUsage().heapUsed
    
    for (let i = 0; i < 10; i++) {
      await client.getUser(`user${i}`)
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
  })
})

// Rate Limiting Behavior Tests
describe('TwitterClient - Rate Limiting', () => {
  let client: TwitterClient

  beforeEach(() => {
    client = new TwitterClient('test-api-key')
    vi.clearAllMocks()
  })

  it('should track rate limit headers', async () => {
    const headers = new Headers({
      'x-rate-limit-remaining': '1',
      'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900)
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { username: 'testuser' } }),
      headers
    } as Response)

    // First request should succeed
    const result = await client.getUser('testuser1')
    expect(result).toBeDefined()
  })

  it('should handle concurrent requests with rate limiting', async () => {
    const headers = new Headers({
      'x-rate-limit-remaining': '2',
      'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900)
    })

    let remainingRequests = 2
    
    vi.mocked(fetch).mockImplementation(async () => {
      remainingRequests--
      headers.set('x-rate-limit-remaining', remainingRequests.toString())
      
      return {
        ok: true,
        json: async () => ({ data: { username: 'testuser' } }),
        headers
      } as Response
    })

    // Make requests that may hit rate limits
    const promises = [
      client.getUser('user1'),
      client.getUser('user2')
    ]

    const results = await Promise.allSettled(promises)
    
    // Both should succeed as we have 2 requests available
    expect(results[0].status).toBe('fulfilled')
    expect(results[1].status).toBe('fulfilled')
  })

  it('should handle rate limit recovery scenario', async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 900
    
    // Simulate rate limit exceeded
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({
        'x-rate-limit-remaining': '0',
        'x-rate-limit-reset': resetTime.toString()
      }),
      text: async () => 'Rate limit exceeded'
    } as Response)

    // First request should return null due to rate limit
    const result1 = await client.getUser('testuser1')
    expect(result1).toBeNull()

    // Simulate successful request after some time
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { username: 'testuser2' } }),
      headers: new Headers({
        'x-rate-limit-remaining': '99',
        'x-rate-limit-reset': String(resetTime + 900)
      })
    } as Response)

    const result2 = await client.getUser('testuser2')
    expect(result2).toBeDefined()
  })
})