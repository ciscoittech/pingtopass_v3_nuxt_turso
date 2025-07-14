import { useDB } from '~/server/utils/db'
import { questions, exams, objectives } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { ensureAdmin } from '~/server/utils/auth'
import { QuestionGenerator } from '~/server/utils/langchain/agents/generator'
import type { GenerateQuestionsInput } from '~/server/utils/langchain/types'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin access
    await ensureAdmin(event)

    const body = await readBody(event)
    const {
      examId,
      objectiveId,
      count = 5,
      difficulty = 'medium',
      customPrompt,
      autoSave = false
    } = body

    // Validate required fields
    if (!examId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam ID is required'
      })
    }

    const db = useDB()

    // Get exam details
    const exam = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .then(rows => rows[0])

    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }

    // Get objective details if specified
    let objective = null
    if (objectiveId) {
      objective = await db
        .select()
        .from(objectives)
        .where(eq(objectives.id, objectiveId))
        .then(rows => rows[0])

      if (!objective) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Objective not found'
        })
      }
    }

    // Prepare input for LangChain generator
    const generatorInput: GenerateQuestionsInput = {
      examCode: exam.code,
      examName: exam.name,
      objective: objective?.title || 'General exam topics',
      objectiveDescription: objective?.description || undefined,
      count,
      difficulty,
      customPrompt
    }

    // Generate questions using LangChain
    console.log('[API] Creating QuestionGenerator...')
    const generator = new QuestionGenerator()
    
    console.log('[API] Calling generator.generate with input:', JSON.stringify(generatorInput, null, 2))
    const result = await generator.generate(generatorInput)
    console.log('[API] Generation result:', result)

    // Save questions if autoSave is enabled
    const savedQuestions = []
    if (autoSave) {
      for (const question of result.questions) {
        try {
          await db.insert(questions).values({
            id: question.id,
            examId: examId,
            objectiveId: objectiveId || null,
            questionText: question.question,
            questionType: question.questionType,
            options: JSON.stringify(question.options),
            correctAnswer: JSON.stringify([question.correctAnswer]),
            explanation: question.explanation,
            isActive: true
          })

          savedQuestions.push({
            ...question,
            status: 'saved'
          })
        } catch (error: any) {
          console.error('Failed to save question:', error)
          savedQuestions.push({
            ...question,
            status: 'failed',
            error: error?.message || 'Unknown error'
          })
        }
      }
    }

    // Return response
    return {
      success: true,
      data: {
        exam: { id: exam.id, name: exam.name, code: exam.code },
        objective: objective ? { id: objective.id, title: objective.title } : null,
        generated: result.questions.length,
        saved: savedQuestions.filter(q => q.status === 'saved').length,
        questions: autoSave ? savedQuestions : result.questions,
        metadata: result.metadata,
        settings: {
          count,
          difficulty,
          autoSave
        }
      }
    }

  } catch (error: any) {
    console.error('Question generation v2 error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to generate questions'
    })
  }
})