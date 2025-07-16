/**
 * Twitter Competitor Analysis Agent
 * 
 * Uses AI to analyze competitor Twitter strategies and generate actionable insights
 */

import { TwitterClient } from './twitterClient'
import type { CompetitorAnalysis, Tweet, TwitterMetrics, CompetitorInsight, StrategyRecommendation, Benchmark as CompetitorBenchmark } from './langchain/agents/twitter/types'
import { OpenRouterClient } from './openrouter'
import { nanoid } from 'nanoid'

// Re-export types for backward compatibility
export type { CompetitorInsight, StrategyRecommendation, CompetitorBenchmark }

export class TwitterAnalysisAgent {
  private twitterClient: TwitterClient
  private openRouter: OpenRouterClient
  private modelId: string

  constructor(
    twitterApiKey: string, 
    openRouterApiKey: string, 
    modelId: string = 'anthropic/claude-3.5-sonnet'
  ) {
    this.twitterClient = new TwitterClient(twitterApiKey)
    this.openRouter = new OpenRouterClient(openRouterApiKey)
    this.modelId = modelId
  }

  /**
   * Perform comprehensive competitor analysis
   */
  async analyzeCompetitors(competitorUsernames: string[]): Promise<{
    analyses: CompetitorAnalysis[]
    insights: CompetitorInsight[]
    recommendations: StrategyRecommendation[]
    benchmarks: CompetitorBenchmark[]
  }> {
    console.log(`Starting analysis of ${competitorUsernames.length} competitors`)

    // Analyze each competitor
    const analyses: CompetitorAnalysis[] = []
    for (const username of competitorUsernames) {
      try {
        const analysis = await this.twitterClient.analyzeCompetitor(username)
        if (analysis) {
          analyses.push(analysis)
          console.log(`✅ Analyzed @${username}: ${analysis.recent_tweets.length} tweets`)
        }
      } catch (error) {
        console.error(`❌ Failed to analyze @${username}:`, error)
      }
    }

    if (analyses.length === 0) {
      throw new Error('No competitors could be analyzed')
    }

    // Generate AI insights
    const insights = await this.generateInsights(analyses)
    const recommendations = await this.generateRecommendations(analyses, insights)
    const benchmarks = this.generateBenchmarks(analyses)

    return {
      analyses,
      insights,
      recommendations,
      benchmarks
    }
  }

