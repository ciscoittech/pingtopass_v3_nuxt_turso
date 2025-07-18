<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    
    <!-- Loading State -->
    <v-row v-if="isLoading || !isClientReady" justify="center">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="0" rounded="lg" class="text-center pa-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            class="mb-4"
          />
          <h3 class="text-h5">Loading Results...</h3>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- No Results Data -->
    <v-row v-else-if="isClientReady && !storedResults" justify="center">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="0" rounded="lg" class="text-center pa-8">
          <v-icon size="64" color="warning" class="mb-4">mdi-alert-circle</v-icon>
          <h3 class="text-h5 mb-2">No Session Results Found</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">
            We couldn't find any session results. You may have already viewed them or navigated here directly.
          </p>
          <v-btn
            color="primary"
            size="large"
            variant="flat"
            @click="continueStudying"
          >
            Start New Study Session
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Results Card -->
    <v-row v-else justify="center">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="0" rounded="lg" class="results-card">
          <v-card-text class="pa-6">
            <!-- Header -->
            <div class="text-center mb-6">
              <v-avatar
                :color="overallScore >= 70 ? 'success' : 'warning'"
                variant="flat"
                size="100"
                class="mb-4"
              >
                <v-icon size="48">
                  {{ overallScore >= 70 ? 'mdi-check-decagram' : 'mdi-school' }}
                </v-icon>
              </v-avatar>
              
              <h1 class="text-h3 font-weight-bold mb-2">
                {{ overallScore >= 70 ? 'Great Job!' : 'Keep Practicing!' }}
              </h1>
              
              <p class="text-subtitle-1 text-medium-emphasis">
                You've completed your study session
              </p>
            </div>

            <!-- Score Circle -->
            <div class="text-center mb-6">
              <v-progress-circular
                :model-value="overallScore"
                :size="200"
                :width="20"
                :color="scoreColor"
                class="mb-4"
              >
                <div class="d-flex flex-column align-center">
                  <span class="text-h2 font-weight-bold">{{ Math.round(overallScore) }}%</span>
                  <span class="text-subtitle-1">Score</span>
                </div>
              </v-progress-circular>
            </div>

            <!-- Stats Grid -->
            <v-row class="mb-6">
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="primary" class="mb-2">mdi-help-circle</v-icon>
                  <div class="text-h5 font-weight-bold">{{ totalQuestions }}</div>
                  <div class="text-caption text-medium-emphasis">Questions</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="success" class="mb-2">mdi-check-circle</v-icon>
                  <div class="text-h5 font-weight-bold text-success">{{ correctAnswers }}</div>
                  <div class="text-caption text-medium-emphasis">Correct</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="error" class="mb-2">mdi-close-circle</v-icon>
                  <div class="text-h5 font-weight-bold text-error">{{ incorrectAnswers }}</div>
                  <div class="text-caption text-medium-emphasis">Incorrect</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="info" class="mb-2">mdi-clock-outline</v-icon>
                  <div class="text-h5 font-weight-bold">{{ formattedTime }}</div>
                  <div class="text-caption text-medium-emphasis">Time Spent</div>
                </div>
              </v-col>
            </v-row>

            <v-divider class="mb-6" />

            <!-- Performance Insights -->
            <div class="mb-6">
              <h3 class="text-h5 font-weight-bold mb-4">
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Performance Insights
              </h3>
              
              <v-list density="comfortable" class="pa-0">
                <v-list-item
                  v-for="insight in performanceInsights"
                  :key="insight.title"
                  class="px-0"
                >
                  <template v-slot:prepend>
                    <v-icon :color="insight.color">{{ insight.icon }}</v-icon>
                  </template>
                  <v-list-item-title>{{ insight.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ insight.description }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>

            <!-- Recommendations -->
            <v-card
              variant="tonal"
              color="primary"
              class="mb-6"
            >
              <v-card-text class="pa-4">
                <div class="d-flex align-start">
                  <v-icon class="mr-3">mdi-lightbulb</v-icon>
                  <div>
                    <h4 class="text-subtitle-1 font-weight-semibold mb-2">Next Steps</h4>
                    <p class="text-body-2 mb-0">{{ recommendation }}</p>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Action Buttons -->
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  variant="flat"
                  @click="continueStudying"
                >
                  <v-icon start>mdi-book-open-variant</v-icon>
                  Continue Studying
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="secondary"
                  size="large"
                  block
                  variant="flat"
                  @click="takeTest"
                >
                  <v-icon start>mdi-clipboard-text</v-icon>
                  Take Practice Test
                </v-btn>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-btn
                  size="large"
                  block
                  variant="outlined"
                  @click="viewProgress"
                >
                  <v-icon start>mdi-chart-box</v-icon>
                  View Progress
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { useStudyStore } from '~/stores/study'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

console.log('[Results Page] ===== RESULTS PAGE LOADED =====')
console.log('[Results Page] Route params:', route.params)
console.log('[Results Page] ExamId from route:', examId)
console.log('[Results Page] Full path:', route.fullPath)
console.log('[Results Page] Route name:', route.name)

// Store
const studyStore = useStudyStore()

// We'll get exam info from stored results instead of making an API call
const exam = computed(() => {
  // Try to get exam info from stored results first
  if (storedResults.value) {
    return {
      examCode: storedResults.value.examCode,
      examName: storedResults.value.examName,
      id: storedResults.value.examId
    }
  }
  return null
})

// Breadcrumb
const page = ref({ title: 'Study Results' })
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
    text: exam.value?.examCode || storedResults.value?.examCode || 'Study',
    disabled: false,
    to: `/exams/${examId}`
  },
  {
    text: 'Results',
    disabled: true,
    to: ''
  }
])

