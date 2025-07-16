import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwitterCompetitorAgent } from '../../../server/utils/langchain/agents/twitter/competitor'
import { TwitterContentAgent } from '../../../server/utils/langchain/agents/twitter/content'
import { TwitterTrendsAgent } from '../../../server/utils/langchain/agents/twitter/trends'

// Mock the LangChain client
vi.mock('../../../server/utils/langchain/client', () => ({
  LangChainClient: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        questions: []
      }),
      usage: {
        totalTokens: 100,
        promptTokens: 50,
        completionTokens: 50
      }
    })
  }))
}))

describe('Twitter LangChain Agents', () => {
  describe('TwitterCompetitorAgent', () => {
    let agent: TwitterCompetitorAgent

    beforeEach(() => {
      agent = new TwitterCompetitorAgent()
    })

    it('should have correct name and description', () => {
      expect(agent.getName()).toBe('TwitterCompetitorAgent')
      expect(agent.getDescription()).toBe('Analyzes Twitter competitor strategies and generates actionable insights')
    })

    it('should process competitor data', async () => {
      const mockInput = {
        username: 'testuser',
        tweets: [{
          id: '1',
          text: 'Test tweet',
          created_at: new Date().toISOString(),
          author_id: 'user1',
          public_metrics: {
            like_count: 10,
            retweet_count: 2,
            reply_count: 1,
            quote_count: 0
          }
        }],
        userInfo: {
          followers_count: 1000,
          following_count: 100,
          tweet_count: 500,
          description: 'Test user'
        }
      }

      // Mock the callLLM method
      vi.spyOn(agent as any, 'callLLM').mockResolvedValue(JSON.stringify({
        user: {
          username: 'testuser',
          followers_count: 1000
        },
        metrics: {
          engagement_rate: 2.5,
          avg_likes: 10
        },
        content_themes: ['testing'],
        posting_patterns: {
          best_times: ['10:00'],
          frequency_by_day: {},
          consistency_score: 80
        },
        engagement_insights: {
          high_engagement_topics: [],
          viral_factors: [],
          audience_interaction_style: 'casual'
        }
      }))

      const result = await agent.process(mockInput)
      
      expect(result).toBeDefined()
      expect(result.analysis).toBeDefined()
      expect(result.analysis.user.username).toBe('testuser')
      expect(result.cost).toBeGreaterThan(0)
    })
  })

  describe('TwitterContentAgent', () => {
    let agent: TwitterContentAgent

    beforeEach(() => {
      agent = new TwitterContentAgent()
    })

    it('should have correct name and description', () => {
      expect(agent.getName()).toBe('TwitterContentAgent')
      expect(agent.getDescription()).toBe('Generates content strategy recommendations and identifies opportunities based on competitor analysis')
    })
  })

  describe('TwitterTrendsAgent', () => {
    let agent: TwitterTrendsAgent

    beforeEach(() => {
      agent = new TwitterTrendsAgent()
    })

    it('should have correct name and description', () => {
      expect(agent.getName()).toBe('TwitterTrendsAgent')
      expect(agent.getDescription()).toBe('Detects and analyzes trends from competitor Twitter data to identify opportunities')
    })
  })
})