  /**
   * Generate strategic insights using AI
   */
  private async generateInsights(analyses: CompetitorAnalysis[]): Promise<CompetitorInsight[]> {
    const prompt = `
Analyze these Twitter competitor analyses and generate strategic insights for a company in the IT certification training industry:

COMPETITOR DATA:
${analyses.map(analysis => `
@${analysis.user.username} (${analysis.user.followers_count} followers):
- Average engagement: ${analysis.metrics.engagement_rate.toFixed(1)}
- Posting frequency: ${analysis.metrics.posting_frequency.toFixed(1)} times/day
- Top hashtags: ${Object.keys(analysis.metrics.hashtag_performance).slice(0, 5).join(', ')}
- Content themes: ${analysis.content_themes.join(', ')}
- Best posting times: ${analysis.posting_patterns.best_times.join(', ')}
- Viral factors: ${analysis.engagement_insights.viral_factors.join(', ')}
- Top performing tweet: "${analysis.metrics.top_performing_tweets[0]?.text?.substring(0, 100)}..."
`).join('\n')}

Please identify 5-7 key insights focusing on:
1. Content strategies that drive engagement
2. Posting patterns and timing optimization
3. Hashtag and topic strategies
4. Audience engagement tactics
5. Viral content characteristics
6. Competitive advantages/gaps

For each insight, provide:
- Type (content_strategy, posting_pattern, engagement_tactics, audience_building, or viral_content)
- Title (concise, actionable)
- Description (detailed analysis)
- Confidence level (0.1-1.0)
- Impact level (high/medium/low)
- Specific recommendation
- 3-5 actionable steps
- Which competitors this applies to

Format as valid JSON array with the structure:
[{
  "type": "content_strategy",
  "title": "Educational Content Drives Higher Engagement",
  "description": "Competitors posting educational content see 2.3x higher engagement...",
  "confidence": 0.85,
  "impact": "high",
  "recommendation": "Focus on educational content that solves specific problems...",
  "actionable_steps": ["Create weekly tips series", "Share exam insights", "..."],
  "competitors_involved": ["username1", "username2"]
}]`

    try {
      const response = await this.openRouter.chat({
        model: this.modelId,
        messages: [
          { 
            role: 'system', 
            content: 'You are a social media strategist specializing in competitor analysis for the IT training industry. Provide strategic insights based on data analysis.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      const insights = JSON.parse(content.replace(/```json\n?|\n?```/g, ''))
      
      return insights.map((insight: any) => ({
        id: nanoid(),
        ...insight
      }))

    } catch (error) {
      console.error('Failed to generate insights:', error)
      return []
    }
  }

  /**
   * Generate strategic recommendations
   */
  private async generateRecommendations(
    analyses: CompetitorAnalysis[], 
    insights: CompetitorInsight[]
  ): Promise<StrategyRecommendation[]> {
    const prompt = `
Based on these competitor analyses and insights, generate specific strategy recommendations for improving our Twitter presence in the IT certification space:

COMPETITOR PERFORMANCE SUMMARY:
${analyses.map(a => `
@${a.user.username}: ${a.metrics.avg_likes} avg likes, ${a.metrics.posting_frequency.toFixed(1)}/day frequency, ${a.posting_patterns.consistency_score}% consistency
`).join('')}

KEY INSIGHTS:
${insights.map(i => `- ${i.title}: ${i.recommendation}`).join('\n')}

Generate 6-8 actionable strategy recommendations covering:
1. Content strategy improvements
2. Posting timing optimization  
3. Hashtag strategy
4. Engagement tactics
5. Audience growth strategies

For each recommendation:
- Category (content/timing/hashtags/engagement/audience)
- Clear title and description
- Priority level (high/medium/low)
- Effort required (high/medium/low)
- Expected impact description
- 4-6 implementation steps
- Success metrics to track
- Realistic timeline
- Budget requirements

Format as JSON array:
[{
  "category": "content",
  "title": "Implement Educational Tip Series",
  "description": "Create weekly educational content series...",
  "priority": "high",
  "effort": "medium", 
  "expected_impact": "Increase engagement by 40% and followers by 25%",
  "implementation_steps": ["Research top questions", "Create content calendar", "..."],
  "success_metrics": ["Engagement rate", "Follower growth", "..."],
  "timeline": "6-8 weeks",
  "budget_required": "low"
}]`

    try {
      const response = await this.openRouter.chat({
        model: this.modelId,
        messages: [
          { 
            role: 'system', 
            content: 'You are a social media strategist creating actionable recommendations for Twitter growth in the IT training industry.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 4000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      const recommendations = JSON.parse(content.replace(/```json\n?|\n?```/g, ''))
      
      return recommendations.map((rec: any) => ({
        id: nanoid(),
        ...rec
      }))

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return []
    }
  }

  /**
   * Generate performance benchmarks
   */
  private generateBenchmarks(analyses: CompetitorAnalysis[]): CompetitorBenchmark[] {
    const metrics = [
      { key: 'followers_count', name: 'Followers' },
      { key: 'engagement_rate', name: 'Engagement Rate' },
      { key: 'avg_likes', name: 'Average Likes' },
      { key: 'avg_retweets', name: 'Average Retweets' },
      { key: 'posting_frequency', name: 'Posting Frequency' },
      { key: 'consistency_score', name: 'Consistency Score' }
    ]

    const benchmarks: CompetitorBenchmark[] = []

    metrics.forEach(metric => {
      const values = analyses.map(analysis => {
        switch (metric.key) {
          case 'followers_count':
            return analysis.user.followers_count
          case 'engagement_rate':
            return analysis.metrics.engagement_rate
          case 'avg_likes':
            return analysis.metrics.avg_likes
          case 'avg_retweets':
            return analysis.metrics.avg_retweets
          case 'posting_frequency':
            return analysis.metrics.posting_frequency
          case 'consistency_score':
            return analysis.posting_patterns.consistency_score
          default:
            return 0
        }
      })

      const average = values.reduce((a, b) => a + b, 0) / values.length
      const maxValue = Math.max(...values)
      const maxIndex = values.indexOf(maxValue)
      const bestPerformer = analyses[maxIndex]

      // Simulate our current performance (would come from database in real app)
      const ourPerformance = average * 0.7 // Assume we're 30% below average

      benchmarks.push({
        metric: metric.name,
        our_performance: ourPerformance,
        competitor_average: average,
        best_performer: {
          username: bestPerformer.user.username,
          value: maxValue
        },
        improvement_opportunity: ((average - ourPerformance) / ourPerformance) * 100,
        recommendation: this.getBenchmarkRecommendation(metric.key, ourPerformance, average, maxValue)
      })
    })

    return benchmarks
  }

  /**
   * Get specific recommendation for benchmark improvement
   */
  private getBenchmarkRecommendation(
    metric: string, 
    current: number, 
    average: number, 
    best: number
  ): string {
    const gap = ((average - current) / current) * 100

    switch (metric) {
      case 'followers_count':
        return gap > 50 ? 
          'Focus on consistent content and engage with industry communities' :
          'Maintain quality content and cross-promote on other channels'
      
      case 'engagement_rate':
        return gap > 30 ? 
          'Create more interactive content with questions and polls' :
          'Experiment with different content formats and posting times'
      
      case 'avg_likes':
        return gap > 40 ? 
          'Share more valuable insights and use trending hashtags' :
          'Engage more with your audience and respond to comments'
      
      case 'avg_retweets':
        return gap > 50 ? 
          'Create shareable content with quotes and statistics' :
          'Add compelling visuals and calls-to-action'
      
      case 'posting_frequency':
        return gap > 30 ? 
          'Increase posting frequency to at least once daily' :
          'Maintain consistent posting schedule'
      
      case 'consistency_score':
        return gap > 20 ? 
          'Create a content calendar and schedule posts in advance' :
          'Fine-tune posting schedule based on audience analytics'
      
      default:
        return 'Analyze top performers and adapt their successful strategies'
    }
  }

  /**
   * Analyze specific content themes for opportunities
   */
  async analyzeContentOpportunities(competitors: string[]): Promise<{
    trending_themes: Array<{ theme: string; frequency: number; engagement: number }>
    content_gaps: Array<{ gap: string; opportunity: string; difficulty: string }>
    viral_patterns: Array<{ pattern: string; examples: string[]; success_rate: number }>
  }> {
    const analyses = await Promise.all(
      competitors.map(username => this.twitterClient.analyzeCompetitor(username))
    )

    const validAnalyses = analyses.filter(Boolean) as CompetitorAnalysis[]

    // Analyze trending themes
    const themeFrequency: Record<string, { count: number; totalEngagement: number }> = {}
    
    validAnalyses.forEach(analysis => {
      analysis.content_themes.forEach(theme => {
        if (!themeFrequency[theme]) {
          themeFrequency[theme] = { count: 0, totalEngagement: 0 }
        }
        themeFrequency[theme].count++
        themeFrequency[theme].totalEngagement += analysis.metrics.engagement_rate
      })
    })

    const trending_themes = Object.entries(themeFrequency)
      .map(([theme, data]) => ({
        theme,
        frequency: data.count,
        engagement: data.totalEngagement / data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)

    // Identify content gaps (themes not being covered)
    const all_themes = new Set(validAnalyses.flatMap(a => a.content_themes))
    const covered_themes = new Set(trending_themes.map(t => t.theme))
    
    const content_gaps = Array.from(all_themes)
      .filter(theme => !covered_themes.has(theme))
      .map(gap => ({
        gap,
        opportunity: `Unexplored topic with potential for first-mover advantage`,
        difficulty: 'medium'
      }))
      .slice(0, 5)

    // Analyze viral patterns
    const viral_patterns = [
      {
        pattern: 'Question-based content',
        examples: validAnalyses
          .flatMap(a => a.recent_tweets)
          .filter(t => t.text.includes('?'))
          .slice(0, 3)
          .map(t => t.text.substring(0, 100)),
        success_rate: 0.75
      },
      {
        pattern: 'Educational tips with numbers',
        examples: validAnalyses
          .flatMap(a => a.recent_tweets)
          .filter(t => /\d+\s+(tips|ways|steps)/i.test(t.text))
          .slice(0, 3)
          .map(t => t.text.substring(0, 100)),
        success_rate: 0.68
      },
      {
        pattern: 'Industry news commentary',
        examples: validAnalyses
          .flatMap(a => a.recent_tweets)
          .filter(t => t.entities?.urls?.length > 0)
          .slice(0, 3)
          .map(t => t.text.substring(0, 100)),
        success_rate: 0.55
      }
    ]

    return {
      trending_themes,
      content_gaps,
      viral_patterns
    }
  }

  /**
   * Monitor competitor activities for changes
   */
  async detectCompetitorChanges(
    username: string, 
    previousAnalysis: CompetitorAnalysis
  ): Promise<{
    significant_changes: Array<{
      metric: string
      previous_value: number
      current_value: number
      change_percentage: number
      significance: 'high' | 'medium' | 'low'
      insight: string
    }>
  }> {
    const currentAnalysis = await this.twitterClient.analyzeCompetitor(username)
    if (!currentAnalysis) {
      throw new Error(`Could not analyze current state of @${username}`)
    }

    const changes = []

    // Compare key metrics
    const metrics = [
      { 
        key: 'followers', 
        prev: previousAnalysis.user.followers_count, 
        curr: currentAnalysis.user.followers_count 
      },
      { 
        key: 'engagement_rate', 
        prev: previousAnalysis.metrics.engagement_rate, 
        curr: currentAnalysis.metrics.engagement_rate 
      },
      { 
        key: 'posting_frequency', 
        prev: previousAnalysis.metrics.posting_frequency, 
        curr: currentAnalysis.metrics.posting_frequency 
      },
      { 
        key: 'avg_likes', 
        prev: previousAnalysis.metrics.avg_likes, 
        curr: currentAnalysis.metrics.avg_likes 
      }
    ]

    metrics.forEach(metric => {
      const change = ((metric.curr - metric.prev) / metric.prev) * 100
      
      if (Math.abs(change) > 10) { // Significant if >10% change
        const significance = Math.abs(change) > 50 ? 'high' : 
                            Math.abs(change) > 25 ? 'medium' : 'low'
        
        changes.push({
          metric: metric.key,
          previous_value: metric.prev,
          current_value: metric.curr,
          change_percentage: change,
          significance,
          insight: this.getChangeInsight(metric.key, change)
        })
      }
    })

    return { significant_changes: changes }
  }

  /**
   * Get insight for metric changes
   */
  private getChangeInsight(metric: string, changePercent: number): string {
    const direction = changePercent > 0 ? 'increased' : 'decreased'
    const magnitude = Math.abs(changePercent)

    switch (metric) {
      case 'followers':
        return `Follower count ${direction} by ${magnitude.toFixed(1)}%. ${
          changePercent > 20 ? 'Investigate their recent viral content or campaigns.' :
          changePercent < -10 ? 'They may have lost followers due to controversial content or inactivity.' :
          'Normal fluctuation in audience growth.'
        }`
      
      case 'engagement_rate':
        return `Engagement ${direction} by ${magnitude.toFixed(1)}%. ${
          changePercent > 30 ? 'They found a highly engaging content format - analyze their recent posts.' :
          changePercent < -20 ? 'Their content may be losing relevance or audience interest.' :
          'Minor adjustment in audience engagement patterns.'
        }`
      
      case 'posting_frequency':
        return `Posting frequency ${direction} by ${magnitude.toFixed(1)}%. ${
          changePercent > 50 ? 'They significantly increased activity - possible new strategy or campaign.' :
          changePercent < -30 ? 'Reduced activity may indicate resource constraints or strategy shift.' :
          'Slight adjustment in posting schedule.'
        }`
      
      default:
        return `${metric} ${direction} by ${magnitude.toFixed(1)}% - monitor for trend continuation.`
    }
  }
}