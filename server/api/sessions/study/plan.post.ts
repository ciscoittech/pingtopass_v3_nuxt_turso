import { z } from 'zod'
import { useDB } from '~/server/utils/db'
import { studySessions, questions, exams, objectives } from '~/server/database/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireAuth } from '~/server/utils/auth'

// Request validation schema
const studyPlanSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  targetScore: z.number().min(50).max(100).optional().default(80),
  dailyHours: z.number().min(0.5).max(12).optional().default(2),
  targetDate: z.string().optional()
})

interface StudyPlanSection {
  objectiveId: string
  objectiveTitle: string
  currentAccuracy: number
  targetAccuracy: number
  questionsToReview: number
  estimatedHours: number
  priority: 'high' | 'medium' | 'low'
  focusAreas: string[]
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  try {
    // Parse and validate request body
    const body = await readBody(event)
    const params = studyPlanSchema.parse(body)
    
    const db = useDB()
    
    // Get exam details
    const exam = await db
      .select()
      .from(exams)
      .where(eq(exams.id, params.examId))
      .get()
    
    if (!exam) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exam not found'
      })
    }
    
    // Get all objectives for the exam
    const examObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.examId, params.examId))
    
    // Get user's performance data for this exam
    const sessions = await db
      .select({
        answers: studySessions.answers,
        questionsOrder: studySessions.questionsOrder
      })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, user.id),
        eq(studySessions.examId, params.examId)
      ))
    
    // Analyze performance by objective
    const objectivePerformance = new Map<string, {
      totalQuestions: number
      correctAnswers: number
      questionIds: Set<string>
      incorrectQuestionIds: Set<string>
    }>()
    
    for (const session of sessions) {
      if (!session.answers || !session.questionsOrder) continue
      
      let answers: Record<string, any>
      let questionIds: string[]
      
      try {
        answers = JSON.parse(session.answers) as Record<string, {
          isCorrect: boolean
        }>
        questionIds = JSON.parse(session.questionsOrder) as string[]
      } catch (e) {
        console.error('[Study Plan] Failed to parse session data:', e)
        continue
      }
      
      // Validate questionIds is an array
      if (!Array.isArray(questionIds)) {
        console.error('[Study Plan] questionIds is not an array:', questionIds)
        continue
      }
      
      if (questionIds.length === 0) continue
      
      // Get question objectives
      const questionsData = await db
        .select({
          id: questions.id,
          objectiveId: questions.objectiveId
        })
        .from(questions)
        .where(sql`${questions.id} IN (${sql.raw(questionIds.map(id => `'${id}'`).join(','))})`)
      
      questionsData.forEach(question => {
        if (!question.objectiveId) return
        
        const answer = answers[question.id]
        if (!answer) return
        
        if (!objectivePerformance.has(question.objectiveId)) {
          objectivePerformance.set(question.objectiveId, {
            totalQuestions: 0,
            correctAnswers: 0,
            questionIds: new Set(),
            incorrectQuestionIds: new Set()
          })
        }
        
        const perf = objectivePerformance.get(question.objectiveId)!
        perf.questionIds.add(question.id)
        perf.totalQuestions++
        
        if (answer.isCorrect) {
          perf.correctAnswers++
        } else {
          perf.incorrectQuestionIds.add(question.id)
        }
      })
    }
    
    // Generate study plan sections
    const studyPlanSections: StudyPlanSection[] = []
    
    for (const objective of examObjectives) {
      const perf = objectivePerformance.get(objective.id)
      
      // Calculate current accuracy
      const currentAccuracy = perf 
        ? (perf.correctAnswers / perf.totalQuestions) * 100 
        : 0
      
      // Skip objectives that are already above target
      if (currentAccuracy >= params.targetScore) {
        continue
      }
      
      // Get total questions for this objective
      const [totalQuestionsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(and(
          eq(questions.examId, params.examId),
          eq(questions.objectiveId, objective.id),
          eq(questions.isActive, true)
        ))
      
      const totalQuestions = totalQuestionsResult?.count || 0
      const questionsToReview = Math.max(
        totalQuestions - (perf?.questionIds.size || 0),
        perf?.incorrectQuestionIds.size || 0
      )
      
      // Estimate study hours based on questions and current performance
      const accuracyGap = params.targetScore - currentAccuracy
      const estimatedHours = Math.ceil(
        (questionsToReview * 3) / 60 + // 3 minutes per question average
        (accuracyGap / 10) // Additional hours based on accuracy gap
      )
      
      // Determine priority
      let priority: 'high' | 'medium' | 'low' = 'medium'
      if (currentAccuracy < 50) priority = 'high'
      else if (currentAccuracy >= 70) priority = 'low'
      
      // Identify focus areas
      const focusAreas: string[] = []
      if (currentAccuracy < 30) focusAreas.push('Fundamental concepts review needed')
      if (perf && perf.incorrectQuestionIds.size > 5) focusAreas.push('Practice incorrect questions')
      if (!perf || perf.totalQuestions < 10) focusAreas.push('More practice needed')
      
      studyPlanSections.push({
        objectiveId: objective.id,
        objectiveTitle: objective.title,
        currentAccuracy,
        targetAccuracy: params.targetScore,
        questionsToReview,
        estimatedHours,
        priority,
        focusAreas
      })
    }
    
    // Sort by priority and accuracy gap
    studyPlanSections.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return a.currentAccuracy - b.currentAccuracy
    })
    
    // Calculate total study time
    const totalEstimatedHours = studyPlanSections.reduce(
      (sum, section) => sum + section.estimatedHours, 
      0
    )
    
    // Calculate schedule
    const daysNeeded = Math.ceil(totalEstimatedHours / params.dailyHours)
    const targetDate = params.targetDate 
      ? new Date(params.targetDate) 
      : new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000)
    
    return {
      success: true,
      data: {
        plan: {
          examId: params.examId,
          examCode: exam.code,
          examName: exam.name,
          targetScore: params.targetScore,
          currentOverallAccuracy: studyPlanSections.length > 0
            ? studyPlanSections.reduce((sum, s) => sum + s.currentAccuracy, 0) / studyPlanSections.length
            : 100,
          sections: studyPlanSections,
          schedule: {
            totalEstimatedHours,
            dailyHours: params.dailyHours,
            daysNeeded,
            targetDate: targetDate.toISOString(),
            startDate: new Date().toISOString()
          },
          recommendations: generateRecommendations(studyPlanSections, params)
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to generate study plan:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to generate study plan'
    })
  }
})

function generateRecommendations(
  sections: StudyPlanSection[], 
  params: any
): string[] {
  const recommendations: string[] = []
  
  // High priority sections
  const highPrioritySections = sections.filter(s => s.priority === 'high')
  if (highPrioritySections.length > 0) {
    recommendations.push(
      `Focus on ${highPrioritySections.length} high-priority objectives with accuracy below 50%`
    )
  }
  
  // Study mode recommendations
  const hasIncorrectQuestions = sections.some(s => s.focusAreas.includes('Practice incorrect questions'))
  if (hasIncorrectQuestions) {
    recommendations.push('Use "Incorrect Questions" study mode to review your mistakes')
  }
  
  // Time management
  if (params.dailyHours < 2) {
    recommendations.push('Consider increasing daily study hours for better retention')
  }
  
  // Overall progress
  const needsMorePractice = sections.filter(s => s.focusAreas.includes('More practice needed'))
  if (needsMorePractice.length > sections.length / 2) {
    recommendations.push('Complete more practice questions to establish a performance baseline')
  }
  
  return recommendations
}