/**
 * TwitterAPI.io Client for PingToPass
 * 
 * Provides a clean interface to TwitterAPI.io for:
 * - Competitor tweet analysis
 * - Engagement tracking
 * - Content performance monitoring
 * - Hashtag and trend analysis
 */

export interface TwitterUser {
  id: string
  username: string
  name: string
  description: string
  followers_count: number
  following_count: number
  tweet_count: number
  listed_count: number
  verified: boolean
  profile_image_url: string
  created_at: string
}

export interface Tweet {
  id: string
  text: string
  author_id: string
  created_at: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
  entities?: {
    hashtags?: Array<{ tag: string }>
    mentions?: Array<{ username: string; id: string }>
    urls?: Array<{ expanded_url: string; display_url: string }>
  }
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to'
    id: string
  }>
  context_annotations?: Array<{
    domain: { id: string; name: string; description: string }
    entity: { id: string; name: string; description?: string }
  }>
}

export interface TwitterMetrics {
  engagement_rate: number
  avg_likes: number
  avg_retweets: number
  avg_replies: number
  total_impressions: number
  top_performing_tweets: Tweet[]
  hashtag_performance: Record<string, number>
  posting_frequency: number
}

export interface CompetitorAnalysis {
  user: TwitterUser
  recent_tweets: Tweet[]
  metrics: TwitterMetrics
  content_themes: string[]
  posting_patterns: {
    best_times: string[]
    frequency: string
    consistency_score: number
  }
  engagement_insights: {
    top_content_types: string[]
    audience_engagement: string
    viral_factors: string[]
  }
}

export class TwitterClient {
  private apiKey: string
  private baseUrl = 'https://api.twitterapi.io/v2'
  private rateLimits = new Map<string, { count: number; resetTime: number }>()

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Get user information by username
   */
  async getUser(username: string): Promise<TwitterUser | null> {
    try {
      await this.checkRateLimit('users')
      
      const response = await this.makeRequest(`/users/by/username/${username}`, {
        'user.fields': 'description,public_metrics,verified,profile_image_url,created_at'
      })

      return response.data || null
    } catch (error) {
      console.error(`Failed to get user ${username}:`, error)
      return null
    }
  }

  /**
   * Get recent tweets from a user
   */
  async getUserTweets(
    username: string, 
    options: {
      maxResults?: number
      excludeReplies?: boolean
      excludeRetweets?: boolean
    } = {}
  ): Promise<Tweet[]> {
    try {
      await this.checkRateLimit('tweets')
      
      const user = await this.getUser(username)
      if (!user) return []

      const params = {
        'max_results': (options.maxResults || 10).toString(),
        'tweet.fields': 'created_at,public_metrics,entities,referenced_tweets,context_annotations',
        'exclude': [
          options.excludeReplies ? 'replies' : '',
          options.excludeRetweets ? 'retweets' : ''
        ].filter(Boolean).join(',')
      }

      const response = await this.makeRequest(`/users/${user.id}/tweets`, params)
      return response.data || []
    } catch (error) {
      console.error(`Failed to get tweets for ${username}:`, error)
      return []
    }
  }

  /**
   * Search for tweets by keyword or hashtag
   */
  async searchTweets(
    query: string,
    options: {
      maxResults?: number
      sortOrder?: 'recency' | 'relevancy'
      lang?: string
    } = {}
  ): Promise<Tweet[]> {
    try {
      await this.checkRateLimit('search')
      
      const params = {
        'query': query,
        'max_results': (options.maxResults || 10).toString(),
        'sort_order': options.sortOrder || 'recency',
        'tweet.fields': 'created_at,public_metrics,entities,context_annotations',
        'user.fields': 'username,name,verified,public_metrics'
      }

      if (options.lang) {
        params['lang'] = options.lang
      }

      const response = await this.makeRequest('/tweets/search/recent', params)
      return response.data || []
    } catch (error) {
      console.error(`Failed to search tweets for "${query}":`, error)
      return []
    }
  }

