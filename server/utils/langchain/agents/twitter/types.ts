import { z } from 'zod'

// Twitter User Schema
export const twitterUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  description: z.string().optional(),
  followers_count: z.number(),
  following_count: z.number(),
  tweet_count: z.number(),
  listed_count: z.number(),
  created_at: z.string(),
  verified: z.boolean().optional(),
  profile_image_url: z.string().optional()
})

// Tweet Schema
export const tweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  author_id: z.string(),
  conversation_id: z.string().optional(),
  in_reply_to_user_id: z.string().optional(),
  referenced_tweets: z.array(z.object({
    type: z.enum(['retweeted', 'quoted', 'replied_to']),
    id: z.string()
  })).optional(),
  entities: z.object({
    hashtags: z.array(z.object({
      start: z.number(),
      end: z.number(),
      tag: z.string()
    })).optional(),
    mentions: z.array(z.object({
      start: z.number(),
      end: z.number(),
      username: z.string()
    })).optional(),
    urls: z.array(z.object({
      start: z.number(),
      end: z.number(),
      url: z.string(),
      expanded_url: z.string().optional(),
      display_url: z.string().optional()
    })).optional()
  }).optional(),
  public_metrics: z.object({
    retweet_count: z.number(),
    reply_count: z.number(),
    like_count: z.number(),
    quote_count: z.number()
  }).optional()
})

// Metrics Schema
export const twitterMetricsSchema = z.object({
  engagement_rate: z.number(),
  avg_likes: z.number(),
  avg_retweets: z.number(),
  avg_replies: z.number(),
  posting_frequency: z.number(),
  hashtag_performance: z.record(z.number()),
  top_performing_tweets: z.array(tweetSchema)
})

// Competitor Insight Schema
export const competitorInsightSchema = z.object({
  type: z.enum(['content_strategy', 'posting_pattern', 'engagement_tactics', 'audience_building', 'viral_content']),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  impact: z.enum(['high', 'medium', 'low']),
  recommendation: z.string(),
  actionable_steps: z.array(z.string()),
  competitors_involved: z.array(z.string())
})

// Strategy Recommendation Schema
export const strategyRecommendationSchema = z.object({
  category: z.enum(['content', 'timing', 'hashtags', 'engagement', 'audience']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  effort: z.enum(['high', 'medium', 'low']),
  expected_impact: z.string(),
  implementation_steps: z.array(z.string()),
  success_metrics: z.array(z.string()),
  timeline: z.string(),
  budget_required: z.enum(['none', 'low', 'medium', 'high'])
})

// Competitor Analysis Schema
export const competitorAnalysisSchema = z.object({
  user: twitterUserSchema,
  metrics: twitterMetricsSchema,
  recent_tweets: z.array(tweetSchema),
  content_themes: z.array(z.string()),
  posting_patterns: z.object({
    best_times: z.array(z.string()),
    frequency_by_day: z.record(z.number()),
    consistency_score: z.number()
  }),
  engagement_insights: z.object({
    high_engagement_topics: z.array(z.string()),
    viral_factors: z.array(z.string()),
    audience_interaction_style: z.string()
  })
})

// Content Opportunity Schema
export const contentOpportunitySchema = z.object({
  trending_themes: z.array(z.object({
    theme: z.string(),
    frequency: z.number(),
    engagement: z.number()
  })),
  content_gaps: z.array(z.object({
    gap: z.string(),
    opportunity: z.string(),
    difficulty: z.string()
  })),
  viral_patterns: z.array(z.object({
    pattern: z.string(),
    examples: z.array(z.string()),
    success_rate: z.number()
  }))
})

// Benchmark Schema
export const benchmarkSchema = z.object({
  metric: z.string(),
  our_performance: z.number(),
  competitor_average: z.number(),
  best_performer: z.object({
    username: z.string(),
    value: z.number()
  }),
  improvement_opportunity: z.number(),
  recommendation: z.string()
})

// Analysis Result Schema
export const analysisResultSchema = z.object({
  analyses: z.array(competitorAnalysisSchema),
  insights: z.array(competitorInsightSchema),
  recommendations: z.array(strategyRecommendationSchema),
  benchmarks: z.array(benchmarkSchema)
})

// Export types
export type TwitterUser = z.infer<typeof twitterUserSchema>
export type Tweet = z.infer<typeof tweetSchema>
export type TwitterMetrics = z.infer<typeof twitterMetricsSchema>
export type CompetitorInsight = z.infer<typeof competitorInsightSchema>
export type StrategyRecommendation = z.infer<typeof strategyRecommendationSchema>
export type CompetitorAnalysis = z.infer<typeof competitorAnalysisSchema>
export type ContentOpportunity = z.infer<typeof contentOpportunitySchema>
export type Benchmark = z.infer<typeof benchmarkSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>