import { Tool } from '@langchain/core/tools'
import { z } from 'zod'
import type { Tweet } from '../../agents/twitter/types'

const AnalyzeMetricsSchema = z.object({
  tweets: z.array(z.any()).describe('Array of tweet objects to analyze'),
  period: z.string().optional().default('7d').describe('Time period for analysis')
})

export class AnalyzeMetricsTool extends Tool {
  name = 'analyze_metrics'
  description = 'Calculates engagement metrics from a collection of tweets'
  schema = AnalyzeMetricsSchema

  async _call(input: z.infer<typeof AnalyzeMetricsSchema>): Promise<string> {
    try {
      const tweets = input.tweets as Tweet[]
      
      if (tweets.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No tweets provided for analysis'
        })
      }

      // Calculate metrics
      const totalTweets = tweets.length
      const engagementData = tweets.map(tweet => ({
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        quotes: tweet.public_metrics?.quote_count || 0
      }))

      const totals = engagementData.reduce((acc, data) => ({
        likes: acc.likes + data.likes,
        retweets: acc.retweets + data.retweets,
        replies: acc.replies + data.replies,
        quotes: acc.quotes + data.quotes
      }), { likes: 0, retweets: 0, replies: 0, quotes: 0 })

      const avgLikes = totals.likes / totalTweets
      const avgRetweets = totals.retweets / totalTweets
      const avgReplies = totals.replies / totalTweets
      const avgQuotes = totals.quotes / totalTweets
      
      // Calculate engagement rate (simplified)
      const avgEngagements = avgLikes + avgRetweets + avgReplies + avgQuotes
      const engagementRate = (avgEngagements / 1000) * 100

      // Extract hashtags
      const hashtagFrequency: Record<string, number> = {}
      tweets.forEach(tweet => {
        tweet.entities?.hashtags?.forEach(hashtag => {
          hashtagFrequency[hashtag.tag] = (hashtagFrequency[hashtag.tag] || 0) + 1
        })
      })

      // Find top performing tweets
      const topTweets = [...tweets]
        .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          text: t.text.substring(0, 100) + '...',
          likes: t.public_metrics?.like_count || 0,
          engagement: (t.public_metrics?.like_count || 0) + 
                     (t.public_metrics?.retweet_count || 0) + 
                     (t.public_metrics?.reply_count || 0)
        }))

      // Posting frequency analysis
      const dates = tweets.map(t => new Date(t.created_at))
      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const latestDate = new Date(Math.max(...dates.map(d => d.getTime())))
      const daysDiff = Math.max(1, (latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
      const postingFrequency = totalTweets / daysDiff

      return JSON.stringify({
        success: true,
        metrics: {
          total_tweets: totalTweets,
          engagement_rate: parseFloat(engagementRate.toFixed(2)),
          avg_likes: parseFloat(avgLikes.toFixed(1)),
          avg_retweets: parseFloat(avgRetweets.toFixed(1)),
          avg_replies: parseFloat(avgReplies.toFixed(1)),
          avg_quotes: parseFloat(avgQuotes.toFixed(1)),
          posting_frequency: parseFloat(postingFrequency.toFixed(2)),
          top_hashtags: Object.entries(hashtagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count })),
          top_tweets: topTweets,
          analysis_period: {
            start: earliestDate.toISOString(),
            end: latestDate.toISOString(),
            days: Math.round(daysDiff)
          }
        }
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}