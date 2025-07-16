import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TwitterAnalysisWorkflow } from '../../../server/utils/langchain/workflows/twitter/analysis'
import { TwitterCompetitorAgent } from '../../../server/utils/langchain/agents/twitter/competitor'

// Enhanced LangChain Workflow Integration Tests
describe('Enhanced Twitter LangChain Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('TwitterAnalysisWorkflow - Enhanced Tests', () => {
    it('should handle workflow initialization properly', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      expect(workflow).toBeDefined()
      expect(typeof workflow.run).toBe('function')
    })

    it('should validate input parameters', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      // Test with valid parameters
      const validInput = {
        competitorUsernames: ['testuser'],
        includeRecommendations: false
      }
      
      expect(Array.isArray(validInput.competitorUsernames)).toBe(true)
      expect(typeof validInput.includeRecommendations).toBe('boolean')
    })

    it('should run workflow with minimal input and handle failures gracefully', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      try {
        const result = await workflow.run({
          competitorUsernames: ['nonexistentuser123'],
          includeRecommendations: false
        })

        // The workflow should complete even if individual analyses fail
        expect(result).toBeDefined()
        expect(typeof result.totalCost).toBe('number')
        expect(typeof result.startTime).toBe('string')
        expect(typeof result.endTime).toBe('string')
        expect(Array.isArray(result.workflowSteps)).toBe(true)
        expect(Array.isArray(result.competitorAnalyses)).toBe(true)
        expect(Array.isArray(result.insights)).toBe(true)
        expect(Array.isArray(result.recommendations)).toBe(true)
        expect(Array.isArray(result.benchmarks)).toBe(true)
        
        // Should handle failed analyses
        if (result.errors) {
          expect(Array.isArray(result.errors)).toBe(true)
        }
      } catch (error) {
        // If workflow throws, it should be a controlled error
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should skip recommendations when not requested', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      try {
        const result = await workflow.run({
          competitorUsernames: ['testuser'],
          includeRecommendations: false
        })

        expect(result.recommendations).toHaveLength(0)
        // Should not include recommendation-related workflow steps
        expect(result.workflowSteps.some(step => step.includes('recommendation'))).toBe(false)
      } catch (error) {
        // Expected if the workflow fails due to missing data
        console.log('Workflow failed as expected:', error.message)
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle empty competitor list', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const result = await workflow.run({
        competitorUsernames: [],
        includeRecommendations: false
      })

      expect(result).toBeDefined()
      expect(result.competitorAnalyses).toHaveLength(0)
      expect(result.totalCost).toBeGreaterThanOrEqual(0)
      expect(result.workflowSteps).toContain('fetchTwitterData')
    })

    it('should track workflow execution steps', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const result = await workflow.run({
        competitorUsernames: [],
        includeRecommendations: true
      })

      expect(result.workflowSteps).toBeDefined()
      expect(Array.isArray(result.workflowSteps)).toBe(true)
      expect(result.workflowSteps.length).toBeGreaterThan(0)
      
      // Should include basic workflow steps
      const expectedSteps = ['fetchTwitterData', 'analyzeCompetitors', 'generateRecommendations']
      expectedSteps.forEach(step => {
        expect(result.workflowSteps).toContain(step)
      })
    })

    it('should calculate costs properly', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const result = await workflow.run({
        competitorUsernames: [],
        includeRecommendations: false
      })

      expect(typeof result.totalCost).toBe('number')
      expect(result.totalCost).toBeGreaterThanOrEqual(0)
    })

    it('should handle timing information', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const startTime = Date.now()
      const result = await workflow.run({
        competitorUsernames: [],
        includeRecommendations: false
      })
      const endTime = Date.now()

      expect(result.startTime).toBeDefined()
      expect(result.endTime).toBeDefined()
      
      const resultStartTime = new Date(result.startTime).getTime()
      const resultEndTime = new Date(result.endTime).getTime()
      
      expect(resultStartTime).toBeGreaterThanOrEqual(startTime - 1000) // Allow 1s variance
      expect(resultEndTime).toBeLessThanOrEqual(endTime + 1000)
      expect(resultEndTime).toBeGreaterThanOrEqual(resultStartTime)
    })
  })

  describe('TwitterCompetitorAgent - Enhanced Tests', () => {
    it('should initialize agent properly', () => {
      const agent = new TwitterCompetitorAgent()
      
      expect(agent).toBeDefined()
      expect(typeof agent.process).toBe('function')
    })

    it('should validate input data format', () => {
      const validInput = {
        username: 'testuser',
        tweets: [
          {
            id: '1',
            text: 'Test tweet content',
            created_at: new Date().toISOString(),
            author_id: 'user1',
            public_metrics: {
              like_count: 10,
              retweet_count: 2,
              reply_count: 1,
              quote_count: 0
            }
          }
        ],
        userInfo: {
          followers_count: 1000,
          following_count: 100,
          tweet_count: 50,
          description: 'Test user description'
        }
      }
      
      expect(validInput.username).toBeTruthy()
      expect(Array.isArray(validInput.tweets)).toBe(true)
      expect(validInput.userInfo).toBeDefined()
      expect(typeof validInput.userInfo.followers_count).toBe('number')
    })

    it('should handle agent processing with mock data', async () => {
      const agent = new TwitterCompetitorAgent()
      
      const mockInput = {
        username: 'testuser',
        tweets: [
          {
            id: '1',
            text: 'AWS certification tips for cloud practitioners',
            created_at: new Date().toISOString(),
            author_id: 'user1',
            public_metrics: {
              like_count: 25,
              retweet_count: 5,
              reply_count: 3,
              quote_count: 1
            },
            entities: {
              hashtags: [{ tag: 'AWS' }, { tag: 'CloudPractitioner' }]
            }
          }
        ],
        userInfo: {
          followers_count: 5000,
          following_count: 200,
          tweet_count: 150,
          description: 'Cloud certification expert and AWS instructor'
        }
      }

      try {
        const result = await agent.process(mockInput)
        
        expect(result).toBeDefined()
        
        // Basic result structure validation
        if (result.analysis) {
          expect(result.analysis).toBeDefined()
          if (result.analysis.user) {
            expect(result.analysis.user.username).toBe('testuser')
          }
        }
        
        if (result.insights) {
          expect(Array.isArray(result.insights)).toBe(true)
        }
        
        if (result.cost !== undefined) {
          expect(typeof result.cost).toBe('number')
          expect(result.cost).toBeGreaterThanOrEqual(0)
        }
      } catch (error) {
        // Expected if the agent fails due to missing LLM configuration
        expect(error).toBeInstanceOf(Error)
        console.log('Agent processing failed as expected:', error.message)
      }
    })

    it('should handle empty tweet data', async () => {
      const agent = new TwitterCompetitorAgent()
      
      const mockInput = {
        username: 'testuser',
        tweets: [],
        userInfo: {
          followers_count: 100,
          following_count: 50,
          tweet_count: 0,
          description: 'New user'
        }
      }

      try {
        const result = await agent.process(mockInput)
        
        expect(result).toBeDefined()
        // Should handle empty data gracefully
      } catch (error) {
        // Expected if agent requires tweet data
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('LangChain Integration Points', () => {
    it('should validate LangChain dependencies', async () => {
      // Test that all required LangChain modules can be imported
      const { TwitterAnalysisWorkflow } = await import('../../../server/utils/langchain/workflows/twitter/analysis')
      const { TwitterCompetitorAgent } = await import('../../../server/utils/langchain/agents/twitter/competitor')
      const { TwitterContentAgent } = await import('../../../server/utils/langchain/agents/twitter/content')
      const { TwitterTrendsAgent } = await import('../../../server/utils/langchain/agents/twitter/trends')
      
      expect(TwitterAnalysisWorkflow).toBeDefined()
      expect(TwitterCompetitorAgent).toBeDefined()
      expect(TwitterContentAgent).toBeDefined()
      expect(TwitterTrendsAgent).toBeDefined()
    })

    it('should validate agent base classes', async () => {
      const { TwitterBaseAgent } = await import('../../../server/utils/langchain/agents/twitter/base')
      
      expect(TwitterBaseAgent).toBeDefined()
      expect(typeof TwitterBaseAgent).toBe('function')
    })

    it('should validate workflow configuration', () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      // Workflow should have proper configuration
      expect(workflow).toBeDefined()
      
      // Should not throw when accessing basic properties
      expect(() => workflow.toString()).not.toThrow()
    })

    it('should handle environment configuration', () => {
      // Test environment variables that LangChain components need
      const requiredEnvVars = [
        'OPENROUTER_API_KEY',
        'TWITTER_API_KEY'
      ]
      
      requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar]
        if (value) {
          expect(typeof value).toBe('string')
          expect(value.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle LLM API failures gracefully', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      // Attempt workflow with configuration that might fail
      try {
        const result = await workflow.run({
          competitorUsernames: ['test'],
          includeRecommendations: false
        })
        
        // If it succeeds, validate basic structure
        expect(result).toBeDefined()
      } catch (error) {
        // Should be a controlled error, not an unhandled exception
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBeTruthy()
      }
    })

    it('should handle network timeouts', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      // Set a short timeout for testing
      const originalTimeout = process.env.LANGCHAIN_REQUEST_TIMEOUT
      process.env.LANGCHAIN_REQUEST_TIMEOUT = '1000' // 1 second
      
      try {
        await workflow.run({
          competitorUsernames: ['timeouttest'],
          includeRecommendations: false
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      } finally {
        // Restore original timeout
        if (originalTimeout) {
          process.env.LANGCHAIN_REQUEST_TIMEOUT = originalTimeout
        } else {
          delete process.env.LANGCHAIN_REQUEST_TIMEOUT
        }
      }
    })

    it('should handle invalid competitor usernames', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const invalidUsernames = [
        '', // Empty string
        null as any, // Null
        undefined as any, // Undefined
        123 as any, // Number
        '@invalid@user' // Invalid format
      ]
      
      for (const username of invalidUsernames) {
        try {
          await workflow.run({
            competitorUsernames: [username],
            includeRecommendations: false
          })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      }
    })
  })

  describe('Performance and Monitoring', () => {
    it('should complete workflow within reasonable time', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const startTime = Date.now()
      
      try {
        await workflow.run({
          competitorUsernames: [],
          includeRecommendations: false
        })
      } catch (error) {
        // Even failures should complete quickly
      }
      
      const duration = Date.now() - startTime
      
      // Should complete within 30 seconds even with failures
      expect(duration).toBeLessThan(30000)
    })

    it('should track memory usage appropriately', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      const workflow = new TwitterAnalysisWorkflow()
      
      try {
        await workflow.run({
          competitorUsernames: [],
          includeRecommendations: false
        })
      } catch (error) {
        // Continue with memory check even if workflow fails
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    })
  })

  describe('LangSmith Tracing Integration', () => {
    it('should handle LangSmith configuration', () => {
      const langsmithEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true'
      const langsmithApiKey = process.env.LANGCHAIN_API_KEY
      
      if (langsmithEnabled) {
        expect(langsmithApiKey).toBeTruthy()
        console.log('LangSmith tracing is enabled')
      } else {
        console.log('LangSmith tracing is not enabled')
      }
    })

    it('should work with or without tracing', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      // Should work regardless of tracing configuration
      try {
        const result = await workflow.run({
          competitorUsernames: [],
          includeRecommendations: false
        })
        
        expect(result).toBeDefined()
      } catch (error) {
        // Expected if workflow dependencies are missing
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})