import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
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
  userId: text('user_id').references(() => users.id),
  achievementId: text('achievement_id').references(() => achievements.id),
  earnedAt: text('earned_at').default(sql`datetime('now')`),
})

export type UserBadge = typeof userBadges.$inferSelect
export type NewUserBadge = typeof userBadges.$inferInsert

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