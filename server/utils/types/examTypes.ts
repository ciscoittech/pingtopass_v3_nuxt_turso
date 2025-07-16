// Standard exam response types for API consistency

export interface VendorInfo {
  id: string
  name: string
  slug?: string
  logo?: string
}

export interface ExamBase {
  id: string
  code: string
  name: string
  vendorId: string
  description?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface ExamDetails extends ExamBase {
  vendor: VendorInfo
  passingScore: number
  totalQuestions: number
  duration: number // in minutes
  price: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  objectives?: ObjectiveSummary[]
  tags?: string[]
  metadata?: Record<string, any>
}

export interface ExamListItem extends ExamBase {
  vendor: VendorInfo
  totalQuestions: number
  duration: number
  userProgress?: UserExamProgress
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export interface ObjectiveSummary {
  id: string
  title: string
  description?: string
  weight: number
  order: number
}

export interface UserExamProgress {
  studyProgress: number // 0-100
  testsTaken: number
  bestScore: number
  lastActivity?: number
  isBookmarked: boolean
}

export interface ExamStatistics {
  totalQuestions: number
  activeQuestions: number
  totalObjectives: number
  averageDifficulty: number
  lastUpdated: number
}

// Request types
export interface CreateExamRequest {
  code: string
  name: string
  vendorId: string
  description?: string
  passingScore: number
  duration: number
  price?: number
  isActive?: boolean
}

export interface UpdateExamRequest {
  name?: string
  description?: string
  passingScore?: number
  duration?: number
  price?: number
  isActive?: boolean
  metadata?: Record<string, any>
}

export interface ExamFilters {
  vendorId?: string
  difficulty?: string
  search?: string
  isActive?: boolean
  hasQuestions?: boolean
  limit?: number
  offset?: number
  sortBy?: 'name' | 'code' | 'createdAt' | 'updatedAt' | 'popularity'
  sortOrder?: 'asc' | 'desc'
}

// Response types
export interface ExamListResponse {
  success: true
  data: {
    exams: ExamListItem[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }
}

export interface ExamDetailResponse {
  success: true
  data: ExamDetails
}

export interface ExamStatsResponse {
  success: true
  data: ExamStatistics
}

// Helper functions for data transformation
export function transformExamToListItem(exam: any, vendor: any, userProgress?: any): ExamListItem {
  return {
    id: exam.id,
    code: exam.code,
    name: exam.name,
    vendorId: exam.vendorId,
    description: exam.description,
    isActive: exam.isActive === 1 || exam.isActive === true,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
    vendor: {
      id: vendor?.id || exam.vendorId,
      name: vendor?.name || 'Unknown',
      slug: vendor?.slug,
      logo: vendor?.logo
    },
    totalQuestions: exam.questionCount || exam.numberOfQuestions || 0,
    duration: exam.duration || exam.examDuration || 90,
    difficulty: exam.difficulty || 'intermediate',
    userProgress: userProgress ? {
      studyProgress: userProgress.studyProgress || 0,
      testsTaken: userProgress.testsTaken || 0,
      bestScore: userProgress.bestScore || 0,
      lastActivity: userProgress.lastActivity,
      isBookmarked: userProgress.isBookmarked || false
    } : undefined
  }
}

export function transformExamToDetails(exam: any, vendor: any, objectives?: any[]): ExamDetails {
  return {
    id: exam.id,
    code: exam.code,
    name: exam.name,
    vendorId: exam.vendorId,
    description: exam.description,
    isActive: exam.isActive === 1 || exam.isActive === true,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
    vendor: {
      id: vendor?.id || exam.vendorId,
      name: vendor?.name || 'Unknown',
      slug: vendor?.slug,
      logo: vendor?.logo
    },
    passingScore: exam.passingScore || 70,
    totalQuestions: exam.questionCount || exam.numberOfQuestions || 0,
    duration: exam.duration || exam.examDuration || 90,
    price: exam.price || 0,
    difficulty: exam.difficulty || 'intermediate',
    objectives: objectives?.map(obj => ({
      id: obj.id,
      title: obj.title,
      description: obj.description,
      weight: obj.weight || 0,
      order: obj.order || 0
    })),
    tags: exam.tags || [],
    metadata: exam.metadata ? (typeof exam.metadata === 'string' ? JSON.parse(exam.metadata) : exam.metadata) : {}
  }
}