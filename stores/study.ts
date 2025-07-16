import { defineStore } from 'pinia'
import { useSessionOptimizer } from '~/composables/useSessionOptimizer'

interface Question {
  id: string
  questionText: string
  questionType: 'multiple-choice' | 'multiple-answer'
  options: string[]
  correctAnswers: number[]
  explanation: string
  codeBlock?: string
  resources?: Array<{
    title: string
    url: string
  }>
}

interface StudySession {
  id: string
  examId: string
  examCode: string
  examName: string
  mode: 'sequential' | 'random' | 'flagged' | 'incorrect' | 'weak_areas' | 'review'
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  totalQuestions: number
  currentQuestionIndex: number
  questionsOrder: string[]
  questions: Question[]
  answers: Record<string, {
    questionId: string
    selectedAnswers: number[]
    isCorrect: boolean
    timeSpent: number
    answeredAt: string
  }>
  bookmarks: string[]
  flags: string[]
  startedAt: number
  lastActivityAt: number
  timeSpentSeconds: number
  metadata: {
    showTimer: boolean
    autoAdvance: boolean
    showExplanations: boolean
    maxQuestions?: number
    objectiveIds?: string[]
  }
}

interface StudyState {
  currentSession: StudySession | null
  currentQuestion: Question | null
  selectedAnswers: number[]
  showFeedback: boolean
  loading: boolean
  error: string | null
  sessionTime: number
  questionStartTime: number
}

