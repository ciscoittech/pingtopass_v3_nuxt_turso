import { Tool } from '@langchain/core/tools'
import { z } from 'zod'
import { TwitterClient } from '../../../twitterClient'

const FetchTweetsSchema = z.object({
  username: z.string().describe('Twitter username without @ symbol'),
  limit: z.number().optional().default(50).describe('Number of tweets to fetch'),
  includeReplies: z.boolean().optional().default(false).describe('Include reply tweets')
})

export class FetchTweetsTool extends Tool {
  name = 'fetch_tweets'
  description = 'Fetches recent tweets from a Twitter user'
  schema = FetchTweetsSchema
  
  private twitterClient: TwitterClient | null = null

  constructor(apiKey?: string) {
    super()
    if (apiKey) {
      this.twitterClient = new TwitterClient(apiKey)
    }
  }

  async _call(input: z.infer<typeof FetchTweetsSchema>): Promise<string> {
    try {
      if (!this.twitterClient) {
        // Return mock data if no API key
        return JSON.stringify({
          success: true,
          username: input.username,
          tweets: this.generateMockTweets(input.username, input.limit),
          message: 'Mock data - no Twitter API key provided'
        })
      }

      const tweets = await this.twitterClient.getUserTweets(
        input.username, 
        input.limit,
        input.includeReplies
      )

      return JSON.stringify({
        success: true,
        username: input.username,
        count: tweets.length,
        tweets: tweets
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        username: input.username
      })
    }
  }

  private generateMockTweets(username: string, count: number): any[] {
    const templates = [
      'Just launched a new study guide for {cert} certification! Check it out',
      'Pro tip: Focus on hands-on labs when preparing for {cert}',
      'Passed {cert}! Here\'s my study timeline and resources',
      'Common mistakes to avoid on the {cert} exam',
      'Free practice questions for {cert} - link in bio'
    ]

    const certs = ['AWS', 'Azure', 'CompTIA Security+', 'CCNA', 'Google Cloud']

    return Array.from({ length: count }, (_, i) => ({
      id: `tweet_${i}`,
      text: templates[i % templates.length].replace('{cert}', certs[i % certs.length]),
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