// Get session results from sessionStorage
const getSessionResults = () => {
  if (process.client && typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('studyResults')
      console.log('[Results Page] Raw sessionStorage value:', stored)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          console.log('[Results Page] Retrieved session results:', parsed)
          return parsed
        } catch (e) {
          console.error('[Results Page] Failed to parse session results:', e)
          console.error('[Results Page] Raw value that failed to parse:', stored)
        }
      } else {
        console.log('[Results Page] No session results found in storage')
      }
    } catch (e) {
      console.error('[Results Page] Error accessing sessionStorage:', e)
    }
  } else {
    console.log('[Results Page] Not running on client or window not available')
  }
  return null
}

// Initialize as null - will be set on client side
const storedResults = ref<any>(null)
const isLoading = ref(true)
const isClientReady = ref(false)

// Set stored results on client side
onMounted(() => {
  console.log('[Results Page] Component mounted, checking sessionStorage...')
  console.log('[Results Page] Window available:', typeof window !== 'undefined')
  console.log('[Results Page] SessionStorage available:', typeof sessionStorage !== 'undefined')
  
  let retryCount = 0
  const maxRetries = 5
  const retryDelay = 200
  
  const checkForResults = () => {
    console.log(`[Results Page] Attempt ${retryCount + 1} to get session results...`)
    const results = getSessionResults()
    
    if (results) {
      console.log('[Results Page] Found results, setting storedResults')
      storedResults.value = results
      isLoading.value = false
      isClientReady.value = true
    } else if (retryCount < maxRetries) {
      retryCount++
      console.log(`[Results Page] No results found, retrying in ${retryDelay}ms...`)
      setTimeout(checkForResults, retryDelay)
    } else {
      console.log('[Results Page] No results found after all retries')
      // Try to list all sessionStorage keys for debugging
      if (typeof sessionStorage !== 'undefined') {
        console.log('[Results Page] SessionStorage keys:', Object.keys(sessionStorage))
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          console.log(`[Results Page] SessionStorage key ${i}: ${key}`)
        }
      }
      isLoading.value = false
      isClientReady.value = true
    }
  }
  
  // Start checking after a small initial delay
  setTimeout(checkForResults, 100)
})

