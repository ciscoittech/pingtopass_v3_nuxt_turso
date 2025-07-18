import { defineStore } from 'pinia'

interface Question {
  id: string
  questionText: string
  questionType: 'multiple-choice' | 'multiple-answer'
  options: string[]
  // Note: correctAnswers not included in test mode for security
  codeBlock?: string
}

interface TestSession {
  id: string
  examId: string
  examCode: string
  examName: string
  status: 'active' | 'paused' | 'submitted' | 'expired' | 'abandoned'
  totalQuestions: number
  currentQuestionIndex: number
  questionsOrder: string[]
  questions: Question[]
  answers: Record<string, {
    questionIndex: number
    selectedAnswers: number[]
    flagged: boolean
    timeSpent: number
    answeredAt: string
  }>
  flags: Array<{ questionId: string; questionIndex: number }>
  startedAt: number
  expiresAt: number
  lastActivityAt: number
  timeLimitSeconds: number
  passingScore: number
  autoSaveCount: number
  lastAutoSaveAt: number
  submitted?: boolean
}

interface TestState {
  currentSession: TestSession | null
  currentQuestion: Question | null
  selectedAnswers: number[]
  loading: boolean
  error: string | null
  remainingTime: number
  isTimerRunning: boolean
  isSaving: boolean
  lastSaveTime: number
  showSummary: boolean
  elapsedTime: number
}