export const useStudyStore = defineStore('study', {
  state: (): StudyState => ({
    currentSession: null,
    currentQuestion: null,
    selectedAnswers: [],
    showFeedback: false,
    loading: false,
    error: null,
    sessionTime: 0,
    questionStartTime: 0
  }),

  getters: {
    // Session progress
    sessionProgress: (state) => {
      if (!state.currentSession) return null
      
      const answered = Object.keys(state.currentSession.answers).length
      const correct = Object.values(state.currentSession.answers)
        .filter(a => a.isCorrect).length
      const incorrect = answered - correct
      const accuracy = answered > 0 ? (correct / answered) * 100 : 0
      
      return {
        current: state.currentSession.currentQuestionIndex,
        total: state.currentSession.totalQuestions,
        answered,
        correct,
        incorrect,
        accuracy,
        remaining: state.currentSession.totalQuestions - state.currentSession.currentQuestionIndex - 1
      }
    },

    // Check if can submit answer
    canSubmit: (state) => {
      return state.selectedAnswers.length > 0 && !state.loading && !state.showFeedback
    },

    // Check if session is complete
    isSessionComplete: (state) => {
      if (!state.currentSession) return false
      return state.currentSession.currentQuestionIndex >= state.currentSession.totalQuestions - 1
    },

    // Get current question number
    currentQuestionNumber: (state) => {
      if (!state.currentSession) return 0
      return state.currentSession.currentQuestionIndex + 1
    },

    // Check if answer is correct
    isAnswerCorrect: (state) => {
      if (!state.currentQuestion || state.selectedAnswers.length === 0) return false
      
      const correct = state.currentQuestion.correctAnswers
      const selected = state.selectedAnswers
      
      // Check if arrays have same elements
      return correct.length === selected.length && 
        correct.every(ans => selected.includes(ans)) &&
        selected.every(ans => correct.includes(ans))
    },

    // Get current question index
    currentQuestionIndex: (state) => {
      return state.currentSession?.currentQuestionIndex || 0
    },

    // Check if current question is bookmarked
    isCurrentQuestionBookmarked: (state) => {
      if (!state.currentQuestion || !state.currentSession) return false
      return state.currentSession.bookmarks.includes(state.currentQuestion.id)
    },

    // Check if current question is flagged
    isCurrentQuestionFlagged: (state) => {
      if (!state.currentQuestion || !state.currentSession) return false
      return state.currentSession.flags.includes(state.currentQuestion.id)
    }
  },

  actions: {
    // Start a new study session
    async startSession(config: {
      examId: string
      examCode: string
      examName: string
      mode: string
      maxQuestions: number
      showTimer: boolean
      autoAdvance: boolean
      showExplanations: boolean
      objectiveIds?: string[]
    }) {
      console.log('[Study Store] startSession called with config:', config)
      this.loading = true
      this.error = null
      
      try {
        // API call to start session
        console.log('[Study Store] Making API call to /api/sessions/study/start')
        const startTime = performance.now()
        
        const requestBody = {
          examId: config.examId,
          mode: config.mode,
          maxQuestions: config.maxQuestions,
          objectiveIds: config.objectiveIds,
          showExplanations: config.showExplanations,
          showTimer: config.showTimer,
          autoAdvance: config.autoAdvance
        }
        
        console.log('[Study Store] Request body:', requestBody)
        
        const response = await $fetch('/api/sessions/study/start', {
          method: 'POST',
          body: requestBody,
          onRequestError({ request, options, error }) {
            console.error('[Study Store] Request error:', error)
            console.error('[Study Store] Request details:', { request, options })
          },
          onResponseError({ request, response }) {
            console.error('[Study Store] Response error:', response.status, response.statusText)
            console.error('[Study Store] Response body:', response._data)
          }
        })
        
        const endTime = performance.now()
        console.log(`[Study Store] API call took ${endTime - startTime}ms`)
        console.log('[Study Store] API response:', response)
        
        if (response.success && response.data) {
          const { session, questions, isResuming } = response.data
          console.log('[Study Store] Session data:', session)
          console.log('[Study Store] Questions count:', questions?.length || 0)
          console.log('[Study Store] Is resuming:', isResuming)
          
          // Transform API response to store format
          this.currentSession = {
            id: session.id,
            examId: session.examId,
            examCode: config.examCode,
            examName: config.examName,
            mode: session.mode,
            status: session.status,
            totalQuestions: session.totalQuestions,
            currentQuestionIndex: session.currentQuestionIndex,
            questionsOrder: session.questionsOrder,
            questions: questions || [],
            answers: session.answers || {},
            bookmarks: session.bookmarks || [],
            flags: session.flags || [],
            startedAt: session.startedAt,
            lastActivityAt: session.lastActivityAt,
            timeSpentSeconds: session.timeSpentSeconds,
            metadata: {
              showTimer: config.showTimer,
              autoAdvance: config.autoAdvance,
              showExplanations: config.showExplanations,
              maxQuestions: config.maxQuestions,
              objectiveIds: config.objectiveIds
            }
          }
          
          // Set current question
          if (questions && questions.length > 0) {
            console.log('[Study Store] Setting current question at index:', session.currentQuestionIndex)
            this.currentQuestion = questions[session.currentQuestionIndex]
            this.questionStartTime = Date.now()
            console.log('[Study Store] Current question set:', this.currentQuestion)
          } else {
            console.error('[Study Store] No questions available!', {
              questionsLength: questions?.length || 0,
              currentIndex: session.currentQuestionIndex
            })
          }
          
          // Initialize session time
          this.sessionTime = session.timeSpentSeconds || 0
          
          // Start session timer
          this.startSessionTimer()
          
          console.log('[Study Store] Session initialized successfully')
          return true
        } else {
          console.error('[Study Store] Invalid API response:', response)
          this.error = 'Invalid response from server'
          return false
        }
      } catch (error: any) {
        console.error('[Study Store] Error starting session:', error)
        console.error('[Study Store] Error details:', {
          statusCode: error.statusCode,
          statusMessage: error.data?.statusMessage,
          message: error.message,
          data: error.data
        })
        this.error = error.data?.statusMessage || error.message || 'Failed to start study session'
      } finally {
        this.loading = false
        console.log('[Study Store] Loading state cleared')
      }
      
      return false
    },

    // Select/deselect an answer
    toggleAnswer(index: number) {
      if (!this.currentQuestion || this.showFeedback) return
      
      if (this.currentQuestion.questionType === 'multiple-choice') {
        // Single selection
        this.selectedAnswers = [index]
      } else {
        // Multiple selection
        const existingIndex = this.selectedAnswers.indexOf(index)
        if (existingIndex > -1) {
          this.selectedAnswers.splice(existingIndex, 1)
        } else {
          this.selectedAnswers.push(index)
        }
      }
    },

    // Submit answer
    async submitAnswer() {
      if (!this.canSubmit || !this.currentQuestion || !this.currentSession) return
      
      this.loading = true
      const timeSpent = Math.floor((Date.now() - this.questionStartTime) / 1000)
      
      try {
        // Calculate if answer is correct
        const isCorrect = this.isAnswerCorrect
        
        // API call to update session with answer
        const response = await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            answer: {
              questionId: this.currentQuestion.id,
              selectedAnswers: this.selectedAnswers,
              isCorrect,
              timeSpent
            },
            currentQuestionIndex: this.currentSession.currentQuestionIndex,
            timeSpentSeconds: this.sessionTime
          }
        })
        
        if (response.success) {
          // Update local session state
          this.currentSession.answers[this.currentQuestion.id] = {
            questionId: this.currentQuestion.id,
            selectedAnswers: [...this.selectedAnswers],
            isCorrect,
            timeSpent,
            answeredAt: new Date().toISOString()
          }
          
          // Show feedback if enabled
          if (this.currentSession.metadata.showExplanations) {
            this.showFeedback = true
            
            // Auto-advance if enabled
            if (this.currentSession.metadata.autoAdvance) {
              setTimeout(() => this.nextQuestion(), 3000)
            }
          } else {
            // Go to next question immediately
            await this.nextQuestion()
          }
        }
      } catch (error: any) {
        this.error = error.data?.statusMessage || error.message || 'Failed to submit answer'
        console.error('Failed to submit answer:', error)
      } finally {
        this.loading = false
      }
    },

    // Go to next question
    async nextQuestion() {
      if (!this.currentSession) return
      
      this.showFeedback = false
      this.selectedAnswers = []
      
      // Check if session is complete
      if (this.isSessionComplete) {
        await this.endSession()
        return
      }
      
      // Move to next question
      this.currentSession.currentQuestionIndex++
      
      // Update session progress on server
      try {
        await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            currentQuestionIndex: this.currentSession.currentQuestionIndex,
            timeSpentSeconds: this.sessionTime
          }
        })
      } catch (error) {
        console.error('Failed to update session progress:', error)
      }
      
      // Get next question from loaded questions
      if (this.currentSession.questions[this.currentSession.currentQuestionIndex]) {
        this.currentQuestion = this.currentSession.questions[this.currentSession.currentQuestionIndex]
      } else {
        // This shouldn't happen since we load all questions upfront
        console.error('No question found at index:', this.currentSession.currentQuestionIndex)
        this.error = 'Failed to load next question'
      }
      
      // Reset question timer
      this.questionStartTime = Date.now()
    },

    // Skip current question
    skipQuestion() {
      if (!this.currentSession || !this.currentQuestion) return
      
      // Mark as skipped (no answer selected)
      this.currentSession.answers[this.currentQuestion.id] = {
        questionId: this.currentQuestion.id,
        selectedAnswers: [],
        isCorrect: false,
        timeSpent: Math.floor((Date.now() - this.questionStartTime) / 1000),
        answeredAt: new Date().toISOString()
      }
      
      this.nextQuestion()
    },

    // End study session
    async endSession(action: 'complete' | 'abandon' = 'complete') {
      if (!this.currentSession) return
      
      try {
        // End session via API
        const response = await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'DELETE',
          body: {
            action
          }
        })
        
        if (response.success && response.data) {
          // Store statistics for results page
          const { statistics } = response.data
          const sessionResults = {
            sessionId: this.currentSession.id,
            examId: this.currentSession.examId,
            examCode: this.currentSession.examCode,
            examName: this.currentSession.examName,
            mode: this.currentSession.mode,
            statistics,
            timeSpentSeconds: this.sessionTime
          }
          
          // Store in session storage for results page
          sessionStorage.setItem('studyResults', JSON.stringify(sessionResults))
        }
      } catch (error) {
        console.error('Failed to end session:', error)
      }
      
      // Stop timer
      this.stopSessionTimer()
      
      // Navigate to results page - preserve the original route format
      const examId = this.currentSession.examId
      const originalRoute = useRoute().params.examId // Get the original route param
      this.resetSession()
      
      await navigateTo(`/study/${originalRoute || examId}/results`)
    },

    // Reset session
    resetSession() {
      this.currentSession = null
      this.currentQuestion = null
      this.selectedAnswers = []
      this.showFeedback = false
      this.error = null
      this.sessionTime = 0
      this.questionStartTime = 0
      this.stopSessionTimer()
    },

    // Timer management
    startSessionTimer() {
      // Store timer reference on the store instance
      if (!(this as any).sessionTimer) {
        (this as any).sessionTimer = setInterval(() => {
          this.sessionTime++
        }, 1000)
      }
    },
    
    stopSessionTimer() {
      if ((this as any).sessionTimer) {
        clearInterval((this as any).sessionTimer)
        (this as any).sessionTimer = null
      }
    },

    // Bookmark current question
    async bookmarkQuestion(add: boolean = true) {
      if (!this.currentQuestion || !this.currentSession) return
      
      try {
        // Update session via API
        await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            bookmark: {
              questionId: this.currentQuestion.id,
              action: add ? 'add' : 'remove'
            }
          }
        })
        
        // Update local state
        if (add && !this.currentSession.bookmarks.includes(this.currentQuestion.id)) {
          this.currentSession.bookmarks.push(this.currentQuestion.id)
        } else if (!add) {
          const index = this.currentSession.bookmarks.indexOf(this.currentQuestion.id)
          if (index > -1) {
            this.currentSession.bookmarks.splice(index, 1)
          }
        }
      } catch (error) {
        console.error('Failed to bookmark question:', error)
      }
    },

    // Flag current question
    async flagQuestion(add: boolean = true) {
      if (!this.currentQuestion || !this.currentSession) return
      
      try {
        // Update session via API
        await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            flag: {
              questionId: this.currentQuestion.id,
              action: add ? 'add' : 'remove'
            }
          }
        })
        
        // Update local state
        if (add && !this.currentSession.flags.includes(this.currentQuestion.id)) {
          this.currentSession.flags.push(this.currentQuestion.id)
        } else if (!add) {
          const index = this.currentSession.flags.indexOf(this.currentQuestion.id)
          if (index > -1) {
            this.currentSession.flags.splice(index, 1)
          }
        }
      } catch (error) {
        console.error('Failed to flag question:', error)
      }
    },

    // Navigate to specific question
    async navigateToQuestion(index: number) {
      if (!this.currentSession || index < 0 || index >= this.currentSession.totalQuestions) return
      
      // Reset UI state
      this.showFeedback = false
      this.selectedAnswers = []
      
      // Update session index
      this.currentSession.currentQuestionIndex = index
      
      // Update on server
      try {
        await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            currentQuestionIndex: index,
            timeSpentSeconds: this.sessionTime
          }
        })
      } catch (error) {
        console.error('Failed to update session progress:', error)
      }
      
      // Set current question
      if (this.currentSession.questions[index]) {
        this.currentQuestion = this.currentSession.questions[index]
        this.questionStartTime = Date.now()
      }
    }
  }
})