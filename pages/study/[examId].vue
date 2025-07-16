<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import StudyModeConfig from '@/components/study/StudyModeConfig.vue'
import StudyProgressBar from '@/components/study/StudyProgressBar.vue'
import StudyQuestionCard from '@/components/study/StudyQuestionCard.vue'
import StudyExplanationCard from '@/components/study/StudyExplanationCard.vue'
import StudyNavigationBar from '@/components/study/StudyNavigationBar.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ErrorNotification from '@/components/ErrorNotification.vue'
import { useStudyStore } from '~/stores/study'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

console.log('[Study Page] Loading with examId:', examId)
console.log('[Study Page] Full route params:', route.params)
console.log('[Study Page] Full route path:', route.path)

// Store
const studyStore = useStudyStore()

// Error handling
const { handleError, currentError, clearError } = useErrorHandler()

// Local state
const sessionStarted = ref(false)
const pageError = ref<any>(null)

// Computed bookmark/flag state from store
const questionBookmarked = computed(() => {
  if (!studyStore.currentQuestion || !studyStore.currentSession) return false
  return studyStore.currentSession.bookmarks.includes(studyStore.currentQuestion.id)
})

const questionFlagged = computed(() => {
  if (!studyStore.currentQuestion || !studyStore.currentSession) return false
  return studyStore.currentSession.flags.includes(studyStore.currentQuestion.id)
})

// Get exam info by ID
const { data: examData, error: examError, pending: examPending } = await useFetch(`/api/exams/${examId}`)
const exam = computed(() => examData.value?.data || null)

// Watch for exam loading errors (don't throw immediately during SSR)
const examLoadError = ref<any>(null)
watchEffect(() => {
  if (examError.value && !examPending.value) {
    console.error('[Study Page] Failed to load exam:', examError.value)
    examLoadError.value = examError.value
  } else if (!exam.value && !examPending.value && examData.value) {
    console.error('[Study Page] No exam data found for ID:', examId)
    examLoadError.value = new Error('Exam not found')
  } else {
    examLoadError.value = null
  }
})

// Breadcrumb
const page = ref({ title: 'Study Mode' })
const breadcrumbs = computed(() => [
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Exams',
    disabled: false,
    to: '/exams'
  },
  {
    text: exam.value?.code || exam.value?.examCode || 'Study',
    disabled: false,
    to: `/exams/${examId}`
  },
  {
    text: 'Study Mode',
    disabled: true,
    to: ''
  }
])


// Get total questions available
const { data: questionsData, pending: questionsPending } = await useFetch(`/api/exams/${examId}/questions/count`)
const totalQuestions = computed(() => questionsData.value?.data?.count || 0)

// Use the actual exam ID from the fetched data for session start
const actualExamId = computed(() => exam.value?.id || examId)

// SEO - use watchEffect to update when exam data loads
watchEffect(() => {
  if (exam.value) {
    useSeoMeta({
      title: `Study Mode - ${exam.value.examCode || exam.value.code} | PingToPass`,
      description: `Practice ${exam.value.examName || exam.value.name} certification exam questions with instant feedback and explanations.`
    })
  }
})

// Start study session
const startStudySession = async (config: any) => {
  console.log('[Study Page] startStudySession called with config:', config)
  console.log('[Study Page] Exam data:', {
    examId: examId,
    actualExamId: actualExamId.value,
    examData: exam.value
  })
  
  clearError()
  
  try {
    console.log('[Study Page] Calling studyStore.startSession...')
    const startTime = performance.now()
    
    const sessionConfig = {
      examId: actualExamId.value, // Use the actual exam ID from database
      examCode: exam.value?.code || exam.value?.examCode || '',
      examName: exam.value?.name || exam.value?.examName || '',
      ...config
    }
    
    console.log('[Study Page] Session config:', sessionConfig)
    
    const success = await studyStore.startSession(sessionConfig)
    
    const endTime = performance.now()
    console.log(`[Study Page] studyStore.startSession took ${endTime - startTime}ms, success: ${success}`)
    
    if (success) {
      console.log('[Study Page] Session started successfully, setting sessionStarted to true')
      sessionStarted.value = true
      console.log('[Study Page] Current session:', studyStore.currentSession)
      console.log('[Study Page] Current question:', studyStore.currentQuestion)
    } else {
      console.error('[Study Page] Session start failed')
      console.error('[Study Page] Store error:', studyStore.error)
      handleError(
        { code: 'SESSION_START_FAILED', message: studyStore.error || 'Failed to start study session' },
        'Starting study session'
      )
    }
  } catch (error) {
    console.error('[Study Page] Error in startStudySession:', error)
    handleError(error, 'Starting study session')
  }
}

