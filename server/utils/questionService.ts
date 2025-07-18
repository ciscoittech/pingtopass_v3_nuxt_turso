import { useDB, useDBClient } from './db'
import { questions, objectives, exams, studySessions, testSessions } from '../database/schema'
import { eq, and, inArray, sql, or, exists } from 'drizzle-orm'

export interface QuestionWithMetadata {
  id: string
  examId: string
  objectiveId: string | null
  questionText: string
  questionType: string
  options: string[]
  correctAnswers?: number[] // Only included in study mode
  explanation?: string // Only included in study mode
  isActive: boolean
  objectiveTitle?: string
  codeBlock?: string
  resources?: Array<{ title: string; url: string }>
}

export const questionService = {
  // Get questions for a session
  async getQuestionsForSession(
    examId: string,
    mode: 'study' | 'test',
    options: {
      maxQuestions?: number
      objectiveIds?: string[]
      shuffleQuestions?: boolean
      shuffleOptions?: boolean
    } = {}
  ): Promise<QuestionWithMetadata[]> {
    const db = useDB()
    const { maxQuestions, objectiveIds, shuffleQuestions = true, shuffleOptions = false } = options
    
    console.log('[QuestionService] getQuestionsForSession called with:', {
      examId,
      mode,
      options
    })

    // Build raw SQL query to handle column names properly
    let sql = `
      SELECT 
        q.id,
        q.exam_id,
        q.objective_id,
        q.question_text,
        q.question_type,
        q.options,
        q.correct_answer,
        q.explanation,
        q.is_active,
        o.title as objective_title
      FROM questions q
      LEFT JOIN objectives o ON q.objective_id = o.id
      WHERE q.exam_id = ? AND q.is_active = 1
    `
    
    const args: any[] = [examId]
    
    if (objectiveIds && objectiveIds.length > 0) {
      const placeholders = objectiveIds.map(() => '?').join(',')
      sql += ` AND q.objective_id IN (${placeholders})`
      args.push(...objectiveIds)
    }
    
    // Execute raw query
    const client = useDBClient()
    const result = await client.execute({ sql, args })
    const questionResults = result.rows
    
    console.log('[QuestionService] Raw query results count:', questionResults.length)

    // Transform questions
    let transformedQuestions = questionResults.map((row: any) => {
      const baseQuestion: QuestionWithMetadata = {
        id: row.id as string,
        examId: row.exam_id as string,
        objectiveId: row.objective_id as string | null,
        questionText: row.question_text as string,
        questionType: row.question_type as string,
        options: row.options ? JSON.parse(row.options as string) : [],
        isActive: Boolean(row.is_active),
        objectiveTitle: row.objective_title as string | undefined
      }

      // Include answers and explanations only in study mode
      if (mode === 'study') {
        // Parse correct_answer and ensure it's an array for compatibility
        try {
          const correctAnswer = row.correct_answer ? JSON.parse(row.correct_answer as string) : null
          if (correctAnswer !== null) {
            baseQuestion.correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
          } else {
            console.warn('[QuestionService] No correct answer for question:', row.id)
            baseQuestion.correctAnswers = []
          }
        } catch (e) {
          console.error('[QuestionService] Failed to parse correct_answer:', row.correct_answer, e)
          baseQuestion.correctAnswers = []
        }
        baseQuestion.explanation = row.explanation as string || undefined
      }

      // Extract code blocks from question text
      const codeBlockMatch = baseQuestion.questionText.match(/```[\s\S]*?```/g)
      if (codeBlockMatch) {
        baseQuestion.codeBlock = codeBlockMatch[0].replace(/```/g, '').trim()
      }

      return baseQuestion
    })

    // Shuffle questions if requested
    if (shuffleQuestions) {
      transformedQuestions = this.shuffleArray(transformedQuestions)
    }

    // Shuffle options if requested (test mode only)
    if (shuffleOptions && mode === 'test') {
      transformedQuestions = transformedQuestions.map(q => {
        if (q.questionType === 'multiple-choice' && q.options.length > 0) {
          // Create a mapping of original to shuffled indices
          const indices = q.options.map((_, i) => i)
          const shuffledIndices = this.shuffleArray([...indices])
          
          // Reorder options
          const shuffledOptions = shuffledIndices.map(i => q.options[i])
          
          return {
            ...q,
            options: shuffledOptions,
            _optionMapping: shuffledIndices // Store mapping for answer validation
          }
        }
        return q
      })
    }

    // Apply max questions limit
    if (maxQuestions && maxQuestions > 0) {
      transformedQuestions = transformedQuestions.slice(0, maxQuestions)
    }
    
    console.log('[QuestionService] Returning questions:', {
      count: transformedQuestions.length,
      firstQuestion: transformedQuestions[0]?.id,
      mode
    })

    return transformedQuestions
  },

  // Get question by ID
  async getById(questionId: string, includeAnswer: boolean = false): Promise<QuestionWithMetadata | null> {
    const db = useDB()
    const client = useDBClient()

    const result = await client.execute({
      sql: `
        SELECT 
          q.id,
          q.exam_id,
          q.objective_id,
          q.question_text,
          q.question_type,
          q.options,
          q.correct_answer,
          q.explanation,
          q.is_active,
          o.title as objective_title
        FROM questions q
        LEFT JOIN objectives o ON q.objective_id = o.id
        WHERE q.id = ?
      `,
      args: [questionId]
    })

    if (!result.rows.length) {
      return null
    }

    const row = result.rows[0]

    const transformedQuestion: QuestionWithMetadata = {
      id: row.id as string,
      examId: row.exam_id as string,
      objectiveId: row.objective_id as string | null,
      questionText: row.question_text as string,
      questionType: row.question_type as string,
      options: row.options ? JSON.parse(row.options as string) : [],
      isActive: Boolean(row.is_active),
      objectiveTitle: row.objective_title as string | undefined
    }

    if (includeAnswer) {
      // Parse correct_answer and ensure it's an array for compatibility
      const correctAnswer = row.correct_answer ? JSON.parse(row.correct_answer as string) : null
      transformedQuestion.correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
      transformedQuestion.explanation = row.explanation as string || undefined
    }

    return transformedQuestion
  },

  // Get questions by IDs
  async getByIds(questionIds: string[], includeAnswers: boolean = false): Promise<QuestionWithMetadata[]> {
    console.log('[QuestionService.getByIds] Called with:', { questionIds, includeAnswers })
    console.log('[QuestionService.getByIds] Type of questionIds:', typeof questionIds)
    console.log('[QuestionService.getByIds] Is array?', Array.isArray(questionIds))
    
    // Validate input
    if (!questionIds) {
      console.error('[QuestionService.getByIds] questionIds is null/undefined')
      return []
    }
    
    if (!Array.isArray(questionIds)) {
      console.error('[QuestionService.getByIds] questionIds is not an array:', questionIds)
      throw new Error(`getByIds expects an array of IDs, got ${typeof questionIds}`)
    }
    
    if (questionIds.length === 0) {
      console.log('[QuestionService.getByIds] Empty array provided')
      return []
    }

    const db = useDB()
    const client = useDBClient()
    
    // Build placeholders for IN clause
    const placeholders = questionIds.map(() => '?').join(',')
    
    const result = await client.execute({
      sql: `
        SELECT 
          q.id,
          q.exam_id,
          q.objective_id,
          q.question_text,
          q.question_type,
          q.options,
          q.correct_answer,
          q.explanation,
          q.is_active,
          o.title as objective_title
        FROM questions q
        LEFT JOIN objectives o ON q.objective_id = o.id
        WHERE q.id IN (${placeholders})
      `,
      args: questionIds
    })

    // Create a map to preserve order
    const questionMap = new Map<string, QuestionWithMetadata>()

    result.rows.forEach((row: any) => {
      // Parse options safely
      let parsedOptions = []
      try {
        if (row.options) {
          parsedOptions = typeof row.options === 'string' ? JSON.parse(row.options) : row.options
          if (!Array.isArray(parsedOptions)) {
            console.error('[QuestionService.getByIds] Options is not an array after parsing:', parsedOptions)
            parsedOptions = []
          }
        }
      } catch (e) {
        console.error('[QuestionService.getByIds] Failed to parse options:', row.options, e)
        parsedOptions = []
      }
      
      const transformedQuestion: QuestionWithMetadata = {
        id: row.id as string,
        examId: row.exam_id as string,
        objectiveId: row.objective_id as string | null,
        questionText: row.question_text as string,
        questionType: row.question_type as string,
        options: parsedOptions,
        isActive: Boolean(row.is_active),
        objectiveTitle: row.objective_title as string | undefined
      }

      if (includeAnswers) {
        // Parse correct_answer and ensure it's an array for compatibility
        const correctAnswer = row.correct_answer ? JSON.parse(row.correct_answer as string) : null
        transformedQuestion.correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
        transformedQuestion.explanation = row.explanation as string || undefined
      }

      questionMap.set(transformedQuestion.id, transformedQuestion)
    })

    // Return in the same order as requested
    return questionIds
      .map(id => questionMap.get(id))
      .filter((q): q is QuestionWithMetadata => q !== undefined)
  },

  // Validate answer
  validateAnswer(question: QuestionWithMetadata, userAnswer: number[]): boolean {
    if (!question.correctAnswers || question.correctAnswers.length === 0) {
      return false
    }

    // Sort both arrays for comparison
    const correct = [...question.correctAnswers].sort()
    const user = [...userAnswer].sort()

    // Check if arrays are equal
    return correct.length === user.length && 
           correct.every((val, index) => val === user[index])
  },

  // Utility function to shuffle array
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },

  // Get all previously answered questions for a user
  async getAnsweredQuestionsForUser(
    examId: string,
    userId: string,
    options: {
      maxQuestions?: number
      includeAnswers?: boolean
    } = {}
  ): Promise<QuestionWithMetadata[]> {
    const db = useDB()
    const client = useDBClient()
    const { maxQuestions, includeAnswers = true } = options

    // Get unique question IDs from study sessions using raw SQL
    const result = await client.execute({
      sql: 'SELECT answers FROM study_sessions WHERE user_id = ? AND exam_id = ?',
      args: [userId, examId]
    })

    // Extract unique question IDs from all sessions
    const questionIds = new Set<string>()
    result.rows.forEach((row: any) => {
      if (row.answers) {
        const answers = JSON.parse(row.answers as string) as Record<string, any>
        Object.keys(answers).forEach(qId => questionIds.add(qId))
      }
    })

    if (questionIds.size === 0) {
      return []
    }

    // Get the questions
    const questions = await this.getByIds(Array.from(questionIds), includeAnswers)
    
    // Apply limit if requested
    if (maxQuestions && maxQuestions > 0) {
      return questions.slice(0, maxQuestions)
    }

    return questions
  },

  // Get flagged questions for a user
  async getFlaggedQuestionsForUser(
    examId: string,
    userId: string,
    options: {
      maxQuestions?: number
      includeAnswers?: boolean
    } = {}
  ): Promise<QuestionWithMetadata[]> {
    const db = useDB()
    const client = useDBClient()
    const { maxQuestions, includeAnswers = true } = options

    // Get flagged question IDs from study sessions using raw SQL
    const result = await client.execute({
      sql: 'SELECT flags FROM study_sessions WHERE user_id = ? AND exam_id = ?',
      args: [userId, examId]
    })

    // Extract unique flagged question IDs
    const questionIds = new Set<string>()
    result.rows.forEach((row: any) => {
      if (row.flags) {
        const flags = JSON.parse(row.flags as string) as string[]
        flags.forEach(qId => questionIds.add(qId))
      }
    })

    if (questionIds.size === 0) {
      return []
    }

    // Get the questions
    const questions = await this.getByIds(Array.from(questionIds), includeAnswers)
    
    // Apply limit if requested
    if (maxQuestions && maxQuestions > 0) {
      return questions.slice(0, maxQuestions)
    }

    return questions
  },

  // Get incorrectly answered questions for a user
  async getIncorrectQuestionsForUser(
    examId: string,
    userId: string,
    options: {
      maxQuestions?: number
      includeAnswers?: boolean
    } = {}
  ): Promise<QuestionWithMetadata[]> {
    const db = useDB()
    const client = useDBClient()
    const { maxQuestions, includeAnswers = true } = options

    // Get answers from study sessions using raw SQL
    const result = await client.execute({
      sql: 'SELECT answers FROM study_sessions WHERE user_id = ? AND exam_id = ?',
      args: [userId, examId]
    })

    // Extract incorrect question IDs
    const questionIds = new Set<string>()
    result.rows.forEach((row: any) => {
      if (row.answers) {
        const answers = JSON.parse(row.answers as string) as Record<string, any>
        Object.entries(answers).forEach(([qId, answer]) => {
          if (answer && !answer.isCorrect) {
            questionIds.add(qId)
          }
        })
      }
    })

    if (questionIds.size === 0) {
      return []
    }

    // Get the questions
    const questions = await this.getByIds(Array.from(questionIds), includeAnswers)
    
    // Apply limit if requested
    if (maxQuestions && maxQuestions > 0) {
      return questions.slice(0, maxQuestions)
    }

    return questions
  }
}