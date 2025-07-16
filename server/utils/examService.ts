import { useDB } from './db'
import { exams, vendors, objectives, questions, bookmarks, userProgress } from '../database/schema'
import { eq, and, like, desc, asc, sql, inArray } from 'drizzle-orm'
import type { 
  ExamFilters, 
  ExamListItem, 
  ExamDetails, 
  ExamStatistics,
  CreateExamRequest,
  UpdateExamRequest
} from './types/examTypes'
import { transformExamToListItem, transformExamToDetails } from './types/examTypes'

export const examService = {
  // Get paginated list of exams with filters
  async getList(userId: string | null, filters: ExamFilters = {}) {
    const db = useDB()
    
    const {
      vendorId,
      difficulty,
      search,
      isActive = true,
      hasQuestions,
      limit = 50,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc'
    } = filters

    // Build query conditions
    const conditions = []
    
    if (isActive !== undefined) {
      conditions.push(eq(exams.isActive, isActive ? 1 : 0))
    }
    
    if (vendorId) {
      conditions.push(eq(exams.vendorId, vendorId))
    }
    
    if (search) {
      conditions.push(
        sql`(${exams.code} LIKE ${`%${search}%`} OR ${exams.name} LIKE ${`%${search}%`})`
      )
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(exams)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .get()
    
    const total = countResult?.count || 0

    // Build sort order
    let orderBy
    switch (sortBy) {
      case 'code':
        orderBy = sortOrder === 'desc' ? desc(exams.code) : asc(exams.code)
        break
      case 'createdAt':
        orderBy = sortOrder === 'desc' ? desc(exams.createdAt) : asc(exams.createdAt)
        break
      case 'updatedAt':
        orderBy = sortOrder === 'desc' ? desc(exams.updatedAt) : asc(exams.updatedAt)
        break
      default:
        orderBy = sortOrder === 'desc' ? desc(exams.name) : asc(exams.name)
    }

    // Get exams with vendor info
    const examResults = await db
      .select({
        exam: exams,
        vendor: vendors
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Get user progress if userId provided
    let userProgressMap = new Map()
    if (userId && examResults.length > 0) {
      const examIds = examResults.map(r => r.exam.id)
      const progressData = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            inArray(userProgress.examId, examIds)
          )
        )
      
      progressData.forEach(p => {
        userProgressMap.set(p.examId, {
          studyProgress: p.studyProgress || 0,
          testsTaken: p.testsTaken || 0,
          bestScore: p.bestScore || 0,
          lastActivity: p.lastActivity
        })
      })

      // Get bookmarks
      const bookmarkData = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            inArray(bookmarks.resourceId, examIds),
            eq(bookmarks.resourceType, 'exam')
          )
        )
      
      bookmarkData.forEach(b => {
        const progress = userProgressMap.get(b.resourceId) || {}
        progress.isBookmarked = true
        userProgressMap.set(b.resourceId, progress)
      })
    }

    // Transform results
    const examList: ExamListItem[] = examResults.map(({ exam, vendor }) => 
      transformExamToListItem(exam, vendor, userProgressMap.get(exam.id))
    )

    return {
      exams: examList,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total
    }
  },

  // Get single exam details
  async getById(examId: string, userId?: string) {
    const db = useDB()
    
    console.log('[ExamService] getById called with examId:', examId)
    
    // Get exam with vendor
    const examResult = await db
      .select({
        exam: exams,
        vendor: vendors
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(eq(exams.id, examId))
      .get()

    console.log('[ExamService] Exam found:', examResult ? 'Yes' : 'No')
    
    if (!examResult) {
      // Try to find exams with similar IDs for debugging
      console.log('[ExamService] Trying to find exams with similar patterns...')
      const allExams = await db
        .select({ id: exams.id, code: exams.code })
        .from(exams)
        .limit(5)
      console.log('[ExamService] Sample exam IDs in database:', allExams.map(e => e.id))
      return null
    }

    // Get objectives
    const examObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.examId, examId))
      .orderBy(asc(objectives.order))

    // Get statistics
    const stats = await this.getStatistics(examId)

    // Transform to standard format
    const examDetails = transformExamToDetails(
      examResult.exam,
      examResult.vendor,
      examObjectives
    )

    // Add statistics
    examDetails.metadata = {
      ...examDetails.metadata,
      statistics: stats
    }

    return examDetails
  },

  // Get exam by code
  async getByCode(examCode: string) {
    const db = useDB()
    
    const examResult = await db
      .select({
        exam: exams,
        vendor: vendors
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(eq(exams.code, examCode))
      .get()

    if (!examResult) {
      return null
    }

    // Get objectives
    const examObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.examId, examResult.exam.id))
      .orderBy(asc(objectives.order))

    return transformExamToDetails(
      examResult.exam,
      examResult.vendor,
      examObjectives
    )
  },

  // Get exam statistics
  async getStatistics(examId: string): Promise<ExamStatistics> {
    const db = useDB()
    
    // Get question counts
    const questionStats = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when is_active = 1 then 1 else 0 end)`
      })
      .from(questions)
      .where(eq(questions.examId, examId))
      .get()

    // Get objective count
    const objectiveCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(objectives)
      .where(eq(objectives.examId, examId))
      .get()

    // Get exam update time
    const examData = await db
      .select({ updatedAt: exams.updatedAt })
      .from(exams)
      .where(eq(exams.id, examId))
      .get()

    return {
      totalQuestions: questionStats?.total || 0,
      activeQuestions: questionStats?.active || 0,
      totalObjectives: objectiveCount?.count || 0,
      averageDifficulty: 2, // TODO: Calculate from questions
      lastUpdated: examData?.updatedAt || 0
    }
  },

  // Create new exam
  async create(data: CreateExamRequest) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    const examId = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const newExam = await db
      .insert(exams)
      .values({
        id: examId,
        code: data.code,
        name: data.name,
        vendorId: data.vendorId,
        description: data.description,
        passingScore: data.passingScore,
        duration: data.duration,
        price: data.price || 0,
        isActive: data.isActive !== false ? 1 : 0,
        questionCount: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning()
      .get()

    return this.getById(examId)
  },

  // Update exam
  async update(examId: string, data: UpdateExamRequest) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    const updateData: any = {
      updatedAt: now
    }
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.passingScore !== undefined) updateData.passingScore = data.passingScore
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.price !== undefined) updateData.price = data.price
    if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata)
    
    await db
      .update(exams)
      .set(updateData)
      .where(eq(exams.id, examId))

    return this.getById(examId)
  },

  // Delete exam (soft delete)
  async delete(examId: string) {
    const db = useDB()
    const now = Math.floor(Date.now() / 1000)
    
    await db
      .update(exams)
      .set({
        isActive: 0,
        updatedAt: now
      })
      .where(eq(exams.id, examId))

    return true
  },

  // Search exams
  async search(query: string, limit = 10) {
    const db = useDB()
    
    const results = await db
      .select({
        id: exams.id,
        code: exams.code,
        name: exams.name,
        vendorName: vendors.name
      })
      .from(exams)
      .leftJoin(vendors, eq(exams.vendorId, vendors.id))
      .where(
        and(
          eq(exams.isActive, 1),
          sql`(${exams.code} LIKE ${`%${query}%`} OR ${exams.name} LIKE ${`%${query}%`})`
        )
      )
      .limit(limit)

    return results
  }
}