// Actions
const handleAnswerSelect = (index: number) => {
  studyStore.toggleAnswer(index)
}

const handleSubmit = () => {
  studyStore.submitAnswer()
}

const handleContinue = () => {
  studyStore.nextQuestion()
}

const handleSkip = () => {
  studyStore.skipQuestion()
}

const handleBookmark = async () => {
  await studyStore.bookmarkQuestion(!questionBookmarked.value)
}

const handleFlag = async () => {
  await studyStore.flagQuestion(!questionFlagged.value)
}

const handlePauseSession = () => {
  // TODO: Implement pause functionality
  console.log('Pause session')
}

const handleEndSession = () => {
  if (confirm('Are you sure you want to end this study session?')) {
    studyStore.endSession()
  }
}

const handleNavigate = async (index: number) => {
  // Save current answer if any
  if (studyStore.selectedAnswers.length > 0 && !studyStore.showFeedback) {
    await studyStore.submitAnswer()
  }
  
  // Navigate to specific question
  studyStore.navigateToQuestion(index)
}

const handleReportIssue = () => {
  // TODO: Implement report issue functionality
  console.log('Report issue with question')
}

// Computed
const currentProgress = computed(() => {
  const progress = studyStore.sessionProgress
  if (!progress || !studyStore.currentSession) return null
  
  return {
    examName: studyStore.currentSession.examName,
    current: progress.current + 1, // Add 1 for display (1-based instead of 0-based)
    total: progress.total,
    correct: progress.correct,
    incorrect: progress.incorrect,
    timeSeconds: studyStore.sessionTime,
    mode: studyStore.currentSession.mode
  }
})

const explanationData = computed(() => {
  if (!studyStore.currentQuestion || !studyStore.showFeedback) return null
  
  const progress = studyStore.sessionProgress
  
  return {
    isCorrect: studyStore.isAnswerCorrect,
    selectedAnswers: studyStore.selectedAnswers,
    correctAnswers: studyStore.currentQuestion.correctAnswers,
    options: studyStore.currentQuestion.options,
    explanation: studyStore.currentQuestion.explanation,
    resources: studyStore.currentQuestion.resources,
    accuracy: progress?.accuracy || 0,
    questionsAnswered: progress?.answered || 0,
    timeSeconds: studyStore.sessionTime
  }
})

// Check for existing session on mount
onMounted(async () => {
  // Check if there's an active session
  if (studyStore.currentSession && studyStore.currentSession.examId === examId) {
    sessionStarted.value = true
  }
})

// Error recovery
const lastAction = ref<() => Promise<void>>()

const retryLastAction = async () => {
  if (lastAction.value) {
    clearError()
    await lastAction.value()
  }
}

// Wrap actions with error tracking
const trackAction = (action: () => Promise<void>) => {
  lastAction.value = action
  return action()
}

// Cleanup on unmount
onUnmounted(() => {
  // Don't reset session if navigating to results
  if (!router.currentRoute.value.path.includes('results')) {
    studyStore.stopSessionTimer()
  }
})
</script>

