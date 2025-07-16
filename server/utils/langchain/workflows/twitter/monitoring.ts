import { StateGraph, END } from '@langchain/langgraph'
import { TwitterCompetitorAgent } from '../../agents/twitter/competitor'
import { TwitterClient } from '../../../twitterClient'
import { RunnableConfig } from '@langchain/core/runnables'
import type { CompetitorAnalysis } from '../../agents/twitter/types'

interface MonitoringState {
  // Input
  competitorUsernames: string[]
  previousAnalyses: Map<string, CompetitorAnalysis>
  alertThresholds: {
    followerChangePercent: number
    engagementChangePercent: number
    postingFrequencyChangePercent: number
  }
  
  // Current data
  currentAnalyses: Map<string, CompetitorAnalysis>
  
  // Changes detected
  significantChanges: Array<{
    username: string
    metric: string
    previousValue: number
    currentValue: number
    changePercent: number
    alert: boolean
  }>
  
  // Alerts
  alerts: Array<{
    type: 'growth' | 'decline' | 'strategy_change' | 'viral_content'
    severity: 'high' | 'medium' | 'low'
    username: string
    title: string
    description: string
    recommendation: string
    timestamp: string
  }>
  
  // Metadata
  monitoringStartTime: number
  monitoringEndTime: number | null
  errors: string[]
  workflowSteps: string[]
}

export class TwitterMonitoringWorkflow {
  private graph: StateGraph<MonitoringState>
  private competitorAgent: TwitterCompetitorAgent
  private twitterClient: TwitterClient | null = null
  
  constructor(twitterApiKey?: string) {
    this.competitorAgent = new TwitterCompetitorAgent()
    
    if (twitterApiKey) {
      this.twitterClient = new TwitterClient(twitterApiKey)
    }
    
    this.graph = this.buildGraph()
  }
  
  private buildGraph(): StateGraph<MonitoringState> {
    const workflow = new StateGraph<MonitoringState>({
      channels: {
        competitorUsernames: {
          value: (x: string[], y?: string[]) => y ?? x ?? []
        },
        previousAnalyses: {
          value: (x: Map<string, any>, y?: Map<string, any>) => y ?? x ?? new Map()
        },
        alertThresholds: {
          value: (x: any, y?: any) => y ?? x ?? {
            followerChangePercent: 10,
            engagementChangePercent: 20,
            postingFrequencyChangePercent: 30
          }
        },
        currentAnalyses: {
          value: (x: Map<string, any>, y?: Map<string, any>) => y ?? x ?? new Map()
        },
        significantChanges: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        alerts: {
          value: (x: any[], y?: any[]) => y ?? x ?? []
        },
        monitoringStartTime: {
          value: (x: number, y?: number) => y ?? x ?? Date.now()
        },
        monitoringEndTime: {
          value: (x: number | null, y?: number | null) => y ?? x ?? null
        },
        errors: {
          value: (x: string[], y?: string[]) => [...(x ?? []), ...(y ?? [])]
        },
        workflowSteps: {
          value: (x: string[], y?: string[]) => [...(x ?? []), ...(y ?? [])]
        }
      }
    })
    
    // Add nodes
    workflow.addNode('fetchCurrentData', async (state) => await this.fetchCurrentDataNode(state))
    workflow.addNode('detectChanges', async (state) => await this.detectChangesNode(state))
    workflow.addNode('generateAlerts', async (state) => await this.generateAlertsNode(state))
    
    // Set up flow
    workflow.setEntryPoint('fetchCurrentData')
    workflow.addEdge('fetchCurrentData', 'detectChanges')
    workflow.addEdge('detectChanges', 'generateAlerts')
    workflow.addEdge('generateAlerts', END)
    
    return workflow
  }
  