  /**
   * Get trending hashtags and topics
   */
  async getTrends(location: string = 'worldwide'): Promise<Array<{
    tag: string
    volume: number
    category: string
  }>> {
    try {
      await this.checkRateLimit('trends')
      
      // Map location to WOEID (Where On Earth ID)
      const locationMap: Record<string, string> = {
        'worldwide': '1',
        'united_states': '23424977',
        'united_kingdom': '23424975',
        'canada': '23424775',
        'australia': '23424748'
      }

      const woeid = locationMap[location.toLowerCase()] || '1'
      
      const response = await this.makeRequest('/trends/place', { id: woeid })
      
      if (response.trends && response.trends[0]?.trends) {
        return response.trends[0].trends.map((trend: any) => ({
          tag: trend.name,
          volume: trend.tweet_volume || 0,
          category: trend.category || 'general'
        }))
      }

      return []
    } catch (error) {
      console.error(`Failed to get trends for ${location}:`, error)
      return []
    }
  }

  /**
   * Analyze competitor's Twitter performance
   */
  async analyzeCompetitor(username: string): Promise<CompetitorAnalysis | null> {
    try {
      const user = await this.getUser(username)
      if (!user) return null

      const recentTweets = await this.getUserTweets(username, {
        maxResults: 50,
        excludeReplies: true,
        excludeRetweets: true
      })

      const metrics = this.calculateMetrics(recentTweets)
      const contentThemes = this.extractContentThemes(recentTweets)
      const postingPatterns = this.analyzePostingPatterns(recentTweets)
      const engagementInsights = this.analyzeEngagement(recentTweets)

      return {
        user,
        recent_tweets: recentTweets.slice(0, 10), // Return top 10 for display
        metrics,
        content_themes: contentThemes,
        posting_patterns: postingPatterns,
        engagement_insights: engagementInsights
      }
    } catch (error) {
      console.error(`Failed to analyze competitor ${username}:`, error)
      return null
    }
  }

