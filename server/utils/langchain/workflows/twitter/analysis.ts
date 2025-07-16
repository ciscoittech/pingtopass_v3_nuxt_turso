import { StateGraph, END } from '@langchain/langgraph'
import { TwitterWorkflowState } from './state'
import { TwitterCompetitorAgent } from '../../agents/twitter/competitor'
import { TwitterContentAgent } from '../../agents/twitter/content'
import { TwitterTrendsAgent } from '../../agents/twitter/trends'
import { TwitterClient } from '../../../twitterClient'
import { nanoid } from 'nanoid'
import type { CompetitorInsight, StrategyRecommendation, Benchmark } from '../../agents/twitter/types'
import { RunnableConfig } from '@langchain/core/runnables'

export class TwitterAnalysisWorkflow {
  private graph: StateGraph<TwitterWorkflowState>
  private competitorAgent: TwitterCompetitorAgent
  private contentAgent: TwitterContentAgent
  private trendsAgent: TwitterTrendsAgent
  private twitterClient: TwitterClient | null = null
  private maxRetries: number = 2

  constructor(twitterApiKey?: string) {
    // Initialize agents
    this.competitorAgent = new TwitterCompetitorAgent()
    this.contentAgent = new TwitterContentAgent()
    this.trendsAgent = new TwitterTrendsAgent()
    
    // Initialize Twitter client if API key provided
    if (twitterApiKey) {
      this.twitterClient = new TwitterClient(twitterApiKey)
    }
    
    // Build the workflow graph
    this.graph = this.buildGraph()
  }

  private buildGraph(): StateGraph<TwitterWorkflowState> {
    const workflow = new StateGraph<TwitterWorkflowState>({
      channels: {
        competitorUsernames: {
          value: (x: string[], y?: string[]) => y ?? x ?? []
        },
        includeRecommendations: {
          value: (x: boolean, y?: boolean) => y ?? x ?? true
        },
        twitterData: {
          value: (x: Map<string, any>, y?: Map<string, any>) => y ?? x ?? new Map()
        },
        competitorAnalyses: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        insights: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        recommendations: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        benchmarks: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        opportunities: {
          value: (x: any, y?: any) => y ?? x ?? null
        },
        trendReport: {
          value: (x: any, y?: any) => y ?? x ?? null
        },
        alerts: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        predictions: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        totalCost: {
          value: (x: number, y?: number) => (x ?? 0) + (y ?? 0)
        },
        errors: {
          value: (x: string[], y?: string[]) => [...(x ?? []), ...(y ?? [])]
        },
        retries: {
          value: (x: number, y?: number) => y ?? x ?? 0
        },
        workflowSteps: {
          value: (x: string[], y?: string[]) => [...(x ?? []), ...(y ?? [])]
        },
        startTime: {
          value: (x: number, y?: number) => y ?? x ?? Date.now()
        },
        endTime: {
          value: (x: number | null, y?: number | null) => y ?? x ?? null
        }
      }
    })

    // Add nodes
    workflow.addNode('fetchTwitterData', async (state) => await this.fetchTwitterDataNode(state))
    workflow.addNode('analyzeCompetitors', async (state) => await this.analyzeCompetitorsNode(state))
    workflow.addNode('generateInsights', async (state) => await this.generateInsightsNode(state))
    workflow.addNode('generateRecommendations', async (state) => await this.generateRecommendationsNode(state))
    workflow.addNode('analyzeTrends', async (state) => await this.analyzeTrendsNode(state))
    workflow.addNode('calculateBenchmarks', async (state) => await this.calculateBenchmarksNode(state))

    // Set entry point
    workflow.setEntryPoint('fetchTwitterData')

    // Add edges
    workflow.addEdge('fetchTwitterData', 'analyzeCompetitors')
    workflow.addEdge('analyzeCompetitors', 'generateInsights')
    
    // Conditional edge for recommendations
    workflow.addConditionalEdges(
      'generateInsights',
      (state) => state.includeRecommendations ? 'generateRecommendations' : 'analyzeTrends',
      {
        generateRecommendations: 'generateRecommendations',
        analyzeTrends: 'analyzeTrends'
      }
    )
    
    workflow.addEdge('generateRecommendations', 'analyzeTrends')
    workflow.addEdge('analyzeTrends', 'calculateBenchmarks')
    workflow.addEdge('calculateBenchmarks', END)

    return workflow
  }

