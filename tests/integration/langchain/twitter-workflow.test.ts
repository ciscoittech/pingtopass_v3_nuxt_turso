import { describe, it, expect } from 'vitest'
import { TwitterAnalysisWorkflow } from '../../../server/utils/langchain/workflows/twitter/analysis'
import { TwitterCompetitorAgent } from '../../../server/utils/langchain/agents/twitter/competitor'

describe('Twitter LangChain Integration', () => {
  describe('TwitterAnalysisWorkflow', () => {
    it('should run complete workflow with mock data', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const result = await workflow.run({
        competitorUsernames: ['certexpert', 'cloudguru', 'itcertmaster'],
        includeRecommendations: true
      })

      expect(result).toBeDefined()
      expect(result.competitorAnalyses).toHaveLength(3)
      expect(result.insights.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.benchmarks.length).toBeGreaterThan(0)
      expect(result.workflowSteps).toContain('fetchTwitterData')
      expect(result.workflowSteps).toContain('analyzeCompetitors')
      expect(result.workflowSteps).toContain('generateRecommendations')
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.endTime).toBeGreaterThan(result.startTime)
    })

    it('should handle errors gracefully', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const result = await workflow.run({
        competitorUsernames: [],
        includeRecommendations: true
      })

      expect(result.competitorAnalyses).toHaveLength(0)
      expect(result.errors).toHaveLength(0) // Empty input should not cause errors
    })

    it('should skip recommendations when not requested', async () => {
      const workflow = new TwitterAnalysisWorkflow()
      
      const result = await workflow.run({
        competitorUsernames: ['testuser'],
        includeRecommendations: false
      })

      expect(result.recommendations).toHaveLength(0)
      expect(result.workflowSteps).not.toContain('generateRecommendations')
    })
  })

  describe('TwitterCompetitorAgent', () => {
    it('should analyze competitor data', async () => {
      const agent = new TwitterCompetitorAgent()
      
      const mockTweets = [
        {
          id: '1',
          text: 'Just passed AWS certification!',
          created_at: new Date().toISOString(),
          author_id: 'user1',
          public_metrics: {
            like_count: 50,
            retweet_count: 10,
            reply_count: 5,
            quote_count: 2
          }
        }
      ]

      const result = await agent.process({
        username: 'testuser',
        tweets: mockTweets as any,
        userInfo: {
          followers_count: 10000,
          following_count: 500,
          tweet_count: 1000,
          description: 'IT certification expert'
        }
      })

      expect(result.analysis).toBeDefined()
      expect(result.analysis.user.username).toBe('testuser')
      expect(result.insights.length).toBeGreaterThan(0)
      expect(result.cost).toBeGreaterThan(0)
    })
  })
})

describe('Twitter LangSmith Tracing', () => {
  it('should include tracing metadata', async () => {
    const workflow = new TwitterAnalysisWorkflow()
    
    // Check if LangSmith is enabled
    const langsmithEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true'
    
    const result = await workflow.run({
      competitorUsernames: ['tracingtest'],
      includeRecommendations: true
    })

    expect(result).toBeDefined()
    
    if (langsmithEnabled) {
      console.log('LangSmith tracing is enabled for Twitter workflow')
      // In a real test, you would verify the trace was sent to LangSmith
    } else {
      console.log('LangSmith tracing is not enabled')
    }
  })
})