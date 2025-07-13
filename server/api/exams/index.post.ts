import { useDB } from '~/server/utils/db'
import { exams } from '~/server/database/schema/exams'
import { generateExamId } from '~/server/utils/id'

export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const body = await readBody(event)
    
    // Validate required fields
    const errors = []
    if (!body.vendorId) errors.push('Vendor ID is required')
    if (!body.code) errors.push('Exam code is required')
    if (!body.name) errors.push('Exam name is required')
    if (!body.passingScore) errors.push('Passing score is required')
    if (!body.duration) errors.push('Duration is required')
    if (!body.questionCount) errors.push('Question count is required')
    
    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: errors.join(', ')
      })
    }
    
    const db = useDB()
    
    // Create new exam
    const newExam = {
      id: generateExamId(),
      vendorId: body.vendorId,
      code: body.code,
      name: body.name,
      description: body.description || null,
      passingScore: body.passingScore,
      questionCount: body.questionCount,
      duration: body.duration,
      price: body.price || 0,
      isActive: body.isActive ?? true,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    }
    
    await db.insert(exams).values(newExam)
    
    return {
      success: true,
      data: newExam
    }
  } catch (error: any) {
    console.error('Error creating exam:', error)
    
    if (error.statusCode) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create exam'
    })
  }
})