  async run(input: {
    competitorUsernames: string[]
    includeRecommendations?: boolean
    twitterApiKey?: string
  }): Promise<TwitterWorkflowState> {
    // Initialize Twitter client if provided
    if (input.twitterApiKey && !this.twitterClient) {
      this.twitterClient = new TwitterClient(input.twitterApiKey)
    }

    const app = this.graph.compile()
    
    const initialState: TwitterWorkflowState = {
      competitorUsernames: input.competitorUsernames,
      includeRecommendations: input.includeRecommendations ?? true,
      twitterData: new Map(),
      competitorAnalyses: [],
      insights: [],
      recommendations: [],
      benchmarks: [],
      opportunities: null,
      trendReport: null,
      alerts: [],
      predictions: [],
      totalCost: 0,
      errors: [],
      retries: 0,
      workflowSteps: [],
      startTime: Date.now(),
      endTime: null
    }

    // Configure LangSmith tracing if enabled
    const config: RunnableConfig = {
      metadata: {
        workflow: 'twitter_analysis',
        competitors: input.competitorUsernames,
        includeRecommendations: input.includeRecommendations
      },
      tags: ['twitter', 'competitor-analysis', 'langchain'],
      callbacks: []
    }

    const finalState = await app.invoke(initialState, config)
    finalState.endTime = Date.now()
    
    return finalState
  }

  private async fetchTwitterDataNode(state: TwitterWorkflowState): Promise<Partial<TwitterWorkflowState>> {
    console.log('[TwitterWorkflow] Fetching Twitter data for:', state.competitorUsernames)
    
    if (!this.twitterClient) {
      // If no Twitter client, use mock data
      console.log('[TwitterWorkflow] No Twitter client, using mock data')
      const mockData = new Map<string, any>()
      
      state.competitorUsernames.forEach(username => {
        mockData.set(username, {
          user: {
            id: nanoid(),
            username,
            followers_count: Math.floor(Math.random() * 50000) + 5000,
            following_count: Math.floor(Math.random() * 5000) + 500,
            tweet_count: Math.floor(Math.random() * 10000) + 1000,
            description: `Mock user @${username} - IT certification expert`
          },
          tweets: this.generateMockTweets(username, 20)
        })
      })
      
      return {
        twitterData: mockData,
        workflowSteps: ['fetchTwitterData']
      }
    }

    const twitterData = new Map<string, any>()
    const errors: string[] = []

    for (const username of state.competitorUsernames) {
      try {
        const analysis = await this.twitterClient.analyzeCompetitor(username)
        if (analysis) {
          twitterData.set(username, {
            user: analysis.user,
            tweets: analysis.recent_tweets
          })
        }
      } catch (error: any) {
        errors.push(`Failed to fetch data for @${username}: ${error.message}`)
      }
    }

    return {
      twitterData,
      errors,
      workflowSteps: ['fetchTwitterData']
    }
  }

  private async analyzeCompetitorsNode(state: TwitterWorkflowState): Promise<Partial<TwitterWorkflowState>> {
    console.log('[TwitterWorkflow] Analyzing competitors')
    
    const analyses: any[] = []
    const insights: CompetitorInsight[] = []
    let totalCost = 0

    for (const [username, data] of state.twitterData) {
      try {
        const result = await this.competitorAgent.process({
          username,
          tweets: data.tweets,
          userInfo: {
            followers_count: data.user.followers_count,
            following_count: data.user.following_count,
            tweet_count: data.user.tweet_count,
            description: data.user.description
          }
        })

        analyses.push(result.analysis)
        insights.push(...result.insights)
        totalCost += result.cost
      } catch (error: any) {
        console.error(`[TwitterWorkflow] Failed to analyze @${username}:`, error)
      }
    }

    return {
      competitorAnalyses: analyses,
      insights,
      totalCost,
      workflowSteps: ['analyzeCompetitors']
    }
  }

  private async generateInsightsNode(state: TwitterWorkflowState): Promise<Partial<TwitterWorkflowState>> {
    console.log('[TwitterWorkflow] Generating additional insights')
    
    // Insights are already generated in the competitor analysis
    // This node can be used for additional insight processing or aggregation
    
    return {
      workflowSteps: ['generateInsights']
    }
  }

  private async generateRecommendationsNode(state: TwitterWorkflowState): Promise<Partial<TwitterWorkflowState>> {
    console.log('[TwitterWorkflow] Generating recommendations')
    
    try {
      const result = await this.contentAgent.process({
        competitorAnalyses: state.competitorAnalyses,
        currentPerformance: {
          followers: 1000, // Mock our current performance
          engagement_rate: 2.5,
          posting_frequency: 0.5
        }
      })

      return {
        recommendations: result.recommendations,
        opportunities: result.opportunities,
        totalCost: result.cost,
        workflowSteps: ['generateRecommendations']
      }
    } catch (error: any) {
      console.error('[TwitterWorkflow] Failed to generate recommendations:', error)
      return {
        errors: [`Recommendation generation failed: ${error.message}`],
        workflowSteps: ['generateRecommendations']
      }
    }
  }