  /**
   * Calculate performance metrics from tweets
   */
  private calculateMetrics(tweets: Tweet[]): TwitterMetrics {
    if (tweets.length === 0) {
      return {
        engagement_rate: 0,
        avg_likes: 0,
        avg_retweets: 0,
        avg_replies: 0,
        total_impressions: 0,
        top_performing_tweets: [],
        hashtag_performance: {},
        posting_frequency: 0
      }
    }

    const totalLikes = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.like_count, 0)
    const totalRetweets = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.retweet_count, 0)
    const totalReplies = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.reply_count, 0)
    const totalEngagements = totalLikes + totalRetweets + totalReplies

    // Calculate hashtag performance
    const hashtagCounts: Record<string, number> = {}
    tweets.forEach(tweet => {
      tweet.entities?.hashtags?.forEach(hashtag => {
        const tag = hashtag.tag.toLowerCase()
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + tweet.public_metrics.like_count
      })
    })

    // Calculate posting frequency (tweets per day)
    const daysDiff = this.getDaysBetween(
      new Date(tweets[tweets.length - 1]?.created_at || Date.now()),
      new Date(tweets[0]?.created_at || Date.now())
    )
    const postingFrequency = daysDiff > 0 ? tweets.length / daysDiff : tweets.length

    return {
      engagement_rate: totalEngagements / tweets.length,
      avg_likes: totalLikes / tweets.length,
      avg_retweets: totalRetweets / tweets.length,
      avg_replies: totalReplies / tweets.length,
      total_impressions: totalEngagements * 10, // Estimated
      top_performing_tweets: tweets
        .sort((a, b) => this.getTweetEngagement(b) - this.getTweetEngagement(a))
        .slice(0, 5),
      hashtag_performance: hashtagCounts,
      posting_frequency: postingFrequency
    }
  }

  /**
   * Extract content themes from tweets
   */
  private extractContentThemes(tweets: Tweet[]): string[] {
    const themes = new Set<string>()
    
    tweets.forEach(tweet => {
      // Extract from context annotations (Twitter's automatic categorization)
      tweet.context_annotations?.forEach(annotation => {
        themes.add(annotation.entity.name)
      })
      
      // Extract from hashtags
      tweet.entities?.hashtags?.forEach(hashtag => {
        themes.add(`#${hashtag.tag}`)
      })
    })

    return Array.from(themes).slice(0, 10) // Top 10 themes
  }

  /**
   * Analyze posting patterns
   */
  private analyzePostingPatterns(tweets: Tweet[]): {
    best_times: string[]
    frequency: string
    consistency_score: number
  } {
    if (tweets.length === 0) {
      return { best_times: [], frequency: 'unknown', consistency_score: 0 }
    }

    // Analyze posting times
    const hourCounts = new Array(24).fill(0)
    const dayGaps: number[] = []
    
    tweets.forEach((tweet, index) => {
      const date = new Date(tweet.created_at)
      hourCounts[date.getHours()]++
      
      if (index > 0) {
        const prevDate = new Date(tweets[index - 1].created_at)
        const gap = Math.abs(date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        dayGaps.push(gap)
      }
    })

    // Find best posting times (top 3 hours)
    const bestHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => `${item.hour}:00`)

    // Calculate frequency
    const avgGap = dayGaps.length > 0 ? dayGaps.reduce((a, b) => a + b, 0) / dayGaps.length : 0
    const frequency = avgGap < 1 ? 'daily' : avgGap < 7 ? 'weekly' : 'irregular'

    // Calculate consistency score (0-100)
    const gapVariance = dayGaps.length > 0 ? 
      dayGaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / dayGaps.length : 0
    const consistencyScore = Math.max(0, 100 - (gapVariance * 10))

    return {
      best_times: bestHours,
      frequency,
      consistency_score: Math.round(consistencyScore)
    }
  }

  /**
   * Analyze engagement patterns
   */
  private analyzeEngagement(tweets: Tweet[]): {
    top_content_types: string[]
    audience_engagement: string
    viral_factors: string[]
  } {
    const contentTypes: Record<string, number> = {}
    const viralFactors: string[] = []
    
    tweets.forEach(tweet => {
      const engagement = this.getTweetEngagement(tweet)
      
      // Categorize content types
      if (tweet.entities?.urls?.length) {
        contentTypes['links'] = (contentTypes['links'] || 0) + engagement
      }
      if (tweet.entities?.hashtags?.length) {
        contentTypes['hashtags'] = (contentTypes['hashtags'] || 0) + engagement
      }
      if (tweet.entities?.mentions?.length) {
        contentTypes['mentions'] = (contentTypes['mentions'] || 0) + engagement
      }
      if (tweet.text.includes('?')) {
        contentTypes['questions'] = (contentTypes['questions'] || 0) + engagement
      }
      if (tweet.text.length > 200) {
        contentTypes['long_form'] = (contentTypes['long_form'] || 0) + engagement
      } else {
        contentTypes['short_form'] = (contentTypes['short_form'] || 0) + engagement
      }

      // Identify viral factors
      if (tweet.public_metrics.retweet_count > 50) {
        viralFactors.push('high_shareability')
      }
      if (tweet.public_metrics.reply_count > 20) {
        viralFactors.push('conversation_starter')
      }
      if (tweet.entities?.hashtags?.some(h => h.tag.toLowerCase().includes('tech'))) {
        viralFactors.push('tech_content')
      }
    })

    const topContentTypes = Object.entries(contentTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)

    const avgEngagement = tweets.reduce((sum, tweet) => sum + this.getTweetEngagement(tweet), 0) / tweets.length
    const audienceEngagement = avgEngagement > 100 ? 'high' : avgEngagement > 50 ? 'medium' : 'low'

    return {
      top_content_types: topContentTypes,
      audience_engagement: audienceEngagement,
      viral_factors: Array.from(new Set(viralFactors))
    }
  }

  /**
   * Get total engagement for a tweet
   */
  private getTweetEngagement(tweet: Tweet): number {
    return tweet.public_metrics.like_count + 
           tweet.public_metrics.retweet_count + 
           tweet.public_metrics.reply_count
  }

  /**
   * Calculate days between two dates
   */
  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Make authenticated request to TwitterAPI.io
   */
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(endpoint, this.baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Twitter API error (${response.status}): ${error}`)
    }

    this.updateRateLimit(endpoint, response)
    return await response.json()
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimit(endpoint: string): Promise<void> {
    const limit = this.rateLimits.get(endpoint)
    if (limit && limit.count >= 100 && Date.now() < limit.resetTime) {
      const waitTime = limit.resetTime - Date.now()
      throw new Error(`Rate limit exceeded for ${endpoint}. Reset in ${Math.ceil(waitTime / 1000)} seconds`)
    }
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(endpoint: string, response: Response): void {
    const remaining = response.headers.get('x-rate-limit-remaining')
    const reset = response.headers.get('x-rate-limit-reset')
    
    if (remaining && reset) {
      this.rateLimits.set(endpoint, {
        count: 100 - parseInt(remaining),
        resetTime: parseInt(reset) * 1000
      })
    }
  }
}