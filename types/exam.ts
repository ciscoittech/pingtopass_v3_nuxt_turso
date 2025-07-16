export interface Exam {
  id: string
  code: string
  name: string
  vendorId: string
  vendorName?: string
  difficulty?: 'easy' | 'intermediate' | 'hard'
  userProgress?: number | null
  isActive?: boolean
  isBookmarked?: boolean
  isExpired?: boolean
  popularity?: number
  questionCount?: number
  passRate?: number
  duration?: number
  price?: number
  description?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  
  // Legacy field mappings for API compatibility
  examCode?: string
  examName?: string
  numberOfQuestions?: number
  examDuration?: number
  passingScore?: number
}

export interface ExamProgress {
  examId: string
  userId: string
  progress: number
  lastStudied: string
  questionsAnswered: number
  correctAnswers: number
  timeSpent: number
}

export interface ExamBookmark {
  examId: string
  userId: string
  createdAt: string
}

export interface ExamObjective {
  id: string
  examId: string
  title: string
  description?: string
  weight: number // percentage
  order: number
}

export interface ExamFormData {
  id?: string
  vendorId: string
  code: string
  name: string
  description: string
  passingScore: number
  questionCount: number
  duration: number
  price: number
  difficulty: 'easy' | 'intermediate' | 'hard'
  isActive: boolean
  tags: string[]
}

export interface ExamFilters {
  search: string
  vendors: string[]
  difficulty: string[]
  status: 'all' | 'active' | 'inactive'
  priceRange: [number, number]
}

export interface ExamStats {
  total: number
  active: number
  inactive: number
  byDifficulty: {
    easy: number
    intermediate: number
    hard: number
  }
  byVendor: Record<string, number>
}