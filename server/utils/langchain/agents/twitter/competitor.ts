import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { BaseTwitterAgent } from './base'
import { 
  competitorAnalysisSchema, 
  competitorInsightSchema,
  type CompetitorAnalysis,
  type CompetitorInsight,
  type Tweet
} from './types'
import { z } from 'zod'

interface CompetitorAgentInput {
  username: string
  tweets: Tweet[]
  userInfo: {
    followers_count: number
    following_count: number
    tweet_count: number
    description?: string
  }
}

interface CompetitorAgentOutput {
  analysis: CompetitorAnalysis
  insights: CompetitorInsight[]
  cost: number
}

export class TwitterCompetitorAgent extends BaseTwitterAgent<CompetitorAgentInput, CompetitorAgentOutput> {
  private analysisParser: StructuredOutputParser<z.infer<typeof competitorAnalysisSchema>>
  private insightsParser: StructuredOutputParser<{ insights: CompetitorInsight[] }>

  constructor(modelName?: string) {
    super(modelName || 'google/gemini-2.5-flash-preview-05-20', 0.7, 3000)
    this.analysisParser = StructuredOutputParser.fromZodSchema(competitorAnalysisSchema)
    this.insightsParser = StructuredOutputParser.fromZodSchema(
      z.object({ insights: z.array(competitorInsightSchema) })
    )
  }

  getName(): string {
    return 'TwitterCompetitorAgent'
  }

  getDescription(): string {
    return 'Analyzes Twitter competitor strategies and generates actionable insights'
  }

  async process(input: CompetitorAgentInput): Promise<CompetitorAgentOutput> {
    console.log(`[${this.getName()}] Analyzing competitor @${input.username}`)

    // First, analyze the competitor
    const analysis = await this.analyzeCompetitor(input)
    
    // Then generate insights based on the analysis
    const insights = await this.generateInsights(analysis)

    // Calculate total cost
    const totalTokens = 4000 // Estimate for now
    const cost = this.calculateCost(totalTokens)

    return {
      analysis,
      insights,
      cost
    }
  }

  private async analyzeCompetitor(input: CompetitorAgentInput): Promise<CompetitorAnalysis> {
    const template = `
Analyze this Twitter competitor's strategy and performance for the IT certification training industry:

Username: @{username}
Followers: {followers}
Bio: {bio}
Total Tweets: {tweetCount}

Recent Tweets (last {tweetsSample} tweets):
{tweets}

Please analyze:
1. Calculate engagement metrics (engagement rate, avg likes/retweets/replies)
2. Identify content themes and topics
3. Determine posting patterns and best times
4. Extract engagement insights and viral factors
5. Assess consistency and frequency

{formatInstructions}

Provide a comprehensive competitor analysis following the exact schema.`

    const formatInstructions = this.analysisParser.getFormatInstructions()
    
    const prompt = this.buildPrompt(template, {
      username: input.username,
      followers: input.userInfo.followers_count,
      bio: input.userInfo.description || 'No bio provided',
      tweetCount: input.userInfo.tweet_count,
      tweetsSample: input.tweets.length,
      tweets: this.formatTweetsForPrompt(input.tweets),
      formatInstructions
    })

    const response = await this.callLLM(prompt)
    
    // Create a partial analysis with the data we have
    const partialAnalysis: CompetitorAnalysis = {
      user: {
        id: input.tweets[0]?.author_id || 'unknown',
        username: input.username,
        name: input.username,
        followers_count: input.userInfo.followers_count,
        following_count: input.userInfo.following_count,
        tweet_count: input.userInfo.tweet_count,
        listed_count: 0,
        created_at: new Date().toISOString(),
        verified: false,
        description: input.userInfo.description
      },
      metrics: this.calculateMetrics(input.tweets),
      recent_tweets: input.tweets.slice(0, 10),
      content_themes: [],
      posting_patterns: {
        best_times: [],
        frequency_by_day: {},
        consistency_score: 0
      },
      engagement_insights: {
        high_engagement_topics: [],
        viral_factors: [],
        audience_interaction_style: ''
      }
    }

    try {
      // Try to parse the LLM response and merge with partial analysis
      const parsed = await this.parseStructuredOutput(response, this.analysisParser)
      return {
        ...partialAnalysis,
        ...parsed,
        user: partialAnalysis.user, // Keep our accurate user data
        recent_tweets: partialAnalysis.recent_tweets // Keep actual tweets
      }
    } catch (error) {
      console.error(`[${this.getName()}] Failed to parse analysis, using partial data:`, error)
      return partialAnalysis
    }
  }