// Clear session storage when leaving the page
onUnmounted(() => {
  // Only clear if we actually displayed results
  if (storedResults.value) {
    console.log('[Results Page] Clearing study results from sessionStorage')
    sessionStorage.removeItem('studyResults')
  }
})

// Initialize results data
const sessionResults = computed(() => {
  const results = storedResults.value
  if (!results) {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      timeSpent: 0,
      score: 0,
      sessionId: '',
      examCode: '',
      examName: '',
      mode: 'sequential'
    }
  }
  return {
    totalQuestions: results.statistics?.totalQuestions || 0,
    correctAnswers: results.statistics?.correctAnswers || 0,
    incorrectAnswers: results.statistics?.incorrectAnswers || 0,
    timeSpent: results.timeSpentSeconds || 0,
    score: results.statistics?.accuracy || 0,
    sessionId: results.sessionId || '',
    examCode: results.examCode || '',
    examName: results.examName || '',
    mode: results.mode || 'sequential'
  }
})

// Computed
const totalQuestions = computed(() => sessionResults.value.totalQuestions)
const correctAnswers = computed(() => sessionResults.value.correctAnswers)
const incorrectAnswers = computed(() => sessionResults.value.incorrectAnswers)
const overallScore = computed(() => sessionResults.value.score)

const scoreColor = computed(() => {
  if (overallScore.value >= 80) return 'success'
  if (overallScore.value >= 60) return 'warning'
  return 'error'
})

const formattedTime = computed(() => {
  const seconds = sessionResults.value.timeSpent
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
})

const performanceInsights = computed(() => {
  const insights = []
  
  if (overallScore.value >= 80) {
    insights.push({
      icon: 'mdi-trophy',
      color: 'success',
      title: 'Excellent Performance',
      description: 'You\'re ready for the certification exam!'
    })
  } else if (overallScore.value >= 60) {
    insights.push({
      icon: 'mdi-trending-up',
      color: 'warning',
      title: 'Good Progress',
      description: 'You\'re on the right track. Keep practicing!'
    })
  } else {
    insights.push({
      icon: 'mdi-alert',
      color: 'error',
      title: 'Needs Improvement',
      description: 'Focus on weak areas and review study materials'
    })
  }
  
  const avgTimePerQuestion = sessionResults.value.timeSpent / totalQuestions.value
  if (avgTimePerQuestion < 30) {
    insights.push({
      icon: 'mdi-speedometer',
      color: 'info',
      title: 'Fast Response Time',
      description: 'You\'re answering quickly. Make sure to read carefully!'
    })
  } else if (avgTimePerQuestion > 90) {
    insights.push({
      icon: 'mdi-timer-sand',
      color: 'warning',
      title: 'Slow Response Time',
      description: 'Practice to improve your speed for the timed exam'
    })
  }
  
  return insights
})

const recommendation = computed(() => {
  if (overallScore.value >= 80) {
    return 'Great work! You\'re performing well. Consider taking a practice test to simulate real exam conditions.'
  } else if (overallScore.value >= 60) {
    return 'You\'re making good progress. Review the questions you got wrong and focus on those topics in your next study session.'
  } else {
    return 'Don\'t get discouraged! Review the study materials for the topics you struggled with and try again. Practice makes perfect!'
  }
})

// Actions
const continueStudying = () => {
  router.push(`/study/${examId}`)
}

const takeTest = () => {
  router.push(`/test/${examId}`)
}

const viewProgress = () => {
  router.push(`/progress/exams/${examId}`)
}

// SEO - use computed to handle dynamic data
const seoTitle = computed(() => {
  const code = exam.value?.examCode || storedResults.value?.examCode || 'Exam'
  return `Study Results - ${code} | PingToPass`
})

const seoDescription = computed(() => {
  const name = exam.value?.examName || storedResults.value?.examName || 'certification'
  return `View your study session results for ${name} exam.`
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription
})
</script>

<style scoped>
.results-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}

.v-progress-circular {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}
</style>