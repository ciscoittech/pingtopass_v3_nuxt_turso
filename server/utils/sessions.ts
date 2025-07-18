import { useDB } from './db'
import { studySessions, testSessions, questions, exams } from '../database/schema'
import { eq, and, inArray, desc, sql } from 'drizzle-orm'
import { generateId } from './id'
import type { StudyAnswer } from '../database/schema/studySessions'
import type { TestAnswer } from '../database/schema/testSessions'

// Session Status Types
export const STUDY_SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
} as const

export const TEST_SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
  ABANDONED: 'abandoned'
} as const

export const STUDY_MODE = {
  SEQUENTIAL: 'sequential',
  RANDOM: 'random',
  FLAGGED: 'flagged',
  INCORRECT: 'incorrect',
  WEAK_AREAS: 'weak_areas'
} as const

// Type definitions
export type StudySessionStatus = typeof STUDY_SESSION_STATUS[keyof typeof STUDY_SESSION_STATUS]
export type TestSessionStatus = typeof TEST_SESSION_STATUS[keyof typeof TEST_SESSION_STATUS]
export type StudyMode = typeof STUDY_MODE[keyof typeof STUDY_MODE]

interface CreateStudySessionParams {
  userId: string
  examId: string
  mode?: StudyMode
  questionIds: string[]
  maxQuestions?: number
  showExplanations?: boolean
  showTimer?: boolean
  autoAdvance?: boolean
}

interface CreateTestSessionParams {
  userId: string
  examId: string
  questionIds: string[]
  timeLimitSeconds: number
  passingScore: number
}

