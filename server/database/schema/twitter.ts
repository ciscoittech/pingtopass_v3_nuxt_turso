import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Legacy tables (keeping for backward compatibility)
export const twitterPosts = sqliteTable('twitter_posts', {
  id: text('id').primaryKey(),
  postId: text('post_id').unique().notNull(),
  content: text('content').notNull(),
  authorUsername: text('author_username'),
  authorName: text('author_name'),
  likes: integer('likes').default(0),
  retweets: integer('retweets').default(0),
  replies: integer('replies').default(0),
  views: integer('views').default(0),
  postedAt: text('posted_at'),
  scrapedAt: text('scraped_at').default(sql`CURRENT_TIMESTAMP`),
  engagementScore: real('engagement_score').default(0),
  hashtags: text('hashtags'), // JSON array stored as text
  mentions: text('mentions'), // JSON array stored as text
  urls: text('urls'), // JSON array stored as text
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const twitterProfiles = sqliteTable('twitter_profiles', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  displayName: text('display_name'),
  bio: text('bio'),
  followers: integer('followers').default(0),
  following: integer('following').default(0),
  tweetsCount: integer('tweets_count').default(0),
  verified: integer('verified', { mode: 'boolean' }).default(false),
  profileImageUrl: text('profile_image_url'),
  lastScraped: text('last_scraped').default(sql`CURRENT_TIMESTAMP`),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const twitterEngagementQueue = sqliteTable('twitter_engagement_queue', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  action: text('action').notNull(), // 'like', 'retweet', 'reply'
  status: text('status').default('pending'), // 'pending', 'processing', 'completed', 'failed'
  scheduledFor: text('scheduled_for'),
  processedAt: text('processed_at'),
  error: text('error'),
  retryCount: integer('retry_count').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// New competitor analysis tables
export const twitterCompetitors = sqliteTable('twitter_competitors', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // 'direct', 'indirect', 'influencer'
  priority: text('priority').notNull().default('medium'), // 'high', 'medium', 'low'
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  addedAt: integer('added_at').notNull().default(Math.floor(Date.now() / 1000)),
  lastAnalyzed: integer('last_analyzed'),
  notes: text('notes')
})

export const competitorMetrics = sqliteTable('competitor_metrics', {
  id: text('id').primaryKey(),
  competitorId: text('competitor_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  followersCount: integer('followers_count').notNull(),
  tweetsCount: integer('tweets_count').notNull(),
  avgLikes: real('avg_likes').notNull().default(0),
  avgRetweets: real('avg_retweets').notNull().default(0),
  avgReplies: real('avg_replies').notNull().default(0),
  engagementRate: real('engagement_rate').notNull().default(0),
  topHashtags: text('top_hashtags'), // JSON array
  contentThemes: text('content_themes'), // JSON array
  viralFactors: text('viral_factors'), // JSON array
  postingFrequency: real('posting_frequency').notNull().default(0),
  consistencyScore: integer('consistency_score').notNull().default(0),
  createdAt: integer('created_at').notNull().default(Math.floor(Date.now() / 1000))
})

export const contentInsights = sqliteTable('content_insights', {
  id: text('id').primaryKey(),
  competitorId: text('competitor_id').notNull(),
  insightType: text('insight_type').notNull(), // 'content_theme', 'posting_time', 'hashtag_strategy', 'engagement_pattern'
  title: text('title').notNull(),
  description: text('description').notNull(),
  confidence: real('confidence').notNull().default(0), // 0-1
  impact: text('impact').notNull(), // 'high', 'medium', 'low'
  recommendation: text('recommendation'),
  supportingData: text('supporting_data'), // JSON
  createdAt: integer('created_at').notNull().default(Math.floor(Date.now() / 1000)),
  isActionable: integer('is_actionable', { mode: 'boolean' }).notNull().default(true)
})

export const trendingTopics = sqliteTable('trending_topics', {
  id: text('id').primaryKey(),
  tag: text('tag').notNull(),
  volume: integer('volume').notNull().default(0),
  category: text('category').notNull().default('general'),
  location: text('location').notNull().default('worldwide'),
  relevanceScore: real('relevance_score').notNull().default(0), // How relevant to our industry
  opportunity: text('opportunity'), // Strategic opportunity description
  date: text('date').notNull(), // YYYY-MM-DD
  createdAt: integer('created_at').notNull().default(Math.floor(Date.now() / 1000))
})

export const strategyRecommendations = sqliteTable('strategy_recommendations', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'content', 'timing', 'hashtags', 'engagement'
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('medium'), // 'high', 'medium', 'low'
  effort: text('effort').notNull().default('medium'), // 'high', 'medium', 'low'
  expectedImpact: text('expected_impact').notNull(), // 'high', 'medium', 'low'
  basedOnCompetitors: text('based_on_competitors'), // JSON array of competitor IDs
  actionItems: text('action_items'), // JSON array
  metrics: text('metrics'), // JSON with expected metrics improvement
  status: text('status').notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'dismissed'
  createdAt: integer('created_at').notNull().default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').notNull().default(Math.floor(Date.now() / 1000))
})

export const monitoringJobs = sqliteTable('monitoring_jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'competitor_analysis', 'trend_monitoring', 'hashtag_tracking'
  config: text('config').notNull(), // JSON configuration
  schedule: text('schedule').notNull(), // Cron expression
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastRun: integer('last_run'),
  nextRun: integer('next_run'),
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  results: text('results'), // JSON with last run results
  createdAt: integer('created_at').notNull().default(Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').notNull().default(Math.floor(Date.now() / 1000))
})

// Type exports
export type TwitterPost = typeof twitterPosts.$inferSelect
export type NewTwitterPost = typeof twitterPosts.$inferInsert
export type TwitterProfile = typeof twitterProfiles.$inferSelect
export type NewTwitterProfile = typeof twitterProfiles.$inferInsert
export type TwitterEngagementQueue = typeof twitterEngagementQueue.$inferSelect
export type NewTwitterEngagementQueue = typeof twitterEngagementQueue.$inferInsert
export type TwitterCompetitor = typeof twitterCompetitors.$inferSelect
export type NewTwitterCompetitor = typeof twitterCompetitors.$inferInsert
export type CompetitorMetric = typeof competitorMetrics.$inferSelect
export type NewCompetitorMetric = typeof competitorMetrics.$inferInsert
export type ContentInsight = typeof contentInsights.$inferSelect
export type NewContentInsight = typeof contentInsights.$inferInsert
export type TrendingTopic = typeof trendingTopics.$inferSelect
export type NewTrendingTopic = typeof trendingTopics.$inferInsert
export type StrategyRecommendation = typeof strategyRecommendations.$inferSelect
export type NewStrategyRecommendation = typeof strategyRecommendations.$inferInsert
export type MonitoringJob = typeof monitoringJobs.$inferSelect
export type NewMonitoringJob = typeof monitoringJobs.$inferInsert