  async run(input: {
    competitorUsernames: string[]
    previousAnalyses: Map<string, CompetitorAnalysis>
    alertThresholds?: MonitoringState['alertThresholds']
    twitterApiKey?: string
  }): Promise<MonitoringState> {
    if (input.twitterApiKey && !this.twitterClient) {
      this.twitterClient = new TwitterClient(input.twitterApiKey)
    }
    
    const app = this.graph.compile()
    
    const initialState: MonitoringState = {
      competitorUsernames: input.competitorUsernames,
      previousAnalyses: input.previousAnalyses,
      alertThresholds: input.alertThresholds || {
        followerChangePercent: 10,
        engagementChangePercent: 20,
        postingFrequencyChangePercent: 30
      },
      currentAnalyses: new Map(),
      significantChanges: [],
      alerts: [],
      monitoringStartTime: Date.now(),
      monitoringEndTime: null,
      errors: [],
      workflowSteps: []
    }
    
    const config: RunnableConfig = {
      metadata: {
        workflow: 'twitter_monitoring',
        competitors: input.competitorUsernames
      },
      tags: ['twitter', 'monitoring', 'langchain']
    }
    
    const finalState = await app.invoke(initialState, config)
    finalState.monitoringEndTime = Date.now()
    
    return finalState
  }
  
  private async fetchCurrentDataNode(state: MonitoringState): Promise<Partial<MonitoringState>> {
    console.log('[Monitoring] Fetching current data for competitors')
    
    const currentAnalyses = new Map<string, CompetitorAnalysis>()
    const errors: string[] = []
    
    for (const username of state.competitorUsernames) {
      try {
        // Fetch fresh data
        let tweets: any[] = []
        let userInfo: any = null
        
        if (this.twitterClient) {
          const analysis = await this.twitterClient.analyzeCompetitor(username)
          if (analysis) {
            tweets = analysis.recent_tweets
            userInfo = analysis.user
          }
        } else {
          // Mock data for testing
          tweets = this.generateMockTweets(username, 20)
          userInfo = {
            followers_count: Math.floor(Math.random() * 50000) + 5000,
            following_count: Math.floor(Math.random() * 5000) + 500,
            tweet_count: Math.floor(Math.random() * 10000) + 1000,
            description: `Mock user @${username}`
          }
        }
        
        // Analyze with agent
        const result = await this.competitorAgent.process({
          username,
          tweets,
          userInfo
        })
        
        currentAnalyses.set(username, result.analysis)
      } catch (error: any) {
        errors.push(`Failed to fetch data for @${username}: ${error.message}`)
      }
    }
    
    return {
      currentAnalyses,
      errors,
      workflowSteps: ['fetchCurrentData']
    }
  }
  
  private async detectChangesNode(state: MonitoringState): Promise<Partial<MonitoringState>> {
    console.log('[Monitoring] Detecting changes')
    
    const significantChanges: MonitoringState['significantChanges'] = []
    
    for (const [username, currentAnalysis] of state.currentAnalyses) {
      const previousAnalysis = state.previousAnalyses.get(username)
      
      if (!previousAnalysis) {
        console.log(`[Monitoring] No previous analysis for @${username}, skipping`)
        continue
      }
      
      // Check follower changes
      const followerChange = this.calculatePercentChange(
        previousAnalysis.user.followers_count,
        currentAnalysis.user.followers_count
      )
      
      if (Math.abs(followerChange) >= state.alertThresholds.followerChangePercent) {
        significantChanges.push({
          username,
          metric: 'followers',
          previousValue: previousAnalysis.user.followers_count,
          currentValue: currentAnalysis.user.followers_count,
          changePercent: followerChange,
          alert: true
        })
      }
      
      // Check engagement rate changes
      const engagementChange = this.calculatePercentChange(
        previousAnalysis.metrics.engagement_rate,
        currentAnalysis.metrics.engagement_rate
      )
      
      if (Math.abs(engagementChange) >= state.alertThresholds.engagementChangePercent) {
        significantChanges.push({
          username,
          metric: 'engagement_rate',
          previousValue: previousAnalysis.metrics.engagement_rate,
          currentValue: currentAnalysis.metrics.engagement_rate,
          changePercent: engagementChange,
          alert: true
        })
      }
      
      // Check posting frequency changes
      const postingChange = this.calculatePercentChange(
        previousAnalysis.metrics.posting_frequency,
        currentAnalysis.metrics.posting_frequency
      )
      
      if (Math.abs(postingChange) >= state.alertThresholds.postingFrequencyChangePercent) {
        significantChanges.push({
          username,
          metric: 'posting_frequency',
          previousValue: previousAnalysis.metrics.posting_frequency,
          currentValue: currentAnalysis.metrics.posting_frequency,
          changePercent: postingChange,
          alert: true
        })
      }
    }
    
    return {
      significantChanges,
      workflowSteps: ['detectChanges']
    }
  }
  
