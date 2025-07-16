import { z } from 'zod'

// Common schemas
export const sessionIdSchema = z.string().regex(/^(study|test)_[a-zA-Z0-9_-]+$/, 'Invalid session ID format')

export const questionIdSchema = z.string().regex(/^q_[a-zA-Z0-9_-]+$/, 'Invalid question ID format')

export const examIdSchema = z.string().regex(/^exam_[a-zA-Z0-9_-]+$/, 'Invalid exam ID format')

// Study session schemas
export const studyModeSchema = z.enum(['sequential', 'random', 'flagged', 'incorrect', 'weak_areas'])

export const studyAnswerSchema = z.object({
  questionId: questionIdSchema,
  selectedAnswers: z.array(z.number().min(0).max(10)),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0),
  answeredAt: z.string().datetime().optional()
})

export const startStudySessionSchema = z.object({
  examId: examIdSchema,
  mode: studyModeSchema.optional().default('sequential'),
  maxQuestions: z.number().min(1).max(500).optional(),
  objectiveIds: z.array(z.string()).optional(),
  showExplanations: z.boolean().optional().default(true),
  showTimer: z.boolean().optional().default(true),
  autoAdvance: z.boolean().optional().default(false)
})

export const updateStudySessionSchema = z.object({
  currentQuestionIndex: z.number().min(0).optional(),
  answer: studyAnswerSchema.optional(),
  bookmark: z.object({
    questionId: questionIdSchema,
    action: z.enum(['add', 'remove'])
  }).optional(),
  flag: z.object({
    questionId: questionIdSchema,
    action: z.enum(['add', 'remove'])
  }).optional(),
  timeSpentSeconds: z.number().min(0).optional()
})

export const endStudySessionSchema = z.object({
  action: z.enum(['complete', 'abandon']).default('complete')
})

// Test session schemas
export const testAnswerSchema = z.object({
  questionIndex: z.number().min(0),
  selectedAnswers: z.array(z.number().min(0).max(10))
})

export const startTestSessionSchema = z.object({
  examId: examIdSchema,
  timeLimitMinutes: z.number().min(1).max(360).optional(),
  maxQuestions: z.number().min(1).max(200).optional()
})

export const updateTestSessionSchema = z.object({
  currentQuestionIndex: z.number().min(0).optional(),
  answer: testAnswerSchema.optional(),
  flag: z.object({
    questionIndex: z.number().min(0),
    flagged: z.boolean()
  }).optional(),
  timeRemainingSeconds: z.number().min(0).optional()
})

// Response schemas for type safety
export const sessionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    session: z.any(), // Would be more specific in production
    questions: z.array(z.any()).optional(),
    isResuming: z.boolean().optional(),
    statistics: z.any().optional(),
    results: z.any().optional()
  })
})

// Error response schema
export const errorResponseSchema = z.object({
  statusCode: z.number(),
  statusMessage: z.string(),
  data: z.any().optional()
})

// Helper functions
export function validateSessionId(id: string): boolean {
  try {
    sessionIdSchema.parse(id)
    return true
  } catch {
    return false
  }
}

export function validateQuestionId(id: string): boolean {
  try {
    questionIdSchema.parse(id)
    return true
  } catch {
    return false
  }
}

export function validateExamId(id: string): boolean {
  try {
    examIdSchema.parse(id)
    return true
  } catch {
    return false
  }
}