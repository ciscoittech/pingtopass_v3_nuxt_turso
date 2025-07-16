export type QuestionType = 'multiple-choice' | 'multiple-select' | 'true-false' | 'fill-blank'

export interface Question {
  id: string
  examId: string
  objectiveId?: string | null
  questionText: string
  questionType: QuestionType
  options: string[]
  correctAnswer: number[]
  explanation?: string | null
  isActive: boolean
  createdAt: number | string
  updatedAt: number | string
  
  // Computed/joined fields
  examName?: string
  examCode?: string
  vendorName?: string
  vendorId?: string
}

export interface QuestionFormData {
  id?: string
  examId: string
  objectiveId?: string
  questionText: string
  questionType: QuestionType
  options: string[]
  correctAnswer: number[]
  explanation: string
  isActive?: boolean
}

export interface QuestionFilters {
  search: string
  examId: string
  questionType: string
  activeOnly: boolean
}

export interface QuestionStats {
  total: number
  active: number
  inactive: number
  byType: {
    'multiple-choice': number
    'multiple-select': number
    'true-false': number
    'fill-blank': number
  }
  byExam: Record<string, number>
}

export interface QuestionImportData {
  examId: string
  questions: {
    questionText: string
    questionType: QuestionType
    options: string[]
    correctAnswer: number[]
    explanation?: string
  }[]
}