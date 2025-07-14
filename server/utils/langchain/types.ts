// Question generation types
export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  objective: string
  questionType: 'multiple-choice'
}

export interface GenerateQuestionsInput {
  examCode: string
  examName: string
  objective: string
  objectiveDescription?: string
  count: number
  difficulty?: 'easy' | 'medium' | 'hard'
  customPrompt?: string
}

export interface GenerateQuestionsOutput {
  questions: Question[]
  metadata: {
    examCode: string
    examName: string
    objective: string
    count: number
    difficulty?: string
    generatedAt: string
    modelUsed: string
    totalTokens: number
    cost: number
  }
}

// LangChain model options
export interface ModelOptions {
  modelName?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

// Chat types
export interface ChatResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// Validation types
export interface ValidationResult {
  isValid: boolean
  issues: string[]
  suggestions: string[]
}