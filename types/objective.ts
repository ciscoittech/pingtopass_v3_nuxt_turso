export interface Objective {
  id: string
  examId: string
  title: string
  description?: string | null
  weight: number // percentage
  order: number
  isActive?: boolean
  createdAt?: number | string
  updatedAt?: number | string
  
  // Computed/joined fields
  examName?: string
  examCode?: string
  vendorName?: string
  vendorId?: string
  questionCount?: number
}

export interface ObjectiveFormData {
  id?: string
  examId: string
  title: string
  description: string
  weight: number
  order?: number
  isActive?: boolean
}

export interface ObjectiveReorderData {
  objectiveId: string
  newOrder: number
}

export interface ObjectiveStats {
  total: number
  active: number
  inactive: number
  totalWeight: number
  byExam: Record<string, number>
}