// Study Session Services
export const studySessionService = {
  // Create a new study session
  async create(params: CreateStudySessionParams) {
    console.log('[StudySessionService] create called with params:', JSON.stringify(params, null, 2))
    console.log('[StudySessionService] params type:', typeof params)
    console.log('[StudySessionService] params keys:', Object.keys(params))
    console.log('[StudySessionService] questionIds type:', typeof params.questionIds)
    console.log('[StudySessionService] questionIds is array:', Array.isArray(params.questionIds))
    console.log('[StudySessionService] questionIds:', params.questionIds)
    
    const db = useDB()
    const sessionId = generateId('study')
    const now = Math.floor(Date.now() / 1000)
    
    // Ensure questionIds is an array
    if (!params.questionIds) {
      console.error('[StudySessionService] questionIds is undefined or null')
      throw new Error('questionIds is required')
    }
    
    if (!Array.isArray(params.questionIds)) {
      console.error('[StudySessionService] questionIds is not an array:', params.questionIds)
      console.error('[StudySessionService] questionIds type:', typeof params.questionIds)
      console.error('[StudySessionService] questionIds constructor:', params.questionIds?.constructor?.name)
      
      // Check if it's a string that should be parsed
      if (typeof params.questionIds === 'string') {
        try {
          const parsed = JSON.parse(params.questionIds)
          if (Array.isArray(parsed)) {
            console.log('[StudySessionService] Parsed questionIds from string:', parsed)
            params.questionIds = parsed
          } else {
            throw new Error('Parsed questionIds is not an array')
          }
        } catch (e) {
          throw new Error(`questionIds is a string but not valid JSON: ${e}`)
        }
      } else {
        throw new Error(`questionIds must be an array, got ${typeof params.questionIds}`)
      }
    }
    
    // Apply question limit if specified
    let selectedQuestions = params.questionIds
    try {
      if (params.maxQuestions && params.maxQuestions < params.questionIds.length) {
        selectedQuestions = params.questionIds.slice(0, params.maxQuestions)
      }
    } catch (e: any) {
      console.error('[StudySessionService] Error applying question limit:', e)
      console.error('[StudySessionService] params.questionIds:', params.questionIds)
      console.error('[StudySessionService] params.maxQuestions:', params.maxQuestions)
      throw new Error(`Failed to apply question limit: ${e.message}`)
    }
    
    // Randomize if mode is random
    if (params.mode === STUDY_MODE.RANDOM) {
      try {
        selectedQuestions = [...selectedQuestions].sort(() => Math.random() - 0.5)
      } catch (e: any) {
        console.error('[StudySessionService] Error randomizing questions:', e)
        console.error('[StudySessionService] selectedQuestions at error:', selectedQuestions)
        throw new Error(`Failed to randomize questions: ${e.message}`)
      }
    }
    
    // Final validation before insert
    if (!Array.isArray(selectedQuestions)) {
      console.error('[StudySessionService] selectedQuestions is not an array before insert:', selectedQuestions)
      throw new Error('selectedQuestions must be an array before database insert')
    }
    
    let questionsOrderJson
    try {
      questionsOrderJson = JSON.stringify(selectedQuestions)
    } catch (e: any) {
      console.error('[StudySessionService] Failed to stringify selectedQuestions:', e)
      console.error('[StudySessionService] selectedQuestions value:', selectedQuestions)
      throw new Error(`Failed to serialize questions: ${e.message}`)
    }
    
    const session = await db.insert(studySessions).values({
      id: sessionId,
      userId: params.userId,
      examId: params.examId,
      status: STUDY_SESSION_STATUS.ACTIVE,
      mode: params.mode || STUDY_MODE.SEQUENTIAL,
      currentQuestionIndex: 0,
      totalQuestions: selectedQuestions.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedAnswers: 0,
      questionsOrder: questionsOrderJson,
      answers: '{}',
      bookmarks: '[]',
      flags: '[]',
      startedAt: now,
      lastActivityAt: now,
      timeSpentSeconds: 0,
      showExplanations: params.showExplanations !== false ? 1 : 0,
      showTimer: params.showTimer !== false ? 1 : 0,
      autoAdvance: params.autoAdvance ? 1 : 0,
      createdAt: now,
      updatedAt: now
    }).returning().get()
    
    return session
  },

  // Get active session for user
  async getActive(userId: string, examId?: string) {
    const db = useDB()
    
    const conditions = [
      eq(studySessions.userId, userId),
      eq(studySessions.status, STUDY_SESSION_STATUS.ACTIVE)
    ]
    
    if (examId) {
      conditions.push(eq(studySessions.examId, examId))
    }
    
    return db
      .select()
      .from(studySessions)
      .where(and(...conditions))
      .orderBy(desc(studySessions.lastActivityAt))
      .get()
  },

  // Get session by ID
  async getById(sessionId: string) {
    const db = useDB()
    return db
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, sessionId))
      .get()
  },

  // Update session progress
  async updateProgress(sessionId: string, updates: {
    currentQuestionIndex?: number
    answers?: Record<string, StudyAnswer>
    correctAnswers?: number
    incorrectAnswers?: number
    skippedAnswers?: number
    bookmarks?: string[]
    flags?: string[]
    timeSpentSeconds?: number
  }) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    const updateData: any = {
      lastActivityAt: now,
      updatedAt: now
    }
    
    if (updates.currentQuestionIndex !== undefined) {
      updateData.currentQuestionIndex = updates.currentQuestionIndex
    }
    if (updates.answers) {
      updateData.answers = JSON.stringify(updates.answers)
    }
    if (updates.correctAnswers !== undefined) {
      updateData.correctAnswers = updates.correctAnswers
    }
    if (updates.incorrectAnswers !== undefined) {
      updateData.incorrectAnswers = updates.incorrectAnswers
    }
    if (updates.skippedAnswers !== undefined) {
      updateData.skippedAnswers = updates.skippedAnswers
    }
    if (updates.bookmarks) {
      updateData.bookmarks = JSON.stringify(updates.bookmarks)
    }
    if (updates.flags) {
      updateData.flags = JSON.stringify(updates.flags)
    }
    if (updates.timeSpentSeconds !== undefined) {
      updateData.timeSpentSeconds = updates.timeSpentSeconds
    }
    
    return db
      .update(studySessions)
      .set(updateData)
      .where(eq(studySessions.id, sessionId))
      .returning()
      .get()
  },

  // Complete session
  async complete(sessionId: string) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    return db
      .update(studySessions)
      .set({
        status: STUDY_SESSION_STATUS.COMPLETED,
        completedAt: now,
        lastActivityAt: now,
        updatedAt: now
      })
      .where(eq(studySessions.id, sessionId))
      .returning()
      .get()
  },

  // Abandon session
  async abandon(sessionId: string) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    return db
      .update(studySessions)
      .set({
        status: STUDY_SESSION_STATUS.ABANDONED,
        lastActivityAt: now,
        updatedAt: now
      })
      .where(eq(studySessions.id, sessionId))
      .returning()
      .get()
  },

  // Get questions for session
  async getQuestions(sessionId: string) {
    console.log('[StudySession.getQuestions] Called with sessionId:', sessionId)
    const db = useDB()
    const session = await this.getById(sessionId)
    
    if (!session) {
      throw new Error('Session not found')
    }
    
    let questionIds: string[] = []
    try {
      const parsed = JSON.parse(session.questionsOrder)
      console.log('[StudySession.getQuestions] Parsed questionsOrder:', parsed)
      console.log('[StudySession.getQuestions] Is array?', Array.isArray(parsed))
      
      if (Array.isArray(parsed)) {
        questionIds = parsed
      } else {
        console.error('[StudySession.getQuestions] questionsOrder is not an array:', parsed)
        return []
      }
    } catch (e) {
      console.error('[StudySession.getQuestions] Failed to parse questionsOrder:', session.questionsOrder, e)
      return []
    }
    
    if (questionIds.length === 0) {
      console.log('[StudySession.getQuestions] No question IDs found')
      return []
    }
    
    console.log('[StudySession.getQuestions] Question IDs to fetch:', questionIds)
    const questionsData = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds))
    
    console.log('[StudySession.getQuestions] Questions fetched from DB:', questionsData.length)
    
    // Return in the order specified by the session
    const questionMap = new Map(questionsData.map(q => [q.id, q]))
    
    // Add validation before map
    if (!Array.isArray(questionIds)) {
      console.error('[StudySession.getQuestions] questionIds is not an array before final map:', questionIds)
      throw new Error('questionIds is not an array')
    }
    
    const result = questionIds.map(id => questionMap.get(id)).filter(Boolean)
    console.log('[StudySession.getQuestions] Returning questions:', result.length)
    return result
  },

  // Get all sessions for a user
  async getAllForUser(userId: string, examId?: string) {
    const db = useDB()
    
    const conditions = [eq(studySessions.userId, userId)]
    if (examId) {
      conditions.push(eq(studySessions.examId, examId))
    }
    
    return db
      .select()
      .from(studySessions)
      .where(and(...conditions))
      .orderBy(desc(studySessions.startedAt))
  }
}