  private async generateInsights(analysis: CompetitorAnalysis): Promise<CompetitorInsight[]> {
    const template = `
Based on this competitor analysis for @{username} in the IT certification training industry, generate strategic insights:

COMPETITOR PERFORMANCE:
- Followers: {followers}
- Engagement Rate: {engagementRate}%
- Avg Likes: {avgLikes}
- Posting Frequency: {postingFreq} times/day
- Content Themes: {themes}

Generate 3-5 actionable insights focusing on:
1. What strategies are working well for this competitor
2. Patterns that drive high engagement
3. Content gaps or opportunities
4. Timing and frequency optimization
5. Audience building tactics

Each insight should include:
- Type (content_strategy, posting_pattern, engagement_tactics, audience_building, or viral_content)
- Clear, actionable title
- Detailed description with data
- Confidence level (0.1-1.0)
- Impact level (high/medium/low)
- Specific recommendation for our strategy
- 3-5 concrete action steps

{formatInstructions}

Format as JSON with an "insights" array.`

    const formatInstructions = this.insightsParser.getFormatInstructions()
    
    const prompt = this.buildPrompt(template, {
      username: analysis.user.username,
      followers: analysis.user.followers_count,
      engagementRate: analysis.metrics.engagement_rate.toFixed(1),
      avgLikes: analysis.metrics.avg_likes.toFixed(0),
      postingFreq: analysis.metrics.posting_frequency.toFixed(1),
      themes: analysis.content_themes.join(', ') || 'Various topics',
      formatInstructions
    })

    const response = await this.callLLM(prompt)
    
    try {
      const parsed = await this.parseStructuredOutput(response, this.insightsParser)
      return parsed.insights.map(insight => ({
        ...insight,
        competitors_involved: [analysis.user.username]
      }))
    } catch (error) {
      console.error(`[${this.getName()}] Failed to parse insights:`, error)
      return []
    }
  }

  private formatTweetsForPrompt(tweets: Tweet[]): string {
    return tweets.slice(0, 20).map((tweet, index) => {
      const metrics = tweet.public_metrics
      return `${index + 1}. "${tweet.text.substring(0, 200)}..."
   - Likes: ${metrics?.like_count || 0}, Retweets: ${metrics?.retweet_count || 0}, Replies: ${metrics?.reply_count || 0}
   - Created: ${tweet.created_at}`
    }).join('\n\n')
  }

  private calculateMetrics(tweets: Tweet[]) {
    const totalTweets = tweets.length || 1
    
    const totals = tweets.reduce((acc, tweet) => {
      const metrics = tweet.public_metrics || { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 }
      return {
        likes: acc.likes + metrics.like_count,
        retweets: acc.retweets + metrics.retweet_count,
        replies: acc.replies + metrics.reply_count,
        quotes: acc.quotes + metrics.quote_count
      }
    }, { likes: 0, retweets: 0, replies: 0, quotes: 0 })

    const avgLikes = totals.likes / totalTweets
    const avgRetweets = totals.retweets / totalTweets
    const avgReplies = totals.replies / totalTweets
    
    // Calculate engagement rate
    const avgEngagements = avgLikes + avgRetweets + avgReplies
    const engagementRate = (avgEngagements / 1000) * 100 // Simplified calculation

    // Extract hashtags
    const hashtagCounts: Record<string, number> = {}
    tweets.forEach(tweet => {
      tweet.entities?.hashtags?.forEach(hashtag => {
        hashtagCounts[hashtag.tag] = (hashtagCounts[hashtag.tag] || 0) + 1
      })
    })

    return {
      engagement_rate: engagementRate,
      avg_likes: avgLikes,
      avg_retweets: avgRetweets,
      avg_replies: avgReplies,
      posting_frequency: totalTweets / 7, // Assume tweets are from last 7 days
      hashtag_performance: hashtagCounts,
      top_performing_tweets: tweets
        .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
        .slice(0, 5)
    }
  }
}