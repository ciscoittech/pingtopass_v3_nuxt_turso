import { defineStore } from 'pinia'
import { useSessionOptimizer } from '~/composables/useSessionOptimizer'
import { useRetry } from '~/composables/useRetry'

interface Question {
  id: string
  examId: string
  objectiveId?: string | null
  questionText: string
  questionType: string
  options: string[]
  correctAnswers: number[]
  explanation?: string
  isActive: boolean
  objectiveTitle?: string
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
  isEndingSession: boolean
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
    questionStartTime: 0,
    isEndingSession: false
  }),

  getters: {
    // Check if we have a current question
    hasCurrentQuestion: (state) => {
      return !!state.currentQuestion
    },
    
    // Get current question ID
    currentQuestionId: (state) => {
      return state.currentQuestion?.id || undefined
    },
    
    // Session progress
    sessionProgress: (state) => {
      if (!state.currentSession) return null
      
      const answers = state.currentSession.answers || {}
      const answered = Object.keys(answers).length
      const correct = Object.values(answers)
        .filter(a => a.isCorrect).length
      const incorrect = answered - correct
      const accuracy = answered > 0 ? (correct / answered) * 100 : 0
      
      // Ensure currentQuestionIndex doesn't exceed totalQuestions
      const safeCurrentIndex = Math.min(
        state.currentSession.currentQuestionIndex,
        state.currentSession.totalQuestions - 1
      )
      
      return {
        current: safeCurrentIndex,
        total: state.currentSession.totalQuestions,
        answered,
        correct,
        incorrect,
        accuracy,
        remaining: Math.max(0, state.currentSession.totalQuestions - safeCurrentIndex - 1)
      }
    },

    // Check if can submit answer
    canSubmit: (state) => {
      return state.selectedAnswers.length > 0 && !state.loading && !state.showFeedback
    },

    // Check if session is complete
    isSessionComplete: (state) => {
      if (!state.currentSession) return false
      // Session is complete when we've answered all questions and try to go to the next
      return state.currentSession.currentQuestionIndex >= state.currentSession.totalQuestions
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
        const { retry } = useRetry()
        
        // API call to start session with retry logic
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
        
        const response = await retry(
          async () => {
            return await $fetch('/api/sessions/study/start', {
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
          },
          {
            maxRetries: 2,
            retryDelay: 1000,
            onRetry: (attempt, error) => {
              console.log(`[Study Store] Retry attempt ${attempt} after error:`, error)
              this.error = `Connection failed. Retrying... (${attempt}/2)`
            }
          }
        )
        
        const endTime = performance.now()
        console.log(`[Study Store] API call took ${endTime - startTime}ms`)
        console.log('[Study Store] API response:', response)
        
        if (response.success && response.data) {
          // Validate response structure
          if (!response.data.session || !response.data.questions) {
            console.error('[Study Store] Invalid response structure:', {
              hasSession: !!response.data.session,
              hasQuestions: !!response.data.questions,
              responseKeys: Object.keys(response.data)
            })
            throw new Error('Invalid response structure from API')
          }
          
          const { session, questions, isResuming } = response.data
          console.log('[Study Store] Session data:', session)
          console.log('[Study Store] Questions from response:', questions)
          console.log('[Study Store] Questions count:', questions?.length || 0)
          console.log('[Study Store] First question:', questions?.[0])
          console.log('[Study Store] Is resuming:', isResuming)
          
          // Additional validation
          if (!Array.isArray(questions)) {
            console.error('[Study Store] Questions is not an array:', typeof questions)
            throw new Error('Questions must be an array')
          }
          
          if (questions.length === 0) {
            console.error('[Study Store] No questions returned from API')
            throw new Error('No questions available for this exam')
          }
          
          // Transform API response to store format
          // Parse JSON strings from database
          const parseJsonField = (field: any, defaultValue: any) => {
            if (typeof field === 'string') {
              try {
                return JSON.parse(field)
              } catch (e) {
                console.error('[Study Store] Failed to parse JSON field:', field, e)
                return defaultValue
              }
            }
            return field || defaultValue
          }
          
          // Transform and deep clone questions array to ensure proper format
          const sessionQuestions = Array.isArray(questions) ? questions.map(q => {
            // Ensure each question has the expected structure
            return {
              id: q.id,
              examId: q.examId,
              objectiveId: q.objectiveId || null,
              questionText: q.questionText,
              questionType: q.questionType,
              options: Array.isArray(q.options) ? [...q.options] : [],
              correctAnswers: q.correctAnswers || q.correctAnswer || [],
              explanation: q.explanation || '',
              isActive: q.isActive !== undefined ? q.isActive : true,
              objectiveTitle: q.objectiveTitle
            }
          }) : []
          
          console.log('[Study Store] Transformed questions:', {
            originalQuestionsLength: questions?.length,
            transformedQuestionsLength: sessionQuestions.length,
            firstQuestionId: sessionQuestions[0]?.id,
            firstQuestionStructure: sessionQuestions[0] ? Object.keys(sessionQuestions[0]) : []
          })
          
          this.currentSession = {
            id: session.id,
            examId: session.examId,
            examCode: config.examCode,
            examName: config.examName,
            mode: session.mode,
            status: session.status,
            totalQuestions: sessionQuestions.length, // Use actual questions length instead of server value
            currentQuestionIndex: session.currentQuestionIndex,
            questionsOrder: parseJsonField(session.questionsOrder, []),
            questions: sessionQuestions,
            answers: parseJsonField(session.answers, {}),
            bookmarks: parseJsonField(session.bookmarks, []),
            flags: parseJsonField(session.flags, []),
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
          
          console.log('[Study Store] Session created with totalQuestions adjustment:', {
            serverTotalQuestions: session.totalQuestions,
            actualQuestionsLength: sessionQuestions.length,
            usingTotalQuestions: sessionQuestions.length
          })
          
          // Validate session was created properly
          console.log('[Study Store] Session created, validating questions assignment:', {
            sessionId: this.currentSession.id,
            questionsAssigned: Array.isArray(this.currentSession.questions),
            questionsLength: this.currentSession.questions?.length,
            firstQuestionAfterAssignment: this.currentSession.questions?.[0]?.id
          })
          
          // Set current question
          console.log('[Study Store] About to set current question...')
          console.log('[Study Store] Session questions check:', {
            hasQuestions: !!this.currentSession.questions,
            questionsIsArray: Array.isArray(this.currentSession.questions),
            questionsLength: this.currentSession.questions?.length,
            currentIndex: session.currentQuestionIndex
          })
          
          if (this.currentSession.questions && Array.isArray(this.currentSession.questions) && this.currentSession.questions.length > 0) {
            const safeIndex = Math.min(session.currentQuestionIndex, this.currentSession.questions.length - 1)
            console.log('[Study Store] Setting current question at safe index:', safeIndex)
            
            const questionAtIndex = this.currentSession.questions[safeIndex]
            console.log('[Study Store] Question at index:', {
              safeIndex,
              questionExists: !!questionAtIndex,
              questionId: questionAtIndex?.id,
              questionType: typeof questionAtIndex,
              questionKeys: questionAtIndex ? Object.keys(questionAtIndex) : []
            })
            
            if (questionAtIndex) {
              // Deep debugging before assignment
              console.log('[Study Store] Before assignment - currentQuestion:', this.currentQuestion)
              console.log('[Study Store] About to assign question:', questionAtIndex)
              
              // Use $patch to ensure reactivity
              this.$patch((state) => {
                state.currentQuestion = questionAtIndex
              })
              
              // Deep debugging after assignment
              console.log('[Study Store] After assignment - currentQuestion:', this.currentQuestion)
              console.log('[Study Store] State check after assignment:', {
                currentQuestionAssigned: !!this.currentQuestion,
                currentQuestionId: this.currentQuestion?.id,
                stateCurrentQuestion: this.$state.currentQuestion,
                hasCurrentQuestionGetter: this.hasCurrentQuestion
              })
              
              this.questionStartTime = Date.now()
              console.log('[Study Store] Current question set successfully:', {
                questionId: this.currentQuestion?.id,
                questionText: this.currentQuestion?.questionText?.substring(0, 50) + '...',
                optionsCount: this.currentQuestion?.options?.length
              })
            } else {
              console.error('[Study Store] Question at index is null/undefined:', safeIndex)
              throw new Error(`No question found at index ${safeIndex}`)
            }
          } else {
            console.error('[Study Store] Critical error: No questions available!', {
              questionsLength: this.currentSession.questions?.length || 0,
              questionsIsArray: Array.isArray(this.currentSession.questions),
              currentIndex: session.currentQuestionIndex,
              questionsFromResponse: questions?.length || 0,
              sessionQuestionsLength: sessionQuestions?.length || 0
            })
            throw new Error('No questions available in session')
          }
          
          // Initialize session time
          this.sessionTime = session.timeSpentSeconds || 0
          
          // Save to localStorage for quick resume
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastStudiedExam', JSON.stringify({
              examId: config.examId,
              examCode: config.examCode,
              examName: config.examName
            }))
          }
          
          // Start session timer
          this.startSessionTimer()
          
          console.log('[Study Store] Session initialized successfully')
          console.log('[Study Store] Final state:', {
            hasSession: !!this.currentSession,
            hasQuestions: !!this.currentSession?.questions,
            questionsLength: this.currentSession?.questions?.length,
            hasCurrentQuestion: this.hasCurrentQuestion,
            currentQuestionId: this.currentQuestionId,
            currentQuestionIndex: this.currentSession.currentQuestionIndex,
            totalQuestions: this.currentSession.totalQuestions
          })
          
          // Final validation - if we don't have a current question at this point, something is wrong
          if (!this.currentQuestion) {
            console.error('[Study Store] CRITICAL: currentQuestion not set after initialization!')
            console.error('[Study Store] Debug info:', {
              sessionQuestions: this.currentSession?.questions,
              currentIndex: this.currentSession?.currentQuestionIndex,
              stateKeys: Object.keys(this.$state)
            })
            // Try to recover by setting the first question
            if (this.currentSession?.questions && this.currentSession.questions.length > 0) {
              console.log('[Study Store] Attempting recovery - setting first question')
              this.$patch((state) => {
                state.currentQuestion = this.currentSession!.questions[0]
              })
            }
          }
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
      
      // Don't submit if session is already completed or being ended
      if (this.currentSession.status !== 'active' || this.isEndingSession) {
        console.warn('[Study Store] Cannot submit answer - session is not active')
        return
      }
      
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
            if (this.currentSession.metadata.autoAdvance && !this.isEndingSession) {
              setTimeout(() => {
                if (!this.isEndingSession) {
                  this.nextQuestion()
                }
              }, 3000)
            }
          } else if (!this.isEndingSession) {
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
      
      // Don't proceed if session is not active or being ended
      if (this.currentSession.status !== 'active' || this.isEndingSession) {
        console.warn('[Study Store] Cannot go to next question - session is not active')
        return
      }
      
      this.showFeedback = false
      this.selectedAnswers = []
      
      // Debug logging
      console.log('[Study Store] nextQuestion called:', {
        currentIndex: this.currentSession.currentQuestionIndex,
        totalQuestions: this.currentSession.totalQuestions,
        actualQuestionsLength: this.currentSession.questions?.length,
        questionsMatch: this.currentSession.totalQuestions === this.currentSession.questions?.length
      })
      
      // Check if we would go past the last question
      const nextIndex = this.currentSession.currentQuestionIndex + 1
      
      // Use actual questions array length instead of totalQuestions
      const actualTotalQuestions = this.currentSession.questions?.length || this.currentSession.totalQuestions
      
      if (nextIndex >= actualTotalQuestions) {
        console.log('[Study Store] Reached end of session:', {
          nextIndex,
          actualTotalQuestions,
          totalQuestionsField: this.currentSession.totalQuestions
        })
        // Session is complete - add small delay to ensure UI updates
        setTimeout(() => {
          this.endSession('complete')
        }, 100)
        return
      }
      
      // Move to next question
      this.currentSession.currentQuestionIndex = nextIndex
      
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
      console.log('[Study Store] Getting question at index:', this.currentSession.currentQuestionIndex)
      
      if (this.currentSession.questions && this.currentSession.questions[this.currentSession.currentQuestionIndex]) {
        const nextQuestion = this.currentSession.questions[this.currentSession.currentQuestionIndex]
        console.log('[Study Store] Found next question:', {
          questionId: nextQuestion.id,
          questionIndex: this.currentSession.currentQuestionIndex
        })
        
        // Use $patch to ensure reactivity
        this.$patch((state) => {
          state.currentQuestion = nextQuestion
        })
        
        // Reset question timer
        this.questionStartTime = Date.now()
      } else {
        // This shouldn't happen since we load all questions upfront
        console.error('[Study Store] No question found at index:', this.currentSession.currentQuestionIndex)
        console.error('[Study Store] Questions array:', this.currentSession.questions)
        console.error('[Study Store] Questions length:', this.currentSession.questions?.length)
        this.error = 'Failed to load next question'
        // Try to end session gracefully
        await this.endSession('abandon')
      }
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

    // Set current question by index
    setCurrentQuestion(index: number) {
      if (!this.currentSession || !this.currentSession.questions) {
        console.error('[Study Store] Cannot set current question - no session or questions')
        return false
      }
      
      if (index < 0 || index >= this.currentSession.questions.length) {
        console.error('[Study Store] Invalid question index:', index)
        return false
      }
      
      console.log('[Study Store] Setting current question to index:', index)
      const question = this.currentSession.questions[index]
      
      if (question) {
        this.$patch((state) => {
          state.currentQuestion = question
          state.currentSession!.currentQuestionIndex = index
          state.selectedAnswers = []
          state.showFeedback = false
        })
        this.questionStartTime = Date.now()
        
        console.log('[Study Store] Current question set:', {
          index,
          questionId: this.currentQuestion?.id,
          hasCurrentQuestion: this.hasCurrentQuestion
        })
        return true
      }
      
      return false
    },

    // End study session
    async endSession(action: 'complete' | 'abandon' = 'complete', routeParam?: string) {
      console.log('[Study Store] endSession called with action:', action, 'routeParam:', routeParam)
      const startTime = performance.now()
      
      if (!this.currentSession || this.isEndingSession) {
        console.log('[Study Store] Session already ending or no session exists')
        return
      }
      
      // Prevent multiple calls
      this.isEndingSession = true
      
      // Store current session data before API call
      const sessionResults = {
        sessionId: this.currentSession.id,
        examId: this.currentSession.examId,
        examCode: this.currentSession.examCode,
        examName: this.currentSession.examName,
        mode: this.currentSession.mode,
        statistics: {
          totalQuestions: this.currentSession.totalQuestions,
          questionsAnswered: Object.keys(this.currentSession.answers || {}).length,
          correctAnswers: Object.values(this.currentSession.answers || {}).filter((a: any) => a.isCorrect).length,
          incorrectAnswers: Object.values(this.currentSession.answers || {}).filter((a: any) => !a.isCorrect).length,
          accuracy: 0,
          timeSpentSeconds: this.sessionTime,
          bookmarkedCount: (this.currentSession.bookmarks || []).length,
          flaggedCount: (this.currentSession.flags || []).length
        },
        timeSpentSeconds: this.sessionTime
      }
      
      // Calculate accuracy
      if (sessionResults.statistics.questionsAnswered > 0) {
        sessionResults.statistics.accuracy = (sessionResults.statistics.correctAnswers / sessionResults.statistics.questionsAnswered) * 100
      }
      
      // Store in session storage immediately
      console.log('[Study Store] Storing session results:', sessionResults)
      sessionStorage.setItem('studyResults', JSON.stringify(sessionResults))
      console.log(`[Study Store] SessionStorage set in ${performance.now() - startTime}ms`)
      
      try {
        // End session via API
        console.log('[Study Store] Making API call to end session...')
        const apiStartTime = performance.now()
        const response = await $fetch(`/api/sessions/study/${this.currentSession.id}`, {
          method: 'DELETE',
          body: {
            action
          }
        })
        
        console.log(`[Study Store] API call completed in ${performance.now() - apiStartTime}ms`)
        
        if (response.success && response.data && response.data.statistics) {
          // Update with server statistics if available
          const updatedResults = {
            ...sessionResults,
            statistics: response.data.statistics
          }
          sessionStorage.setItem('studyResults', JSON.stringify(updatedResults))
          console.log('[Study Store] Updated sessionStorage with server statistics')
        }
      } catch (error: any) {
        console.error('Failed to end session:', error)
        console.log(`[Study Store] API error after ${performance.now() - apiStartTime}ms`)
        // Session data is already in sessionStorage, so navigation will work
      } finally {
        // Stop timer
        console.log('[Study Store] Stopping session timer...')
        this.stopSessionTimer()
        
        // Navigate to results page - use provided route param or exam ID
        const examId = this.currentSession?.examId
        const navigateParam = routeParam || examId
        
        console.log('[Study Store] Preparing navigation, navigateParam:', navigateParam)
        
        // Navigate BEFORE resetting session state
        const navStartTime = performance.now()
        
        if (navigateParam) {
          const resultsPath = `/study/${navigateParam}-results`
          console.log('[Study Store] Navigating to results page:', resultsPath)
          console.log(`[Study Store] Total time before navigation: ${performance.now() - startTime}ms`)
          
          // Ensure sessionStorage is written before navigation
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Try using router.push as an alternative to navigateTo
          try {
            const router = useRouter()
            await router.push(resultsPath)
            console.log(`[Study Store] Navigation completed in ${performance.now() - navStartTime}ms`)
          } catch (navError) {
            console.error('[Study Store] Navigation error:', navError)
            // Fallback to navigateTo
            await navigateTo(resultsPath)
          }
          
          // Reset session state AFTER navigation
          this.resetSession()
        } else {
          console.error('[Study Store] No route parameter for navigation')
          this.resetSession()
          await navigateTo('/study')
        }
        
        console.log(`[Study Store] endSession total time: ${performance.now() - startTime}ms`)
      }
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
      this.isEndingSession = false
      this.stopSessionTimer()
    },

    // Timer management
    startSessionTimer() {
      // Store timer reference on the store instance
      if (!(this as any).sessionTimer) {
        (this as any).sessionTimer = window.setInterval(() => {
          this.sessionTime++
        }, 1000)
      }
    },
    
    stopSessionTimer() {
      if ((this as any).sessionTimer) {
        window.clearInterval((this as any).sessionTimer);
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