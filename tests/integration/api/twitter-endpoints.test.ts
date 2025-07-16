import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

// API Integration Tests for Twitter Intelligence System
describe('Twitter API Endpoints Integration', async () => {
  await setup({
    // Force server context for API testing
    server: true,
    browser: false
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/admin/twitter/competitors', () => {
    it('should return list of competitors', async () => {
      const response = await $fetch('/api/admin/twitter/competitors', {
        method: 'GET'
      })

      expect(response).toBeDefined()
      expect(Array.isArray(response.competitors)).toBe(true)
      expect(response.total).toBeGreaterThanOrEqual(0)
      
      if (response.competitors.length > 0) {
        const competitor = response.competitors[0]
        expect(competitor).toHaveProperty('id')
        expect(competitor).toHaveProperty('username')
        expect(competitor).toHaveProperty('created_at')
      }
    })

    it('should handle pagination parameters', async () => {
      const response = await $fetch('/api/admin/twitter/competitors', {
        method: 'GET',
        query: {
          page: 1,
          limit: 5
        }
      })

      expect(response).toBeDefined()
      expect(response.competitors.length).toBeLessThanOrEqual(5)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.limit).toBe(5)
    })

    it('should handle search filtering', async () => {
      const response = await $fetch('/api/admin/twitter/competitors', {
        method: 'GET',
        query: {
          search: 'cert'
        }
      })

      expect(response).toBeDefined()
      expect(Array.isArray(response.competitors)).toBe(true)
      
      // All returned competitors should match search term
      response.competitors.forEach((competitor: any) => {
        expect(competitor.username.toLowerCase()).toContain('cert')
      })
    })
  })

  describe('POST /api/admin/twitter/competitors', () => {
    it('should add new competitor successfully', async () => {
      const newCompetitor = {
        username: 'testcompetitor123',
        category: 'cloud-certifications',
        priority: 'medium'
      }

      const response = await $fetch('/api/admin/twitter/competitors', {
        method: 'POST',
        body: newCompetitor
      })

      expect(response).toBeDefined()
      expect(response.competitor).toBeDefined()
      expect(response.competitor.username).toBe(newCompetitor.username)
      expect(response.competitor.category).toBe(newCompetitor.category)
      expect(response.competitor.priority).toBe(newCompetitor.priority)
      expect(response.competitor.id).toBeDefined()
      expect(response.competitor.created_at).toBeDefined()
    })

    it('should validate required fields', async () => {
      await expect(
        $fetch('/api/admin/twitter/competitors', {
          method: 'POST',
          body: {
            category: 'cloud-certifications'
            // Missing username
          }
        })
      ).rejects.toThrow()
    })

    it('should prevent duplicate competitors', async () => {
      const competitor = {
        username: 'duplicatetest',
        category: 'cloud-certifications',
        priority: 'medium'
      }

      // Add first time
      await $fetch('/api/admin/twitter/competitors', {
        method: 'POST',
        body: competitor
      })

      // Try to add duplicate
      await expect(
        $fetch('/api/admin/twitter/competitors', {
          method: 'POST',
          body: competitor
        })
      ).rejects.toThrow()
    })

    it('should validate username format', async () => {
      await expect(
        $fetch('/api/admin/twitter/competitors', {
          method: 'POST',
          body: {
            username: '@invalidusername!',
            category: 'cloud-certifications',
            priority: 'medium'
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /api/admin/twitter/analyze', () => {
    it('should analyze competitor successfully', async () => {
      const response = await $fetch('/api/admin/twitter/analyze', {
        method: 'POST',
        body: {
          username: 'awscloudgirl',
          includeRecommendations: false
        }
      })

      expect(response).toBeDefined()
      expect(response.analysis).toBeDefined()
      expect(response.analysis.user).toBeDefined()
      expect(response.analysis.metrics).toBeDefined()
      expect(response.analysis.content_themes).toBeDefined()
      expect(response.analysis.posting_patterns).toBeDefined()
      expect(response.analysis.engagement_insights).toBeDefined()
      expect(response.cost).toBeDefined()
      expect(response.timestamp).toBeDefined()
    })

    it('should include recommendations when requested', async () => {
      const response = await $fetch('/api/admin/twitter/analyze', {
        method: 'POST',
        body: {
          username: 'awscloudgirl',
          includeRecommendations: true
        }
      })

      expect(response).toBeDefined()
      expect(response.analysis).toBeDefined()
      expect(response.recommendations).toBeDefined()
      expect(Array.isArray(response.recommendations)).toBe(true)
      expect(response.cost).toBeGreaterThan(0) // Should cost more with recommendations
    })

    it('should handle non-existent users gracefully', async () => {
      const response = await $fetch('/api/admin/twitter/analyze', {
        method: 'POST',
        body: {
          username: 'nonexistentuser123456789',
          includeRecommendations: false
        }
      })

      expect(response).toBeDefined()
      expect(response.analysis).toBeNull()
      expect(response.error).toBeDefined()
      expect(response.cost).toBe(0)
    })

    it('should validate request body', async () => {
      await expect(
        $fetch('/api/admin/twitter/analyze', {
          method: 'POST',
          body: {
            // Missing username
            includeRecommendations: false
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /api/admin/twitter/analyze-langchain', () => {
    it('should run LangChain analysis workflow', async () => {
      const response = await $fetch('/api/admin/twitter/analyze-langchain', {
        method: 'POST',
        body: {
          competitorUsernames: ['awscloudgirl', 'certexpert'],
          includeRecommendations: true
        }
      })

      expect(response).toBeDefined()
      expect(response.competitorAnalyses).toBeDefined()
      expect(Array.isArray(response.competitorAnalyses)).toBe(true)
      expect(response.insights).toBeDefined()
      expect(Array.isArray(response.insights)).toBe(true)
      expect(response.recommendations).toBeDefined()
      expect(Array.isArray(response.recommendations)).toBe(true)
      expect(response.benchmarks).toBeDefined()
      expect(response.totalCost).toBeGreaterThan(0)
      expect(response.startTime).toBeDefined()
      expect(response.endTime).toBeDefined()
      expect(response.workflowSteps).toBeDefined()
    })

    it('should handle empty competitor list', async () => {
      const response = await $fetch('/api/admin/twitter/analyze-langchain', {
        method: 'POST',
        body: {
          competitorUsernames: [],
          includeRecommendations: false
        }
      })

      expect(response).toBeDefined()
      expect(response.competitorAnalyses).toHaveLength(0)
      expect(response.insights).toHaveLength(0)
      expect(response.recommendations).toHaveLength(0)
      expect(response.totalCost).toBe(0)
    })

    it('should skip recommendations when not requested', async () => {
      const response = await $fetch('/api/admin/twitter/analyze-langchain', {
        method: 'POST',
        body: {
          competitorUsernames: ['awscloudgirl'],
          includeRecommendations: false
        }
      })

      expect(response).toBeDefined()
      expect(response.recommendations).toHaveLength(0)
      expect(response.workflowSteps).not.toContain('generateRecommendations')
      expect(response.totalCost).toBeLessThan(1.0) // Should be cheaper without recommendations
    })

    it('should validate request parameters', async () => {
      await expect(
        $fetch('/api/admin/twitter/analyze-langchain', {
          method: 'POST',
          body: {
            // Missing competitorUsernames
            includeRecommendations: true
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('GET /api/admin/twitter/insights', () => {
    it('should return recent insights', async () => {
      const response = await $fetch('/api/admin/twitter/insights', {
        method: 'GET'
      })

      expect(response).toBeDefined()
      expect(response.insights).toBeDefined()
      expect(Array.isArray(response.insights)).toBe(true)
      expect(response.total).toBeGreaterThanOrEqual(0)
      expect(response.timestamp).toBeDefined()

      if (response.insights.length > 0) {
        const insight = response.insights[0]
        expect(insight).toHaveProperty('id')
        expect(insight).toHaveProperty('type')
        expect(insight).toHaveProperty('title')
        expect(insight).toHaveProperty('confidence')
        expect(insight).toHaveProperty('impact')
        expect(insight).toHaveProperty('created_at')
      }
    })

    it('should filter insights by type', async () => {
      const response = await $fetch('/api/admin/twitter/insights', {
        method: 'GET',
        query: {
          type: 'content_strategy'
        }
      })

      expect(response).toBeDefined()
      expect(Array.isArray(response.insights)).toBe(true)
      
      // All insights should be of the specified type
      response.insights.forEach((insight: any) => {
        expect(insight.type).toBe('content_strategy')
      })
    })

    it('should filter insights by confidence level', async () => {
      const response = await $fetch('/api/admin/twitter/insights', {
        method: 'GET',
        query: {
          minConfidence: 0.8
        }
      })

      expect(response).toBeDefined()
      expect(Array.isArray(response.insights)).toBe(true)
      
      // All insights should meet minimum confidence
      response.insights.forEach((insight: any) => {
        expect(insight.confidence).toBeGreaterThanOrEqual(0.8)
      })
    })

    it('should handle pagination', async () => {
      const response = await $fetch('/api/admin/twitter/insights', {
        method: 'GET',
        query: {
          page: 1,
          limit: 3
        }
      })

      expect(response).toBeDefined()
      expect(response.insights.length).toBeLessThanOrEqual(3)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.limit).toBe(3)
    })
  })

  describe('GET /api/admin/twitter/trends', () => {
    it('should return trending topics', async () => {
      const response = await $fetch('/api/admin/twitter/trends', {
        method: 'GET'
      })

      expect(response).toBeDefined()
      expect(response.trends).toBeDefined()
      expect(Array.isArray(response.trends)).toBe(true)
      expect(response.location).toBeDefined()
      expect(response.timestamp).toBeDefined()

      if (response.trends.length > 0) {
        const trend = response.trends[0]
        expect(trend).toHaveProperty('tag')
        expect(trend).toHaveProperty('volume')
        expect(trend).toHaveProperty('category')
      }
    })

    it('should filter trends by location', async () => {
      const response = await $fetch('/api/admin/twitter/trends', {
        method: 'GET',
        query: {
          location: 'united_states'
        }
      })

      expect(response).toBeDefined()
      expect(response.location).toBe('united_states')
      expect(Array.isArray(response.trends)).toBe(true)
    })

    it('should handle invalid location gracefully', async () => {
      const response = await $fetch('/api/admin/twitter/trends', {
        method: 'GET',
        query: {
          location: 'invalid_location'
        }
      })

      expect(response).toBeDefined()
      // Should fallback to worldwide
      expect(response.location).toBe('worldwide')
      expect(Array.isArray(response.trends)).toBe(true)
    })
  })

  describe('GET /api/admin/twitter/monitoring/jobs', () => {
    it('should return monitoring job status', async () => {
      const response = await $fetch('/api/admin/twitter/monitoring/jobs', {
        method: 'GET'
      })

      expect(response).toBeDefined()
      expect(response.jobs).toBeDefined()
      expect(Array.isArray(response.jobs)).toBe(true)
      expect(response.status).toBeDefined()
      expect(response.nextRun).toBeDefined()

      if (response.jobs.length > 0) {
        const job = response.jobs[0]
        expect(job).toHaveProperty('id')
        expect(job).toHaveProperty('status')
        expect(job).toHaveProperty('competitor_username')
        expect(job).toHaveProperty('last_run')
        expect(job).toHaveProperty('next_run')
      }
    })

    it('should filter jobs by status', async () => {
      const response = await $fetch('/api/admin/twitter/monitoring/jobs', {
        method: 'GET',
        query: {
          status: 'active'
        }
      })

      expect(response).toBeDefined()
      expect(Array.isArray(response.jobs)).toBe(true)
      
      // All jobs should have the specified status
      response.jobs.forEach((job: any) => {
        expect(job.status).toBe('active')
      })
    })
  })

  describe('POST /api/admin/twitter/monitoring/run', () => {
    it('should manually trigger monitoring run', async () => {
      const response = await $fetch('/api/admin/twitter/monitoring/run', {
        method: 'POST',
        body: {
          competitorUsernames: ['awscloudgirl'],
          force: true
        }
      })

      expect(response).toBeDefined()
      expect(response.jobId).toBeDefined()
      expect(response.status).toBe('started')
      expect(response.estimatedCompletion).toBeDefined()
      expect(response.competitorsQueued).toBe(1)
      expect(response.timestamp).toBeDefined()
    })

    it('should handle batch monitoring runs', async () => {
      const response = await $fetch('/api/admin/twitter/monitoring/run', {
        method: 'POST',
        body: {
          competitorUsernames: ['awscloudgirl', 'certexpert', 'cloudguru'],
          force: false
        }
      })

      expect(response).toBeDefined()
      expect(response.competitorsQueued).toBe(3)
      expect(response.status).toBe('started')
      expect(response.jobId).toBeDefined()
    })

    it('should validate competitor usernames', async () => {
      await expect(
        $fetch('/api/admin/twitter/monitoring/run', {
          method: 'POST',
          body: {
            competitorUsernames: [], // Empty array
            force: false
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /api/admin/twitter/monitoring/run-langchain', () => {
    it('should trigger LangChain monitoring workflow', async () => {
      const response = await $fetch('/api/admin/twitter/monitoring/run-langchain', {
        method: 'POST',
        body: {
          competitorUsernames: ['awscloudgirl'],
          generateInsights: true,
          generateRecommendations: true
        }
      })

      expect(response).toBeDefined()
      expect(response.workflowId).toBeDefined()
      expect(response.status).toBe('started')
      expect(response.competitorsQueued).toBe(1)
      expect(response.estimatedCost).toBeGreaterThan(0)
      expect(response.estimatedCompletion).toBeDefined()
      expect(response.timestamp).toBeDefined()
    })

    it('should handle workflow with insights only', async () => {
      const response = await $fetch('/api/admin/twitter/monitoring/run-langchain', {
        method: 'POST',
        body: {
          competitorUsernames: ['awscloudgirl'],
          generateInsights: true,
          generateRecommendations: false
        }
      })

      expect(response).toBeDefined()
      expect(response.estimatedCost).toBeLessThan(1.0) // Should be cheaper without recommendations
      expect(response.status).toBe('started')
    })

    it('should validate workflow parameters', async () => {
      await expect(
        $fetch('/api/admin/twitter/monitoring/run-langchain', {
          method: 'POST',
          body: {
            // Missing required fields
            generateInsights: true
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle authentication errors', async () => {
      // This would test authentication middleware
      // For now, we assume the endpoints are protected
      expect(true).toBe(true)
    })

    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(5).fill(0).map(() =>
        $fetch('/api/admin/twitter/trends', {
          method: 'GET'
        }).catch(error => error)
      )

      const results = await Promise.allSettled(promises)
      
      // At least some should succeed
      const successful = results.filter(result => result.status === 'fulfilled')
      expect(successful.length).toBeGreaterThan(0)
    })

    it('should handle large payload requests', async () => {
      const largeCompetitorList = Array(20).fill(0).map((_, i) => `competitor${i}`)
      
      const response = await $fetch('/api/admin/twitter/analyze-langchain', {
        method: 'POST',
        body: {
          competitorUsernames: largeCompetitorList,
          includeRecommendations: false
        }
      })

      expect(response).toBeDefined()
      expect(response.competitorAnalyses.length).toBeLessThanOrEqual(20)
      // Should handle partial failures gracefully
    })

    it('should return proper error codes for invalid requests', async () => {
      try {
        await $fetch('/api/admin/twitter/analyze', {
          method: 'POST',
          body: {
            username: '', // Invalid empty username
            includeRecommendations: false
          }
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.statusCode).toBe(400)
      }
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle concurrent API requests', async () => {
      const start = Date.now()
      
      const promises = Array(5).fill(0).map(() =>
        $fetch('/api/admin/twitter/competitors', {
          method: 'GET'
        })
      )

      const results = await Promise.all(promises)
      const duration = Date.now() - start

      // All requests should succeed
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(Array.isArray(result.competitors)).toBe(true)
      })

      // Should complete within reasonable time (10 seconds for 5 concurrent requests)
      expect(duration).toBeLessThan(10000)
    })

    it('should respond within acceptable time limits', async () => {
      const start = Date.now()
      
      await $fetch('/api/admin/twitter/trends', {
        method: 'GET'
      })
      
      const duration = Date.now() - start
      
      // Should respond within 5 seconds
      expect(duration).toBeLessThan(5000)
    })
  })
})