export const useTestStore = defineStore('test', {
  state: (): TestState => ({
    currentSession: null,
    currentQuestion: null,
    selectedAnswers: [],
    loading: false,
    error: null,
    remainingTime: 0,
    isTimerRunning: false,
    isSaving: false,
    lastSaveTime: 0,
    showSummary: false,
    elapsedTime: 0
  }),

  getters: {
    // Session progress
    sessionProgress: (state) => {
      if (!state.currentSession) return null
      
      const answered = Object.keys(state.currentSession.answers).length
      const flagged = state.currentSession.flags.length
      
      return {
        current: state.currentSession.currentQuestionIndex,
        total: state.currentSession.totalQuestions,
        answered,
        unanswered: state.currentSession.totalQuestions - answered,
        flagged,
        percentComplete: Math.round((answered / state.currentSession.totalQuestions) * 100)
      }
    },

    // Check if can submit
    canSubmit: (state) => {
      return !state.loading && !state.isSaving
    },

    // Get current question number
    currentQuestionNumber: (state) => {
      if (!state.currentSession) return 0
      return state.currentSession.currentQuestionIndex + 1
    },

    // Check if question is answered
    isQuestionAnswered: (state) => {
      if (!state.currentQuestion || !state.currentSession) return false
      return state.currentQuestion.id in state.currentSession.answers
    },

    // Check if question is flagged
    isQuestionFlagged: (state) => {
      if (!state.currentQuestion || !state.currentSession) return false
      return state.currentSession.flags.some(f => f.questionId === state.currentQuestion!.id)
    },

    // Format remaining time
    formattedRemainingTime: (state) => {
      const hours = Math.floor(state.remainingTime / 3600)
      const minutes = Math.floor((state.remainingTime % 3600) / 60)
      const seconds = state.remainingTime % 60
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },

    // Check if time is running out (< 5 minutes)
    isTimeRunningOut: (state) => {
      return state.remainingTime > 0 && state.remainingTime < 300
    },

    // Get current question's selected answers
    currentAnswers: (state) => {
      return state.selectedAnswers
    },

    // Check if current question is flagged
    isCurrentFlagged: (state) => {
      if (!state.currentQuestion || !state.currentSession) return false
      return state.currentSession.flags.some(f => f.questionId === state.currentQuestion!.id)
    },

    // Get total questions count
    totalQuestions: (state) => {
      return state.currentSession?.totalQuestions || 0
    },

    // Get current question index
    currentQuestionIndex: (state) => {
      return state.currentSession?.currentQuestionIndex || 0
    },

    // Get answers object
    answers: (state) => {
      return state.currentSession?.answers || {}
    },

    // Get flagged questions
    flagged: (state) => {
      return state.currentSession?.flags || []
    }
  },

  actions: {
    // Start a new test session
    async startSession(config: {
      examId: string
      examCode: string
      examName: string
      timeLimitMinutes: number
      questionCount: number
      passingScore: number
    }) {
      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch('/api/sessions/test/start', {
          method: 'POST',
          body: {
            examId: config.examId,
            timeLimitMinutes: config.timeLimitMinutes,
            maxQuestions: config.questionCount
          }
        })
        
        if (response.success && response.data) {
          const { session, questions, isResuming } = response.data
          
          console.log('[Test Store] Session response:', session)
          console.log('[Test Store] Questions count:', questions?.length)
          console.log('[Test Store] Session answers type:', typeof session.answers)
          console.log('[Test Store] Session answers:', session.answers)
          
          // Transform to store format
          this.currentSession = {
            id: session.id,
            examId: session.examId,
            examCode: config.examCode,
            examName: config.examName,
            status: session.status,
            totalQuestions: session.totalQuestions,
            currentQuestionIndex: session.currentQuestionIndex || 0,
            questionsOrder: session.questionsOrder,
            questions: questions || [],
            answers: session.answers || {},
            flags: session.flags || [],
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
            lastActivityAt: session.lastActivityAt,
            timeLimitSeconds: session.timeLimitSeconds,
            passingScore: session.passingScore,
            autoSaveCount: session.autoSaveCount || 0,
            lastAutoSaveAt: session.lastAutoSaveAt || 0
          }
          
          // Set current question
          console.log('[Test Store] Setting current question:', {
            questionsLength: questions?.length,
            currentQuestionIndex: session.currentQuestionIndex,
            hasQuestions: questions && questions.length > 0
          })
          
          if (questions && questions.length > 0) {
            const questionIndex = session.currentQuestionIndex || 0
            this.currentQuestion = questions[questionIndex]
            
            console.log('[Test Store] Current question set:', {
              questionIndex,
              currentQuestion: this.currentQuestion,
              questionId: this.currentQuestion?.id
            })
            
            // Load saved answer if resuming
            if (isResuming && this.currentQuestion) {
              const savedAnswer = this.currentSession.answers[this.currentQuestion.id]
              if (savedAnswer) {
                this.selectedAnswers = savedAnswer.selectedAnswers
              }
            }
          } else {
            console.error('[Test Store] No questions available to set as current')
          }
          
          // Calculate remaining time
          const now = Math.floor(Date.now() / 1000)
          const sessionEndTime = session.startedAt + session.timeLimitSeconds
          this.remainingTime = Math.max(0, sessionEndTime - now)
          
          console.log('[Test Store] Timer calculation:', {
            now,
            startedAt: session.startedAt,
            timeLimitSeconds: session.timeLimitSeconds,
            sessionEndTime,
            remainingTime: this.remainingTime
          })
          
          // Save to localStorage for quick resume
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastStudiedExam', JSON.stringify({
              examId: config.examId,
              examCode: config.examCode,
              examName: config.examName
            }))
            
            // Update active session tracking
            const { updateSession } = useActiveSession()
            updateSession({
              examId: config.examId,
              examCode: config.examCode,
              examName: config.examName,
              mode: 'test',
              lastActivity: new Date(),
              progress: 0,
              questionsAnswered: 0
            })
          }
          
          // Start timer
          this.startTimer()
          
          return true
        }
      } catch (error: any) {
        console.error('[Test Store] Error starting session:', error)
        this.error = error.message || 'Failed to start test session'
      } finally {
        this.loading = false
      }
      
      return false
    },

    // Select/deselect an answer
    toggleAnswer(index: number) {
      if (!this.currentQuestion) return
      
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

    // Save current answer and move to next
    async saveAndNext() {
      if (!this.currentQuestion || !this.currentSession) return
      
      // Save answer
      await this.saveAnswer()
      
      // Move to next
      await this.nextQuestion()
    },

    // Save current answer
    async saveAnswer() {
      if (!this.currentQuestion || !this.currentSession || this.selectedAnswers.length === 0) return
      
      this.isSaving = true
      
      try {
        // Update local state first
        this.currentSession.answers[this.currentQuestion.id] = {
          questionIndex: this.currentSession.currentQuestionIndex,
          selectedAnswers: [...this.selectedAnswers],
          flagged: this.isQuestionFlagged,
          timeSpent: 0, // Will be calculated server-side
          answeredAt: new Date().toISOString()
        }
        
        // Save to server
        await $fetch(`/api/sessions/test/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            currentQuestionIndex: this.currentSession.currentQuestionIndex,
            answers: this.currentSession.answers,
            lastActivityAt: Math.floor(Date.now() / 1000)
          }
        })
        
        this.lastSaveTime = Date.now()
      } catch (error: any) {
        console.error('[Test Store] Error saving answer:', error)
      } finally {
        this.isSaving = false
      }
    },

    // Move to next question
    async nextQuestion() {
      if (!this.currentSession) return
      
      // Save current answer if any
      if (this.selectedAnswers.length > 0) {
        await this.saveAnswer()
      }
      
      // Check if last question
      if (this.currentSession.currentQuestionIndex >= this.currentSession.totalQuestions - 1) {
        return
      }
      
      // Move to next
      this.currentSession.currentQuestionIndex++
      this.selectedAnswers = []
      
      // Load next question
      if (this.currentSession.questions[this.currentSession.currentQuestionIndex]) {
        this.currentQuestion = this.currentSession.questions[this.currentSession.currentQuestionIndex]
        
        // Load saved answer if any
        const savedAnswer = this.currentSession.answers[this.currentQuestion.id]
        if (savedAnswer) {
          this.selectedAnswers = savedAnswer.selectedAnswers
        }
      }
    },

    // Move to previous question
    async previousQuestion() {
      if (!this.currentSession || this.currentSession.currentQuestionIndex <= 0) return
      
      // Save current answer if any
      if (this.selectedAnswers.length > 0) {
        await this.saveAnswer()
      }
      
      // Move to previous
      this.currentSession.currentQuestionIndex--
      this.selectedAnswers = []
      
      // Load previous question
      if (this.currentSession.questions[this.currentSession.currentQuestionIndex]) {
        this.currentQuestion = this.currentSession.questions[this.currentSession.currentQuestionIndex]
        
        // Load saved answer if any
        const savedAnswer = this.currentSession.answers[this.currentQuestion.id]
        if (savedAnswer) {
          this.selectedAnswers = savedAnswer.selectedAnswers
        }
      }
    },

    // Navigate to specific question
    async navigateToQuestion(index: number) {
      if (!this.currentSession || index < 0 || index >= this.currentSession.totalQuestions) return
      
      // Save current answer if any
      if (this.selectedAnswers.length > 0) {
        await this.saveAnswer()
      }
      
      // Navigate to question
      this.currentSession.currentQuestionIndex = index
      this.selectedAnswers = []
      
      // Load question
      if (this.currentSession.questions[index]) {
        this.currentQuestion = this.currentSession.questions[index]
        
        // Load saved answer if any
        const savedAnswer = this.currentSession.answers[this.currentQuestion.id]
        if (savedAnswer) {
          this.selectedAnswers = savedAnswer.selectedAnswers
        }
      }
    },

    // Toggle flag for current question
    async toggleFlag() {
      if (!this.currentQuestion || !this.currentSession) return
      
      const flagIndex = this.currentSession.flags.findIndex(f => f.questionId === this.currentQuestion!.id)
      
      if (flagIndex > -1) {
        // Remove flag
        this.currentSession.flags.splice(flagIndex, 1)
      } else {
        // Add flag
        this.currentSession.flags.push({
          questionId: this.currentQuestion.id,
          questionIndex: this.currentSession.currentQuestionIndex
        })
      }
      
      // Update server
      try {
        await $fetch(`/api/sessions/test/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            flag: {
              questionId: this.currentQuestion.id,
              questionIndex: this.currentSession.currentQuestionIndex,
              flagged: flagIndex === -1
            }
          }
        })
      } catch (error) {
        console.error('Failed to update flag:', error)
      }
    },

    // Submit test
    async submitTest() {
      if (!this.currentSession || !this.canSubmit) return
      
      // Save any pending answer
      if (this.selectedAnswers.length > 0) {
        await this.saveAnswer()
      }
      
      this.loading = true
      
      try {
        const response = await $fetch(`/api/sessions/test/${this.currentSession.id}/submit`, {
          method: 'POST'
        })
        
        if (response.success && response.data) {
          // Stop timer
          this.stopTimer()
          
          // Store results for display
          const { results } = response.data
          sessionStorage.setItem('testResults', JSON.stringify({
            sessionId: this.currentSession.id,
            examId: this.currentSession.examId,
            examCode: this.currentSession.examCode,
            examName: this.currentSession.examName,
            ...results
          }))
          
          // Reset session first to prevent saveProgress calls
          this.resetSession()
          
          // Navigate to results page
          await navigateTo('/test/results')
          
          return true
        }
      } catch (error: any) {
        console.error('[Test Store] Error submitting test:', error)
        this.error = error.message || 'Failed to submit test'
      } finally {
        this.loading = false
      }
      
      return false
    },

    // Timer management
    startTimer() {
      if (this.isTimerRunning || this.remainingTime <= 0) return
      
      this.isTimerRunning = true
      
      // Update every second
      const timerInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--
          
          // Auto-submit when time runs out
          if (this.remainingTime === 0) {
            this.submitTest()
          }
        } else {
          clearInterval(timerInterval)
          this.isTimerRunning = false
        }
      }, 1000)
      
      // Store interval reference
      ;(this as any).timerInterval = timerInterval
    },

    stopTimer() {
      this.isTimerRunning = false
      if ((this as any).timerInterval) {
        clearInterval((this as any).timerInterval)
        ;(this as any).timerInterval = null
      }
    },

    // Reset session
    resetSession() {
      this.currentSession = null
      this.currentQuestion = null
      this.selectedAnswers = []
      this.error = null
      this.remainingTime = 0
      this.isTimerRunning = false
      this.isSaving = false
      this.lastSaveTime = 0
      this.stopTimer()
    },

    // Auto-save functionality
    async autoSave() {
      if (!this.currentSession || this.isSaving) return
      
      // Only auto-save if there are changes since last save
      const timeSinceLastSave = Date.now() - this.lastSaveTime
      if (timeSinceLastSave < 30000) return // Auto-save every 30 seconds
      
      this.isSaving = true
      
      try {
        await $fetch(`/api/sessions/test/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            currentQuestionIndex: this.currentSession.currentQuestionIndex,
            answers: this.currentSession.answers,
            lastActivityAt: Math.floor(Date.now() / 1000),
            autoSave: true
          }
        })
        
        this.lastSaveTime = Date.now()
        this.currentSession.autoSaveCount++
        this.currentSession.lastAutoSaveAt = Math.floor(Date.now() / 1000)
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        this.isSaving = false
      }
    },

    // Start a test with exam configuration
    async startTest(config: {
      examId: string
      examCode: string
      examName: string
      duration: number
      questionCount?: number
    }) {
      console.log('[Test Store] Starting test with config:', config)
      
      // Convert duration from seconds to minutes for the API
      const timeLimitMinutes = Math.floor(config.duration / 60)
      
      console.log('[Test Store] Calling startSession with:', {
        examId: config.examId,
        examCode: config.examCode,
        examName: config.examName,
        timeLimitMinutes,
        questionCount: config.questionCount || 50,
        passingScore: 70
      })
      
      const result = await this.startSession({
        examId: config.examId,
        examCode: config.examCode,
        examName: config.examName,
        timeLimitMinutes,
        questionCount: config.questionCount || 50,
        passingScore: 70 // Default passing score
      })
      
      console.log('[Test Store] StartSession result:', result)
      return result
    },

    // Show test summary
    showTestSummary() {
      this.showSummary = true
    },

    // Continue reviewing questions
    continueReview() {
      this.showSummary = false
    },

    // Navigate to a specific question
    async goToQuestion(index: number) {
      await this.navigateToQuestion(index)
      this.showSummary = false
    },

    // Save current progress
    async saveProgress() {
      if (!this.currentSession) return
      
      try {
        await $fetch(`/api/sessions/test/${this.currentSession.id}`, {
          method: 'PUT',
          body: {
            currentQuestionIndex: this.currentSession.currentQuestionIndex,
            answers: this.currentSession.answers,
            flags: this.currentSession.flags,
            lastActivityAt: Math.floor(Date.now() / 1000)
          }
        })
        
        console.log('[Test Store] Progress saved successfully')
      } catch (error) {
        console.error('[Test Store] Failed to save progress:', error)
      }
    }
  }
})