<template>
  <ErrorBoundary :error="pageError" :on-retry="() => navigateTo(route.fullPath)">
    <div>
      <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
      
      <!-- Error Notification -->
      <ErrorNotification 
        :error="currentError" 
        @close="clearError"
        :show-retry="true"
        :on-retry="retryLastAction"
      />
    
    <!-- Exam Loading State -->
    <div v-if="examPending && !exam" class="text-center py-12">
      <v-progress-circular 
        indeterminate 
        color="primary" 
        size="64"
      />
      <p class="mt-4 text-subtitle-1">Loading exam details...</p>
    </div>

    <!-- Exam Load Error -->
    <div v-else-if="examLoadError" class="text-center py-12">
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
      <h3 class="text-h5 mb-2">Unable to Load Exam</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">
        {{ examLoadError.message || 'The requested exam could not be found.' }}
      </p>
      <v-btn color="primary" variant="flat" to="/study">
        Back to Study Dashboard
      </v-btn>
    </div>
    
    <!-- Study Session Setup -->
    <div v-else-if="!sessionStarted && exam">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <!-- Show any errors from study store -->
          <v-alert
            v-if="studyStore.error"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="studyStore.error = null"
          >
            <v-alert-title>Study Session Error</v-alert-title>
            {{ studyStore.error }}
          </v-alert>
          
          <StudyModeConfig
            :examId="examId"
            :examCode="exam.code || exam.examCode"
            :examName="exam.name || exam.examName"
            :totalQuestions="totalQuestions"
            :loading="studyStore.loading"
            @start="startStudySession"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Loading State -->
    <div v-else-if="studyStore.loading" class="text-center py-12">
      <v-progress-circular 
        indeterminate 
        color="primary" 
        size="64"
      />
      <p class="mt-4 text-subtitle-1">Loading questions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="studyStore.error" class="text-center py-12">
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
      <h3 class="text-h5 mb-2">Error Loading Study Session</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">{{ studyStore.error }}</p>
      <v-btn color="primary" variant="flat" @click="startStudySession">
        Try Again
      </v-btn>
    </div>

    <!-- Study Interface -->
    <div v-else-if="sessionStarted && !studyStore.loading && !studyStore.error">
      <Transition name="fade-slide" mode="out-in">
        <div v-if="studyStore.currentQuestion && !studyStore.showFeedback" :key="`question-${studyStore.currentQuestionIndex}`" class="study-interface">
        <!-- Progress Bar -->
        <v-row class="mb-4">
          <v-col cols="12">
            <StudyProgressBar
              v-if="currentProgress"
              :current="currentProgress.current"
              :total="currentProgress.total"
              :correct="currentProgress.correct"
              :incorrect="currentProgress.incorrect"
              :exam-name="currentProgress.examName"
              :time-seconds="currentProgress.timeSeconds"
              :mode="currentProgress.mode"
              @pause="handlePauseSession"
              @end="handleEndSession"
            />
          </v-col>
        </v-row>

        <!-- Navigation Bar -->
        <v-row class="mb-4" v-if="studyStore.currentSession">
          <v-col cols="12">
            <StudyNavigationBar
              :current-question-index="studyStore.currentQuestionIndex"
              :questions-order="studyStore.currentSession.questionsOrder"
              :answers="studyStore.currentSession.answers"
              :bookmarks="studyStore.currentSession.bookmarks"
              :flags="studyStore.currentSession.flags"
              @navigate="handleNavigate"
            />
          </v-col>
        </v-row>

        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <!-- Question Card -->
            <StudyQuestionCard
              :question="studyStore.currentQuestion"
              :selected-answers="studyStore.selectedAnswers"
              :show-feedback="studyStore.showFeedback"
              :is-bookmarked="questionBookmarked"
              :is-flagged="questionFlagged"
              :loading="studyStore.loading"
              :question-index="studyStore.currentQuestionIndex"
              @answer-selected="handleAnswerSelect"
              @submit="handleSubmit"
              @skip="handleSkip"
              @bookmark="handleBookmark"
              @flag="handleFlag"
              @report="handleReportIssue"
            />
          </v-col>
        </v-row>
        </div>
      </Transition>

      <!-- Explanation/Feedback -->
      <Transition name="fade-up" mode="out-in">
        <div v-if="studyStore.showFeedback && explanationData" :key="`explanation-${studyStore.currentQuestionIndex}`" class="explanation-interface">
        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <StudyExplanationCard
              :is-correct="explanationData.isCorrect"
              :selected-answers="explanationData.selectedAnswers"
              :correct-answers="explanationData.correctAnswers"
              :options="explanationData.options"
              :explanation="explanationData.explanation"
              :resources="explanationData.resources"
              :accuracy="explanationData.accuracy"
              :questions-answered="explanationData.questionsAnswered"
              :time-seconds="explanationData.timeSeconds"
              @continue="handleContinue"
              @report="handleReportIssue"
            />
          </v-col>
        </v-row>
        </div>
      </Transition>

      <!-- No Questions State -->
      <div v-if="!studyStore.currentQuestion && !studyStore.showFeedback" class="text-center py-12">
      <v-icon size="64" color="warning" class="mb-4">mdi-alert</v-icon>
      <h3 class="text-h5 mb-2">No Questions Available</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">
        There are no questions available for this exam. Please contact support if this is unexpected.
      </p>
        <v-btn color="primary" variant="flat" to="/exams">
          Back to Exams
        </v-btn>
      </div>
    </div>
    
    </div>
  </ErrorBoundary>
</template>

<style scoped>
/* Animation Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Smooth scrolling for navigation */
.study-interface,
.explanation-interface {
  scroll-behavior: smooth;
}
</style>