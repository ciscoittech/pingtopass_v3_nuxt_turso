import { useDB } from '~/server/utils/db'
import { questions } from '~/server/database/schema'
import { generateQuestionId } from '~/server/utils/id'

interface ImportQuestion {
  questionText: string
  questionType: string
  options: string[]
  correctAnswer: number[]
  explanation: string
}

interface ImportRequest {
  examId?: string
  questions: ImportQuestion[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ImportRequest>(event)
  const db = useDB()
  
  if (!body.questions || !Array.isArray(body.questions)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Questions array is required'
    })
  }

  const results = {
    success: 0,
    errors: [] as string[]
  }

  // Process each question
  for (let i = 0; i < body.questions.length; i++) {
    const question = body.questions[i]
    const lineNum = i + 1

    try {
      // Validate question data
      if (!question.questionText || typeof question.questionText !== 'string') {
        results.errors.push(`Line ${lineNum}: Question text is required`)
        continue
      }

      if (!question.questionType || !['multiple-choice', 'multiple-select', 'true-false', 'fill-blank'].includes(question.questionType)) {
        results.errors.push(`Line ${lineNum}: Invalid question type`)
        continue
      }

      if (!Array.isArray(question.options) || question.options.length < 2) {
        results.errors.push(`Line ${lineNum}: At least 2 options are required`)
        continue
      }

      if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
        results.errors.push(`Line ${lineNum}: Correct answer is required`)
        continue
      }

      // Validate correct answer indices
      const invalidIndices = question.correctAnswer.filter(idx => 
        typeof idx !== 'number' || idx < 0 || idx >= question.options.length
      )
      
      if (invalidIndices.length > 0) {
        results.errors.push(`Line ${lineNum}: Invalid correct answer indices`)
        continue
      }

      // For multiple-choice, only one correct answer allowed
      if (question.questionType === 'multiple-choice' && question.correctAnswer.length > 1) {
        results.errors.push(`Line ${lineNum}: Multiple-choice questions can have only one correct answer`)
        continue
      }

      // Create question record
      const questionId = generateQuestionId()
      const timestamp = new Date().toISOString()
      
      const newQuestion = {
        id: questionId,
        examId: body.examId || '',
        objectiveId: null,
        questionText: question.questionText.trim(),
        questionType: question.questionType,
        options: JSON.stringify(question.options.filter(opt => opt.trim() !== '')),
        correctAnswer: JSON.stringify(question.correctAnswer),
        explanation: question.explanation || '',
        isActive: true,
        createdAt: timestamp
      }

      await db.insert(questions).values(newQuestion)
      results.success++

    } catch (error) {
      console.error(`Error importing question ${lineNum}:`, error)
      results.errors.push(`Line ${lineNum}: Failed to import - ${error.message}`)
    }
  }

  return {
    success: true,
    data: results
  }
})