  private async generateAlertsNode(state: MonitoringState): Promise<Partial<MonitoringState>> {
    console.log('[Monitoring] Generating alerts')
    
    const alerts: MonitoringState['alerts'] = []
    
    // Group changes by username
    const changesByUser = new Map<string, typeof state.significantChanges>()
    
    state.significantChanges.forEach(change => {
      const userChanges = changesByUser.get(change.username) || []
      userChanges.push(change)
      changesByUser.set(change.username, userChanges)
    })
    
    // Generate alerts for each user with changes
    for (const [username, changes] of changesByUser) {
      const currentAnalysis = state.currentAnalyses.get(username)
      if (!currentAnalysis) continue
      
      // Check for rapid growth
      const followerChange = changes.find(c => c.metric === 'followers')
      if (followerChange && followerChange.changePercent > 20) {
        alerts.push({
          type: 'growth',
          severity: 'high',
          username,
          title: `Rapid Follower Growth: @${username}`,
          description: `@${username} gained ${followerChange.changePercent.toFixed(0)}% followers (${followerChange.previousValue} → ${followerChange.currentValue})`,
          recommendation: 'Analyze their recent content and engagement tactics to identify growth drivers',
          timestamp: new Date().toISOString()
        })
      }
      
      // Check for engagement changes
      const engagementChange = changes.find(c => c.metric === 'engagement_rate')
      if (engagementChange) {
        const severity = Math.abs(engagementChange.changePercent) > 50 ? 'high' : 'medium'
        const changeType = engagementChange.changePercent > 0 ? 'increase' : 'decrease'
        
        alerts.push({
          type: engagementChange.changePercent > 0 ? 'strategy_change' : 'decline',
          severity,
          username,
          title: `Engagement ${changeType}: @${username}`,
          description: `Engagement rate ${changeType}d by ${Math.abs(engagementChange.changePercent).toFixed(0)}% (${engagementChange.previousValue.toFixed(1)}% → ${engagementChange.currentValue.toFixed(1)}%)`,
          recommendation: engagementChange.changePercent > 0 
            ? 'Study their new content strategy and adapt successful elements'
            : 'Monitor for continued decline and differentiate your strategy',
          timestamp: new Date().toISOString()
        })
      }
      
      // Check for viral content
      if (currentAnalysis.metrics.top_performing_tweets.length > 0) {
        const topTweet = currentAnalysis.metrics.top_performing_tweets[0]
        const avgLikes = currentAnalysis.metrics.avg_likes
        
        if (topTweet.public_metrics?.like_count && topTweet.public_metrics.like_count > avgLikes * 5) {
          alerts.push({
            type: 'viral_content',
            severity: 'medium',
            username,
            title: `Viral Content Alert: @${username}`,
            description: `Tweet with ${topTweet.public_metrics.like_count} likes (${(topTweet.public_metrics.like_count / avgLikes).toFixed(1)}x average)`,
            recommendation: 'Analyze the viral content structure and topic for insights',
            timestamp: new Date().toISOString()
          })
        }
      }
    }
    
    // Sort alerts by severity
    alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    
    return {
      alerts,
      workflowSteps: ['generateAlerts']
    }
  }
  
  private calculatePercentChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }
  
  private generateMockTweets(username: string, count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `tweet_${i}`,
      text: `Mock tweet ${i} from @${username}`,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      author_id: username,
      public_metrics: {
        like_count: Math.floor(Math.random() * 100),
        retweet_count: Math.floor(Math.random() * 20),
        reply_count: Math.floor(Math.random() * 10),
        quote_count: Math.floor(Math.random() * 5)
      }
    }))
  }
}