// Test Session Services
export const testSessionService = {
  // Create a new test session
  async create(params: CreateTestSessionParams) {
    const db = useDB()
    const sessionId = generateId('test')
    const now = Math.floor(Date.now() / 1000)
    
    // Randomize questions for test
    const randomizedQuestions = [...params.questionIds].sort(() => Math.random() - 0.5)
    
    const session = await db.insert(testSessions).values({
      id: sessionId,
      userId: params.userId,
      examId: params.examId,
      status: TEST_SESSION_STATUS.ACTIVE,
      timeLimitSeconds: params.timeLimitSeconds,
      totalQuestions: randomizedQuestions.length,
      passingScore: params.passingScore,
      currentQuestionIndex: 0,
      answeredCount: 0,
      flaggedCount: 0,
      questionsOrder: JSON.stringify(randomizedQuestions),
      answers: '{}',
      flagged: '[]',
      startedAt: now,
      lastActivityAt: now,
      timeRemainingSeconds: params.timeLimitSeconds,
      autoSaveCount: 0,
      createdAt: now,
      updatedAt: now
    }).returning().get()
    
    return session
  },

  // Get active session for user
  async getActive(userId: string, examId?: string) {
    const db = useDB()
    
    const conditions = [
      eq(testSessions.userId, userId),
      eq(testSessions.status, TEST_SESSION_STATUS.ACTIVE)
    ]
    
    if (examId) {
      conditions.push(eq(testSessions.examId, examId))
    }
    
    return db
      .select()
      .from(testSessions)
      .where(and(...conditions))
      .orderBy(desc(testSessions.lastActivityAt))
      .get()
  },

  // Get session by ID
  async getById(sessionId: string) {
    const db = useDB()
    return db
      .select()
      .from(testSessions)
      .where(eq(testSessions.id, sessionId))
      .get()
  },

  // Update session progress (auto-save)
  async updateProgress(sessionId: string, updates: {
    currentQuestionIndex?: number
    answers?: Record<string, any>
    flag?: { questionId: string; questionIndex: number; flagged: boolean }
    lastActivityAt?: number
  }) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    // Get current session to update counts
    const session = await this.getById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }
    
    const updateData: any = {
      lastActivityAt: updates.lastActivityAt || now,
      lastAutoSaveAt: now,
      autoSaveCount: session.autoSaveCount + 1,
      updatedAt: now
    }
    
    if (updates.currentQuestionIndex !== undefined) {
      updateData.currentQuestionIndex = updates.currentQuestionIndex
    }
    
    if (updates.answers) {
      updateData.answers = JSON.stringify(updates.answers)
      updateData.answeredCount = Object.keys(updates.answers).length
    }
    
    if (updates.flag) {
      // Parse existing flags
      const flags = session.flags ? JSON.parse(session.flags) : []
      const { questionId, flagged } = updates.flag
      
      if (flagged && !flags.includes(questionId)) {
        flags.push(questionId)
      } else if (!flagged && flags.includes(questionId)) {
        const index = flags.indexOf(questionId)
        flags.splice(index, 1)
      }
      
      updateData.flags = JSON.stringify(flags)
      updateData.flaggedCount = flags.length
    }
    
    return db
      .update(testSessions)
      .set(updateData)
      .where(eq(testSessions.id, sessionId))
      .returning()
      .get()
  },

  // Submit test for scoring
  async submit(sessionId: string) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    // Get session with questions
    const session = await this.getById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }
    
    // Get questions for scoring
    let questionIds: string[] = []
    try {
      const parsed = JSON.parse(session.questionsOrder)
      if (Array.isArray(parsed)) {
        questionIds = parsed
      } else {
        console.error('[TestSession] questionsOrder is not an array:', parsed)
        throw new Error('Invalid session data')
      }
    } catch (e) {
      console.error('[TestSession] Failed to parse questionsOrder:', session.questionsOrder, e)
      throw new Error('Invalid session data')
    }
    const userAnswers = JSON.parse(session.answers) as Record<number, number[]>
    
    const questionsData = await db
      .select({
        id: questions.id,
        correctAnswer: questions.correctAnswer
      })
      .from(questions)
      .where(inArray(questions.id, questionIds))
    
    // Calculate score
    let correctCount = 0
    let incorrectCount = 0
    let unansweredCount = 0
    
    questionIds.forEach((qId, index) => {
      const question = questionsData.find(q => q.id === qId)
      if (!question) return
      
      const userAnswer = userAnswers[index]
      if (!userAnswer || userAnswer.length === 0) {
        unansweredCount++
        return
      }
      
      try {
        const correctAnswers = JSON.parse(question.correctAnswer) as number[]
        const isCorrect = 
          userAnswer.length === correctAnswers.length &&
          userAnswer.every(a => correctAnswers.includes(a)) &&
          correctAnswers.every(a => userAnswer.includes(a))
        
        if (isCorrect) {
          correctCount++
        } else {
          incorrectCount++
        }
      } catch (e) {
        incorrectCount++
      }
    })
    
    const score = (correctCount / questionIds.length) * 100
    const passed = score >= session.passingScore
    
    return db
      .update(testSessions)
      .set({
        status: TEST_SESSION_STATUS.SUBMITTED,
        submittedAt: now,
        score,
        correctCount,
        incorrectCount,
        unansweredCount,
        passed: passed ? 1 : 0,
        lastActivityAt: now,
        updatedAt: now
      })
      .where(eq(testSessions.id, sessionId))
      .returning()
      .get()
  },

  // Expire session
  async expire(sessionId: string) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    // Auto-submit before expiring
    await this.submit(sessionId)
    
    return db
      .update(testSessions)
      .set({
        status: TEST_SESSION_STATUS.EXPIRED,
        lastActivityAt: now,
        updatedAt: now
      })
      .where(eq(testSessions.id, sessionId))
      .returning()
      .get()
  },

  // Get questions for session (without answers for security)
  async getQuestions(sessionId: string) {
    console.log('[TestSession.getQuestions] Called with sessionId:', sessionId)
    const db = useDB()
    const session = await this.getById(sessionId)
    
    if (!session) {
      throw new Error('Session not found')
    }
    
    let questionIds: string[] = []
    try {
      const parsed = JSON.parse(session.questionsOrder)
      console.log('[TestSession.getQuestions] Parsed questionsOrder:', parsed)
      console.log('[TestSession.getQuestions] Is array?', Array.isArray(parsed))
      
      if (Array.isArray(parsed)) {
        questionIds = parsed
      } else {
        console.error('[TestSession.getQuestions] questionsOrder is not an array:', parsed)
        return []
      }
    } catch (e) {
      console.error('[TestSession.getQuestions] Failed to parse questionsOrder:', session.questionsOrder, e)
      return []
    }
    
    if (questionIds.length === 0) {
      console.log('[TestSession.getQuestions] No question IDs found')
      return []
    }
    
    const questionsData = await db
      .select({
        id: questions.id,
        examId: questions.examId,
        questionText: questions.questionText,
        questionType: questions.questionType,
        options: questions.options,
        codeBlock: questions.codeBlock,
        // Don't include correctAnswer or explanation for test mode
      })
      .from(questions)
      .where(inArray(questions.id, questionIds))
    
    console.log('[TestSession.getQuestions] Questions fetched from DB:', questionsData.length)
    
    // Return in the order specified by the session
    const questionMap = new Map(questionsData.map(q => [q.id, q]))
    
    // Add validation before map
    if (!Array.isArray(questionIds)) {
      console.error('[TestSession.getQuestions] questionIds is not an array before final map:', questionIds)
      throw new Error('questionIds is not an array')
    }
    
    const result = questionIds.map(id => questionMap.get(id)).filter(Boolean)
    console.log('[TestSession.getQuestions] Returning questions:', result.length)
    return result
  },

  // Save individual answer
  async saveAnswer(sessionId: string, answer: {
    questionId: string
    questionIndex: number
    selectedAnswers: number[]
    timeSpent?: number
  }) {
    const db = useDB()
    const session = await this.getById(sessionId)
    
    if (!session) {
      throw new Error('Session not found')
    }
    
    // Parse existing answers
    const answers = session.answers ? JSON.parse(session.answers) : {}
    
    // Update answer
    answers[answer.questionId] = {
      selectedAnswers: answer.selectedAnswers,
      timeSpent: answer.timeSpent || 0,
      answeredAt: new Date().toISOString()
    }
    
    // Update session
    return this.updateProgress(sessionId, {
      answers: answers
    })
  },

  // Update final score (used after submit)
  async updateScore(sessionId: string, scoreData: {
    score: number
    correctCount: number
    incorrectCount: number
    unansweredCount: number
    timeSpentSeconds: number
  }) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    return db
      .update(testSessions)
      .set({
        score: scoreData.score,
        correctCount: scoreData.correctCount,
        incorrectCount: scoreData.incorrectCount,
        unansweredCount: scoreData.unansweredCount,
        timeSpentSeconds: scoreData.timeSpentSeconds,
        updatedAt: now
      })
      .where(eq(testSessions.id, sessionId))
      .returning()
      .get()
  },

  // Get test results (for already submitted tests)
  async getResults(sessionId: string) {
    const db = useDB()
    const session = await this.getById(sessionId)
    
    if (!session) {
      throw new Error('Session not found')
    }
    
    if (session.status !== 'submitted') {
      throw new Error('Test has not been submitted yet')
    }
    
    return {
      session,
      results: {
        score: session.score,
        passed: session.passed === 1,
        correctCount: session.correctCount,
        incorrectCount: session.incorrectCount,
        unansweredCount: session.unansweredCount,
        totalQuestions: session.totalQuestions,
        passingScore: session.passingScore,
        timeSpent: session.timeSpentSeconds
      }
    }
  },

  // Get user's test history with pagination
  async getUserHistory(userId: string, options: {
    page?: number
    limit?: number
    examId?: string
    includeDetails?: boolean
  } = {}) {
    const db = useDB()
    const { page = 1, limit = 20, examId, includeDetails = false } = options
    const offset = (page - 1) * limit
    
    // Build base query conditions
    const conditions = [eq(testSessions.userId, userId)]
    if (examId) {
      conditions.push(eq(testSessions.examId, examId))
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(testSessions)
      .where(and(...conditions))
      .get()
    
    const total = totalResult?.count || 0
    
    // Get sessions with pagination - join with exams to get exam details
    let query = db
      .select({
        id: testSessions.id,
        examId: testSessions.examId,
        examCode: exams.code,
        examName: exams.name,
        status: testSessions.status,
        score: testSessions.score,
        correctCount: testSessions.correctCount,
        incorrectCount: testSessions.incorrectCount,
        unansweredCount: testSessions.unansweredCount,
        totalQuestions: testSessions.totalQuestions,
        passingScore: testSessions.passingScore,
        timeSpentSeconds: sql<number>`${testSessions.submittedAt} - ${testSessions.startedAt}`,
        startedAt: testSessions.startedAt,
        submittedAt: testSessions.submittedAt,
        createdAt: testSessions.createdAt
      })
      .from(testSessions)
      .leftJoin(exams, eq(testSessions.examId, exams.id))
      .where(and(...conditions))
      .orderBy(desc(testSessions.startedAt))
      .limit(limit)
      .offset(offset)
    
    if (includeDetails) {
      query = db
        .select()
        .from(testSessions)
        .where(and(...conditions))
        .orderBy(desc(testSessions.startedAt))
        .limit(limit)
        .offset(offset)
    }
    
    const sessions = await query
    
    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Helper to check if session can be resumed
export function canResumeSession(session: any): boolean {
  if (!session) return false
  
  const now = Math.floor(Date.now() / 1000)
  const inactiveTime = now - session.lastActivityAt
  
  // Allow resume if inactive for less than 24 hours
  return inactiveTime < 24 * 60 * 60
}

// Helper to calculate time spent
export function calculateTimeSpent(startedAt: number, lastActivityAt?: number): number {
  const endTime = lastActivityAt || Math.floor(Date.now() / 1000)
  return endTime - startedAt
}