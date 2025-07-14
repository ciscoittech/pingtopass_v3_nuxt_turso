import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { exams } from './exams'

export const userProgress = sqliteTable('user_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  
  // Overall Progress Statistics
  totalStudySessions: integer('total_study_sessions').default(0),
  totalTestsTaken: integer('total_tests_taken').default(0),
  totalTimeSpent: integer('total_time_spent').default(0), // in seconds
  totalQuestionsAnswered: integer('total_questions_answered').default(0),
  
  // Accuracy and Performance
  correctAnswers: integer('correct_answers').default(0),
  incorrectAnswers: integer('incorrect_answers').default(0),
  currentAccuracy: real('current_accuracy').default(0), // percentage
  bestTestScore: integer('best_test_score').default(0), // percentage
  averageTestScore: real('average_test_score').default(0), // percentage
  
  // Streak and Consistency
  currentStreak: integer('current_streak').default(0), // consecutive correct answers
  longestStreak: integer('longest_streak').default(0),
  studyStreak: integer('study_streak').default(0), // consecutive days studied
  lastStudyDate: integer('last_study_date'), // timestamp
  
  // Mastery and Weak Areas
  masteryLevel: text('mastery_level').default('beginner'), // 'beginner', 'intermediate', 'advanced', 'expert'
  weakAreas: text('weak_areas'), // JSON array of topic IDs
  strongAreas: text('strong_areas'), // JSON array of topic IDs
  
  // Time-based Analytics
  averageQuestionTime: real('average_question_time').default(0), // seconds per question
  fastestQuestionTime: real('fastest_question_time'), // seconds
  studyPatterns: text('study_patterns'), // JSON: preferred study times, duration patterns
  
  // Goals and Milestones
  weeklyGoal: integer('weekly_goal').default(0), // minutes per week
  weeklyProgress: integer('weekly_progress').default(0), // minutes this week
  monthlyGoal: integer('monthly_goal').default(0), // minutes per month
  monthlyProgress: integer('monthly_progress').default(0), // minutes this month
  
  // Metadata
  firstStudyDate: integer('first_study_date'),
  lastUpdated: integer('last_updated').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const userStreaks = sqliteTable('user_streaks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Daily Study Streaks
  currentDailyStreak: integer('current_daily_streak').default(0),
  longestDailyStreak: integer('longest_daily_streak').default(0),
  lastStudyDate: integer('last_study_date'),
  
  // Weekly Study Streaks
  currentWeeklyStreak: integer('current_weekly_streak').default(0),
  longestWeeklyStreak: integer('longest_weekly_streak').default(0),
  
  // Answer Streaks
  currentAnswerStreak: integer('current_answer_streak').default(0),
  longestAnswerStreak: integer('longest_answer_streak').default(0),
  lastCorrectAnswer: integer('last_correct_answer'),
  
  // Perfect Score Streaks
  perfectScoreStreak: integer('perfect_score_streak').default(0),
  longestPerfectStreak: integer('longest_perfect_streak').default(0),
  
  // Metadata
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const studyActivity = sqliteTable('study_activity', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'cascade' }),
  
  // Activity Details
  activityType: text('activity_type').notNull(), // 'study_session', 'test_completed', 'milestone_reached'
  activityData: text('activity_data'), // JSON data specific to activity type
  
  // Performance Metrics
  questionsAnswered: integer('questions_answered').default(0),
  correctAnswers: integer('correct_answers').default(0),
  timeSpent: integer('time_spent').default(0), // seconds
  score: integer('score'), // percentage for tests
  
  // Context
  sessionId: text('session_id'), // reference to study or test session
  date: integer('date').notNull(), // date only (for grouping)
  timestamp: integer('timestamp').notNull(), // full timestamp
  
  // Metadata
  createdAt: integer('created_at').notNull(),
})

export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert
export type UserStreaks = typeof userStreaks.$inferSelect
export type NewUserStreaks = typeof userStreaks.$inferInsert
export type StudyActivity = typeof studyActivity.$inferSelect
export type NewStudyActivity = typeof studyActivity.$inferInsert