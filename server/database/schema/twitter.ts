import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

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

export type TwitterPost = typeof twitterPosts.$inferSelect
export type NewTwitterPost = typeof twitterPosts.$inferInsert

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

export type TwitterProfile = typeof twitterProfiles.$inferSelect
export type NewTwitterProfile = typeof twitterProfiles.$inferInsert

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

export type TwitterEngagementQueue = typeof twitterEngagementQueue.$inferSelect
export type NewTwitterEngagementQueue = typeof twitterEngagementQueue.$inferInsert