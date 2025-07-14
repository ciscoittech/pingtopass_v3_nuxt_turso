import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { exams } from './exams'

export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
  icon: text('icon'),
  points: integer('points').default(0),
  requirementType: text('requirement_type'), // 'study_streak', 'correct_answers', 'exams_passed', etc.
  requirementValue: integer('requirement_value'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

export type Achievement = typeof achievements.$inferSelect
export type NewAchievement = typeof achievements.$inferInsert

export const userBadges = sqliteTable('user_badges', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').references(() => achievements.id),
  earnedAt: text('earned_at').default(sql`datetime('now')`),
  progress: real('progress').default(0),
  metadata: text('metadata'), // JSON data
})

export type UserBadge = typeof userBadges.$inferSelect
export type NewUserBadge = typeof userBadges.$inferInsert

// Enhanced Badge System
export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  category: text('category').notNull(), // 'streak', 'accuracy', 'volume', 'milestone', 'special'
  rarity: text('rarity').notNull(), // 'common', 'rare', 'epic', 'legendary'
  points: integer('points').notNull().default(0),
  condition: text('condition').notNull(), // JSON condition for earning
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type Badge = typeof badges.$inferSelect
export type NewBadge = typeof badges.$inferInsert

export const userBadgeEarnings = sqliteTable('user_badge_earnings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: integer('earned_at').notNull(),
  progress: real('progress').default(100), // Percentage complete
  metadata: text('metadata'), // JSON data about how it was earned
})

export type UserBadgeEarning = typeof userBadgeEarnings.$inferSelect
export type NewUserBadgeEarning = typeof userBadgeEarnings.$inferInsert

// Leaderboard System
export const leaderboards = sqliteTable('leaderboards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'global', 'exam', 'weekly', 'monthly'
  category: text('category').notNull(), // 'points', 'accuracy', 'streak', 'questions'
  examId: text('exam_id').references(() => exams.id),
  timeframe: text('timeframe'), // 'all_time', 'monthly', 'weekly', 'daily'
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type Leaderboard = typeof leaderboards.$inferSelect
export type NewLeaderboard = typeof leaderboards.$inferInsert

export const leaderboardEntries = sqliteTable('leaderboard_entries', {
  id: text('id').primaryKey(),
  leaderboardId: text('leaderboard_id').notNull().references(() => leaderboards.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: real('score').notNull(),
  rank: integer('rank').notNull(),
  metadata: text('metadata'), // JSON with additional stats
  period: text('period'), // For time-based leaderboards (e.g., "2024-01")
  lastUpdated: integer('last_updated').notNull(),
})

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect
export type NewLeaderboardEntry = typeof leaderboardEntries.$inferInsert

// User Level System
export const userLevels = sqliteTable('user_levels', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  experienceToNext: integer('experience_to_next').notNull().default(100),
  title: text('title').default('Beginner'),
  unlockedFeatures: text('unlocked_features'), // JSON array of features
  updatedAt: integer('updated_at').notNull(),
})

export type UserLevel = typeof userLevels.$inferSelect
export type NewUserLevel = typeof userLevels.$inferInsert

export const learningPaths = sqliteTable('learning_paths', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  difficulty: text('difficulty').default('intermediate'),
  estimatedHours: integer('estimated_hours'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

export type LearningPath = typeof learningPaths.$inferSelect
export type NewLearningPath = typeof learningPaths.$inferInsert

export const learningPathExams = sqliteTable('learning_path_exams', {
  id: text('id').primaryKey(),
  pathId: text('path_id').references(() => learningPaths.id),
  examId: text('exam_id').references(() => exams.id),
  orderIndex: integer('order_index'),
  isRequired: integer('is_required', { mode: 'boolean' }).default(true),
})

export type LearningPathExam = typeof learningPathExams.$inferSelect
export type NewLearningPathExam = typeof learningPathExams.$inferInsert