  private async analyzeTrendsNode(state: TwitterWorkflowState): Promise<Partial<TwitterWorkflowState>> {
    console.log('[TwitterWorkflow] Analyzing trends')
    
    try {
      const result = await this.trendsAgent.process({
        competitorAnalyses: state.competitorAnalyses,
        industryContext: 'IT certification training and exam preparation'
      })

      return {
        trendReport: result.report,
        alerts: result.alerts,
        predictions: result.predictions,
        totalCost: result.cost,
        workflowSteps: ['analyzeTrends']
      }
    } catch (error: any) {
      console.error('[TwitterWorkflow] Failed to analyze trends:', error)
      return {
        errors: [`Trend analysis failed: ${error.message}`],
        workflowSteps: ['analyzeTrends']
      }
    }
  }

  private async calculateBenchmarksNode(state: TwitterWorkflowState): Promise<Partial<TwitterWorkflowState>> {
    console.log('[TwitterWorkflow] Calculating benchmarks')
    
    const benchmarks: Benchmark[] = this.calculateBenchmarks(state.competitorAnalyses)
    
    return {
      benchmarks,
      workflowSteps: ['calculateBenchmarks']
    }
  }

  private calculateBenchmarks(analyses: any[]): Benchmark[] {
    const metrics = [
      { key: 'followers_count', name: 'Followers' },
      { key: 'engagement_rate', name: 'Engagement Rate' },
      { key: 'avg_likes', name: 'Average Likes' },
      { key: 'posting_frequency', name: 'Posting Frequency' }
    ]

    return metrics.map(metric => {
      const values = analyses.map(analysis => {
        switch (metric.key) {
          case 'followers_count':
            return analysis.user.followers_count
          case 'engagement_rate':
            return analysis.metrics.engagement_rate
          case 'avg_likes':
            return analysis.metrics.avg_likes
          case 'posting_frequency':
            return analysis.metrics.posting_frequency
          default:
            return 0
        }
      })

      const average = values.reduce((a, b) => a + b, 0) / values.length
      const maxValue = Math.max(...values)
      const maxIndex = values.indexOf(maxValue)
      const bestPerformer = analyses[maxIndex]

      // Mock our performance
      const ourPerformance = average * 0.7

      return {
        metric: metric.name,
        our_performance: ourPerformance,
        competitor_average: average,
        best_performer: {
          username: bestPerformer.user.username,
          value: maxValue
        },
        improvement_opportunity: ((average - ourPerformance) / ourPerformance) * 100,
        recommendation: this.getBenchmarkRecommendation(metric.key, ourPerformance, average)
      }
    })
  }

  private getBenchmarkRecommendation(metric: string, current: number, average: number): string {
    const gap = ((average - current) / current) * 100
    
    switch (metric) {
      case 'followers_count':
        return gap > 50 ? 
          'Focus on consistent content and engage with industry communities' :
          'Maintain quality content and cross-promote on other channels'
      case 'engagement_rate':
        return gap > 30 ? 
          'Create more interactive content with questions and polls' :
          'Experiment with different content formats'
      default:
        return 'Analyze top performers and adapt their strategies'
    }
  }

  private generateMockTweets(username: string, count: number): any[] {
    const topics = [
      'Just passed my AWS Solutions Architect exam! Here are my top 5 study tips',
      'CompTIA Security+ is getting an update in 2024. Key changes you need to know',
      'Free practice questions for CCNA exam preparation',
      'Why cloud certifications are essential for IT professionals in 2024',
      'Study group forming for Microsoft Azure fundamentals'
    ]

    return Array.from({ length: count }, (_, i) => ({
      id: nanoid(),
      text: topics[i % topics.length],
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      author_id: nanoid(),
      public_metrics: {
        like_count: Math.floor(Math.random() * 100) + 10,
        retweet_count: Math.floor(Math.random() * 20) + 2,
        reply_count: Math.floor(Math.random() * 10) + 1,
        quote_count: Math.floor(Math.random() * 5)
      },
      entities: {
        hashtags: [
          { start: 0, end: 10, tag: 'AWS' },
          { start: 20, end: 30, tag: 'CloudCertification' }
        ]
      }
    }))
  }
}