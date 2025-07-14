import { useDB } from './db'
import { users, exams, questions, userProgress, testSessions } from '../database/schema'
import { eq, sql, desc, and, gte } from 'drizzle-orm'

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

// Tool definitions for MCP (Model Context Protocol)
export const adminTools = {
  getUserStats: {
    name: 'getUserStats',
    description: 'Get statistics about a specific user or all users',
    parameters: {
      userId: { type: 'string', required: false, description: 'Optional user ID to get stats for specific user' }
    },
    execute: async (params: { userId?: string }): Promise<ToolResult> => {
      try {
        const db = useDB()
        
        if (params.userId) {
          // Get specific user stats
          const user = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              createdAt: users.createdAt,
              totalProgress: sql<number>`(
                SELECT COUNT(DISTINCT exam_id) 
                FROM user_progress 
                WHERE user_id = ${params.userId}
              )`,
              totalTests: sql<number>`(
                SELECT COUNT(*) 
                FROM test_sessions 
                WHERE user_id = ${params.userId}
              )`,
              avgScore: sql<number>`(
                SELECT AVG(score) 
                FROM test_sessions 
                WHERE user_id = ${params.userId} AND status = 'completed'
              )`
            })
            .from(users)
            .where(eq(users.id, params.userId))
            .then(rows => rows[0])

          return { success: true, data: user }
        } else {
          // Get overall stats
          const stats = await db
            .select({
              totalUsers: sql<number>`COUNT(DISTINCT id)`,
              activeUsers: sql<number>`COUNT(DISTINCT CASE WHEN last_seen > datetime('now', '-7 days') THEN id END)`,
              totalTests: sql<number>`(SELECT COUNT(*) FROM test_sessions)`,
              avgScore: sql<number>`(SELECT AVG(score) FROM test_sessions WHERE status = 'completed')`
            })
            .from(users)
            .then(rows => rows[0])

          return { success: true, data: stats }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  },

  getExamAnalytics: {
    name: 'getExamAnalytics',
    description: 'Get analytics for exams including popularity and performance',
    parameters: {
      examId: { type: 'string', required: false, description: 'Optional exam ID for specific exam' },
      limit: { type: 'number', required: false, description: 'Number of results to return' }
    },
    execute: async (params: { examId?: string; limit?: number }): Promise<ToolResult> => {
      try {
        const db = useDB()
        const limit = params.limit || 10

        if (params.examId) {
          // Get specific exam analytics
          const analytics = await db
            .select({
              examId: exams.id,
              examName: exams.name,
              totalAttempts: sql<number>`(
                SELECT COUNT(*) 
                FROM test_sessions 
                WHERE exam_id = ${params.examId}
              )`,
              avgScore: sql<number>`(
                SELECT AVG(score) 
                FROM test_sessions 
                WHERE exam_id = ${params.examId} AND status = 'completed'
              )`,
              passRate: sql<number>`(
                SELECT CAST(COUNT(CASE WHEN score >= passing_score THEN 1 END) AS FLOAT) / 
                       COUNT(*) * 100
                FROM test_sessions 
                WHERE exam_id = ${params.examId} AND status = 'completed'
              )`,
              totalQuestions: sql<number>`(
                SELECT COUNT(*) 
                FROM questions 
                WHERE exam_id = ${params.examId}
              )`
            })
            .from(exams)
            .where(eq(exams.id, params.examId))
            .then(rows => rows[0])

          return { success: true, data: analytics }
        } else {
          // Get top exams by popularity
          const topExams = await db
            .select({
              examId: exams.id,
              examName: exams.name,
              attempts: sql<number>`(
                SELECT COUNT(*) 
                FROM test_sessions 
                WHERE exam_id = exams.id
              )`
            })
            .from(exams)
            .orderBy(desc(sql`attempts`))
            .limit(limit)

          return { success: true, data: topExams }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  },

  searchQuestions: {
    name: 'searchQuestions',
    description: 'Search questions by content or filters',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
      examId: { type: 'string', required: false, description: 'Filter by exam' },
      difficulty: { type: 'string', required: false, description: 'Filter by difficulty' }
    },
    execute: async (params: { query: string; examId?: string; difficulty?: string }): Promise<ToolResult> => {
      try {
        const db = useDB()
        
        let conditions = sql`question_text LIKE ${'%' + params.query + '%'}`
        
        if (params.examId) {
          conditions = and(conditions, eq(questions.examId, params.examId))!
        }
        
        if (params.difficulty) {
          conditions = and(conditions, eq(questions.difficulty, params.difficulty))!
        }

        const results = await db
          .select({
            id: questions.id,
            questionText: questions.questionText,
            examId: questions.examId,
            difficulty: questions.difficulty,
            correctAnswer: questions.correctAnswer
          })
          .from(questions)
          .where(conditions)
          .limit(20)

        return { success: true, data: results }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  },

  getRecentActivity: {
    name: 'getRecentActivity',
    description: 'Get recent activity across the platform',
    parameters: {
      type: { type: 'string', required: false, description: 'Activity type: tests, registrations, progress' },
      days: { type: 'number', required: false, description: 'Number of days to look back' }
    },
    execute: async (params: { type?: string; days?: number }): Promise<ToolResult> => {
      try {
        const db = useDB()
        const days = params.days || 7
        const dateLimit = sql`datetime('now', '-${days} days')`

        if (params.type === 'tests') {
          const recentTests = await db
            .select({
              userId: testSessions.userId,
              examId: testSessions.examId,
              score: testSessions.score,
              startedAt: testSessions.startedAt,
              completedAt: testSessions.completedAt
            })
            .from(testSessions)
            .where(gte(testSessions.startedAt, dateLimit))
            .orderBy(desc(testSessions.startedAt))
            .limit(50)

          return { success: true, data: recentTests }
        } else if (params.type === 'registrations') {
          const newUsers = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              createdAt: users.createdAt
            })
            .from(users)
            .where(gte(users.createdAt, dateLimit))
            .orderBy(desc(users.createdAt))
            .limit(50)

          return { success: true, data: newUsers }
        } else {
          // Get summary of all activity
          const summary = {
            newUsers: await db
              .select({ count: sql<number>`COUNT(*)` })
              .from(users)
              .where(gte(users.createdAt, dateLimit))
              .then(r => r[0].count),
            testsCompleted: await db
              .select({ count: sql<number>`COUNT(*)` })
              .from(testSessions)
              .where(and(
                gte(testSessions.startedAt, dateLimit),
                eq(testSessions.status, 'completed')
              ))
              .then(r => r[0].count),
            studySessions: await db
              .select({ count: sql<number>`COUNT(DISTINCT user_id || date(created_at))` })
              .from(userProgress)
              .where(gte(userProgress.createdAt, dateLimit))
              .then(r => r[0].count)
          }

          return { success: true, data: summary }
        }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  },

  getDatabaseStats: {
    name: 'getDatabaseStats',
    description: 'Get database statistics and counts',
    parameters: {},
    execute: async (): Promise<ToolResult> => {
      try {
        const db = useDB()
        
        const stats = {
          users: await db.select({ count: sql<number>`COUNT(*)` }).from(users).then(r => r[0].count),
          exams: await db.select({ count: sql<number>`COUNT(*)` }).from(exams).then(r => r[0].count),
          questions: await db.select({ count: sql<number>`COUNT(*)` }).from(questions).then(r => r[0].count),
          testSessions: await db.select({ count: sql<number>`COUNT(*)` }).from(testSessions).then(r => r[0].count),
          progressRecords: await db.select({ count: sql<number>`COUNT(*)` }).from(userProgress).then(r => r[0].count)
        }

        return { success: true, data: stats }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  }
}

// Get tool definitions for the AI
export function getToolDefinitions() {
  return Object.entries(adminTools).map(([name, tool]) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }))
}

// Execute a tool by name
export async function executeTool(toolName: string, parameters: any): Promise<ToolResult> {
  const tool = adminTools[toolName as keyof typeof adminTools]
  if (!tool) {
    return { success: false, error: `Tool ${toolName} not found` }
  }
  
  return await tool.execute(parameters)
}