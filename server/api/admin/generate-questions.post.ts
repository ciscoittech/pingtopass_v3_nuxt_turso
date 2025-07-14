import { db } from '~/server/database/db'
import { questions, exams, objectives } from '~/server/database/schema'
import { eq } from 'drizzle-orm'
import { openRouterClient } from '~/server/utils/openrouter'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin access
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // TODO: Add admin role check
    // if (!session.user.role?.includes('admin')) {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: 'Admin access required'
    //   })
    // }

    const body = await readBody(event)
    const {
      examId,
      objectiveId,
      count = 5,
      difficulty = 'medium',
      model = 'anthropic/claude-3.5-haiku',
      customPrompt,
      autoValidate = true
    } = body

    // Validate required fields
    if (!examId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam ID is required'
      })
    }

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

    // Generate questions using AI
    const generatedQuestions = await generateQuestionsWithAI({
      exam,
      objective,
      count,
      difficulty,
      model,
      customPrompt
    })

    // Validate questions if requested
    let validationResults = []
    if (autoValidate) {
      validationResults = await Promise.all(
        generatedQuestions.map(async (question: any) => {
          try {
            const validation = await openRouterClient.validateQuestion(question)
            return {
              question: question.question,
              ...validation
            }
          } catch (error) {
            return {
              question: question.question,
              isValid: false,
              issues: ['Validation failed'],
              suggestions: ['Manual review required']
            }
          }
        })
      )
    }

    // Save approved questions to database
    const savedQuestions = []
    for (const question of generatedQuestions) {
      const validation = validationResults.find(v => v.question === question.question)
      
      // Only auto-save if validation passed or validation is disabled
      if (!autoValidate || (validation?.isValid)) {
        try {
          const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          await db.insert(questions).values({
            id: questionId,
            examId: examId,
            objectiveId: objectiveId || null,
            questionText: question.question,
            optionA: question.options[0]?.replace(/^A\)\s*/, '') || '',
            optionB: question.options[1]?.replace(/^B\)\s*/, '') || '',
            optionC: question.options[2]?.replace(/^C\)\s*/, '') || '',
            optionD: question.options[3]?.replace(/^D\)\s*/, '') || '',
            correctAnswer: question.correctAnswer?.toUpperCase() || 'A',
            explanation: question.explanation || '',
            difficulty: question.difficulty || difficulty,
            isActive: true,
            metadata: JSON.stringify({
              generatedByAI: true,
              model: model,
              generatedAt: new Date().toISOString(),
              objective: question.objective || objective?.title,
              validated: autoValidate
            }),
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000)
          })

          savedQuestions.push({
            id: questionId,
            ...question,
            status: 'saved'
          })
        } catch (error: any) {
          console.error('Failed to save question:', error)
          savedQuestions.push({
            ...question,
            status: 'failed_to_save',
            error: error?.message || 'Unknown error'
          })
        }
      } else {
        savedQuestions.push({
          ...question,
          status: 'validation_failed',
          validation: validation
        })
      }
    }

    return {
      success: true,
      data: {
        exam: { id: exam.id, name: exam.name, code: exam.code },
        objective: objective ? { id: objective.id, title: objective.title } : null,
        generated: generatedQuestions.length,
        saved: savedQuestions.filter(q => q.status === 'saved').length,
        validationResults,
        questions: savedQuestions,
        settings: {
          count,
          difficulty,
          model,
          autoValidate
        }
      }
    }

  } catch (error: any) {
    console.error('Question generation error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to generate questions'
    })
  }
})

async function generateQuestionsWithAI(params: {
  exam: any
  objective: any
  count: number
  difficulty: string
  model: string
  customPrompt?: string
}) {
  const { exam, objective, count, difficulty, model, customPrompt } = params

  // Build context prompt
  let prompt = customPrompt || `Generate ${count} high-quality multiple choice questions for the ${exam.code} certification exam`
  
  if (objective) {
    prompt += ` focusing on the objective: "${objective.title}"`
    if (objective.description) {
      prompt += ` (${objective.description})`
    }
  }

  prompt += `

Exam Context:
- Certification: ${exam.name} (${exam.code})
- Difficulty Level: ${difficulty}
- Target Audience: IT professionals seeking ${exam.code} certification

Requirements:
1. Questions should test practical, real-world knowledge
2. Each question must have exactly 4 plausible options (A, B, C, D)
3. Only one correct answer per question
4. Include detailed explanations for the correct answer
5. Explain why each incorrect option is wrong
6. Questions should be appropriate for ${difficulty} difficulty level
7. Focus on scenarios and practical applications, not just memorization

Please generate exactly ${count} questions.`

  try {
    const response = await openRouterClient.generateQuestions(prompt, model)
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(response)
    
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response format from AI')
    }

    return parsedResponse.questions.slice(0, count) // Ensure we don't exceed requested count
  } catch (error: any) {
    console.error('AI generation failed:', error)
    throw new Error(`Failed to generate questions: ${error?.message || 'Unknown error'}`)
  }
}