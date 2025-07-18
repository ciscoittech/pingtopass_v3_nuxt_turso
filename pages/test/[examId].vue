<script setup lang="ts">
console.log('[Test Page] ===== IMPORTS STARTING =====')

import { useTestStore } from '~/stores/test'
import TestTimer from '~/components/test/TestTimer.vue'
import TestProgress from '~/components/test/TestProgress.vue'
import TestQuestionCard from '~/components/test/TestQuestionCard.vue'
import TestSummary from '~/components/test/TestSummary.vue'
import TestSubmitDialog from '~/components/test/TestSubmitDialog.vue'

console.log('[Test Page] ===== IMPORTS COMPLETED =====')

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

console.log('[Test Page] ===== TEST PAGE SETUP START =====')
console.log('[Test Page] Loading test page with examId:', examId)
console.log('[Test Page] Route full path:', route.fullPath)
console.log('[Test Page] Route params:', route.params)

// Add error boundary
onErrorCaptured((error, instance, info) => {
  console.error('[Test Page] Error captured:', error)
  console.error('[Test Page] Error instance:', instance)
  console.error('[Test Page] Error info:', info)
  return false // Let error propagate
})

// Store
const testStore = useTestStore()

// Local state
const showConfigDialog = ref(true)
const testStarted = ref(false)
const showSummary = computed({
  get: () => testStore.showSummary,
  set: (value) => {
    if (value) {
      testStore.showTestSummary()
    } else {
      testStore.continueReview()
    }
  }
})
const mobileProgressDrawer = ref(false)
const timeWarningSnackbar = ref(false)
const timeWarningMinutes = ref(0)
const showSubmitDialog = ref(false)

// Test configuration
const selectedDuration = ref(3600) // 1 hour default
const maxQuestions = ref(50)
const totalAvailableQuestions = ref(100) // Will be updated from API

const durationOptions = [
  { title: '30 minutes', value: 1800 },
  { title: '1 hour', value: 3600 },
  { title: '90 minutes', value: 5400 },
  { title: '2 hours', value: 7200 },
  { title: '3 hours', value: 10800 }
]

// Get exam info - using client-side pattern since SSR is disabled
const { data: examData, error: examError, pending: examPending } = useLazyFetch(`/api/exams/${examId}`)

const exam = computed(() => {
  const examValue = examData.value?.data || null
  console.log('[Test Page] Exam computed value:', examValue)
  console.log('[Test Page] examData.value:', examData.value)
  console.log('[Test Page] examPending.value:', examPending.value)
  console.log('[Test Page] examError.value:', examError.value)
  return examValue
})

// Watch for data changes
watch(examData, (newData) => {
  console.log('[Test Page] Exam data updated:', newData)
  if (examError.value) {
    console.error('[Test Page] Failed to load exam:', examError.value)
  }
})

// Get available questions count
onMounted(async () => {
  try {
    const questionsData = await $fetch(`/api/exams/${examId}/questions/count`)
    if (questionsData?.data?.count) {
      totalAvailableQuestions.value = questionsData.data.count
      maxQuestions.value = Math.min(50, totalAvailableQuestions.value)
    }
  } catch (error) {
    console.error('[Test Page] Failed to load questions count:', error)
  }
})

// SEO - Set after exam loads
watch(exam, (newExam) => {
  if (newExam) {
    useSeoMeta({
      title: `Test Mode - ${newExam.code} | PingToPass`,
      description: `Take a practice test for ${newExam.name} certification exam.`
    })
  }
}, { immediate: true })

// Normalize question to ensure options are strings
const normalizedQuestion = computed(() => {
  if (!testStore.currentQuestion) return null
  
  const question = testStore.currentQuestion
  console.log('[Test Page] Current question options:', question.options)
  console.log('[Test Page] Options type:', typeof question.options[0])
  
  // Check if options are objects and extract text property
  const normalizedOptions = question.options.map((opt: any) => {
    if (typeof opt === 'string') {
      return opt
    } else if (typeof opt === 'object' && opt !== null) {
      // Handle object format (e.g., {id: 1, text: 'Option text'})
      return opt.text || opt.value || opt.label || JSON.stringify(opt)
    }
    return String(opt)
  })
  
  return {
    ...question,
    options: normalizedOptions
  }
})

// Transform answers for TestProgress component
const testProgressAnswers = computed(() => {
  if (!testStore.currentSession) return {}
  
  const transformed: Record<number, number[]> = {}
  Object.entries(testStore.currentSession.answers).forEach(([questionId, answer]) => {
    transformed[answer.questionIndex] = answer.selectedAnswers
  })
  return transformed
})

// Transform flagged for TestProgress component  
const testProgressFlagged = computed(() => {
  if (!testStore.currentSession) return []
  return testStore.currentSession.flags.map(f => f.questionIndex)
})

// Methods
const startTest = async () => {
  console.log('[Test Config] Start Test clicked with config:', {
    examId: exam.value?.id || examId,
    examCode: exam.value?.code || '',
    examName: exam.value?.name || '',
    duration: selectedDuration.value,
    maxQuestions: maxQuestions.value
  })
  
  const success = await testStore.startTest({
    examId: exam.value?.id || examId,
    examCode: exam.value?.code || '',
    examName: exam.value?.name || '',
    duration: selectedDuration.value,
    questionCount: maxQuestions.value
  })
  
  console.log('[Test Config] Test start result:', success)
  
  if (success) {
    showConfigDialog.value = false
    testStarted.value = true
  } else {
    console.error('[Test Config] Failed to start test')
  }
}

const handleNavigate = (index: number) => {
  testStore.goToQuestion(index)
  mobileProgressDrawer.value = false
}

const handleTimeWarning = (minutes: number) => {
  timeWarningMinutes.value = minutes
  timeWarningSnackbar.value = true
}

const handleTimeExpired = () => {
  // Auto-submit is handled by the store
  console.log('Time expired - auto-submitting')
}

const submitTest = async () => {
  // Show submission dialog
  showSubmitDialog.value = true
}

const confirmSubmitTest = async () => {
  showSubmitDialog.value = false
  const success = await testStore.submitTest()
  if (!success) {
    // Show error
    console.error('Failed to submit test')
  }
}

const reviewFlaggedQuestions = () => {
  // Navigate to first flagged question
  const firstFlagged = testStore.currentSession?.flags.find(f => f.questionIndex >= 0)
  if (firstFlagged) {
    testStore.navigateToQuestion(firstFlagged.questionIndex)
  }
}

// Add lifecycle debugging
onBeforeMount(() => {
  console.log('[Test Page] onBeforeMount called')
})

// Prevent accidental navigation
onMounted(() => {
  console.log('[Test Page] Component mounted - exam data:', examData.value)
  console.log('[Test Page] Component mounted - exam computed:', exam.value)
  console.log('[Test Page] Component mounted - pending:', examPending.value)
  
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (testStarted.value && testStore.currentSession && !testStore.currentSession.submitted) {
      e.preventDefault()
      e.returnValue = 'You have an active test. Are you sure you want to leave?'
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUpdated(() => {
  console.log('[Test Page] Component updated')
})

// Cleanup
onUnmounted(() => {
  if (testStarted.value && testStore.currentSession && !testStore.currentSession.submitted && testStore.currentSession.status !== 'submitted') {
    // Save progress before leaving
    testStore.saveProgress()
  }
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <v-container v-if="examPending" class="py-12">
      <v-row justify="center">
        <v-col cols="12" md="6" class="text-center">
          <v-progress-circular
            indeterminate
            size="64"
            color="primary"
            class="mb-4"
          />
          <h3 class="text-h6">Loading exam details...</h3>
        </v-col>
      </v-row>
    </v-container>

    <!-- Error State -->
    <v-container v-else-if="examError" class="py-12">
      <v-row justify="center">
        <v-col cols="12" md="6" class="text-center">
          <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
          <h3 class="text-h5 mb-2">Error Loading Exam</h3>
          <p class="text-body-1 mb-4">{{ examError.message || 'Failed to load exam details' }}</p>
          <v-btn color="primary" @click="$router.push('/test')">Back to Tests</v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Main Content -->
    <template v-else-if="exam">
      <!-- Test Configuration Dialog -->
      <v-dialog v-model="showConfigDialog" persistent max-width="600">
        <v-card>
          <v-card-text class="pa-6">
            <div class="text-center mb-6">
              <v-avatar color="primary" variant="tonal" size="80" class="mb-4">
                <v-icon size="40">mdi-clipboard-text-clock</v-icon>
              </v-avatar>
              <h2 class="text-h4 font-weight-bold mb-2">Test Mode</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                {{ exam?.code }} - {{ exam?.name }}
              </p>
            </div>

            <v-divider class="mb-6" />

            <h3 class="text-subtitle-1 font-weight-semibold mb-3">Test Settings</h3>
            
            <v-select
              v-model="selectedDuration"
              :items="durationOptions"
              label="Time Limit"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />
            
            <v-text-field
              v-model.number="maxQuestions"
              type="number"
              label="Number of Questions"
              :hint="`Maximum ${totalAvailableQuestions} questions available`"
              persistent-hint
              variant="outlined"
              density="comfortable"
              :min="1"
              :max="totalAvailableQuestions"
            />

            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              <p class="text-caption mb-0">
                The test will simulate real exam conditions. You cannot pause once started.
              </p>
            </v-alert>
          </v-card-text>
          
          <v-divider />
          
          <v-card-actions class="pa-4">
            <v-btn
              variant="text"
              @click="$router.back()"
            >
              Cancel
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              size="large"
              :loading="testStore.loading"
              @click="startTest"
            >
              <v-icon start>mdi-play</v-icon>
              Start Test
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Test Interface -->
      <div v-if="testStarted && testStore.currentSession" class="test-interface">
        <!-- Test Header -->
        <v-card elevation="0" class="mb-4">
          <v-card-text class="pa-4">
            <v-row align="center">
              <v-col cols="auto">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-clipboard-text</v-icon>
                  <span class="text-h6">{{ exam?.code }} - Test Mode</span>
                </div>
              </v-col>
              
              <v-spacer />
              
              <!-- Timer -->
              <v-col cols="auto">
                <TestTimer
                  :remainingSeconds="testStore.remainingTime"
                  :totalSeconds="testStore.currentSession?.timeLimitSeconds || 0"
                  :showPauseButton="false"
                  @time-up="handleTimeExpired"
                />
              </v-col>
              
              <!-- Submit Button -->
              <v-col cols="auto">
                <v-btn
                  color="success"
                  variant="flat"
                  @click="showSummary = true"
                >
                  <v-icon start>mdi-check-all</v-icon>
                  Review & Submit
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Main Content Area -->
        <v-row>
          <!-- Question Area -->
          <v-col cols="12" lg="9">
            <div class="question-wrapper">
              <!-- Question Card -->
              <TestQuestionCard
                v-if="!testStore.showSummary && testStore.currentQuestion"
                :question="normalizedQuestion"
                :selectedAnswers="testStore.currentAnswers"
                :questionNumber="testStore.currentQuestionNumber"
                :totalQuestions="testStore.totalQuestions"
                :isFlagged="testStore.isCurrentFlagged"
                @answer-selected="testStore.toggleAnswer"
                @flag="testStore.toggleFlag"
                @previous="testStore.previousQuestion"
                @next="testStore.nextQuestion"
              />

              <!-- Test Summary -->
              <TestSummary
                v-else-if="testStore.showSummary"
                :totalQuestions="testStore.totalQuestions"
                :answers="testProgressAnswers"
                :flagged="testProgressFlagged"
                :timeSeconds="testStore.elapsedTime"
                @navigate="handleNavigate"
                @continue-review="testStore.continueReview"
                @submit-test="submitTest"
              />
            </div>
          </v-col>

          <!-- Progress Sidebar -->
          <v-col cols="12" lg="3" class="d-none d-lg-block">
            <TestProgress
              :totalQuestions="testStore.totalQuestions"
              :currentQuestion="testStore.currentQuestionIndex"
              :answers="testProgressAnswers"
              :flagged="testProgressFlagged"
              @navigate="handleNavigate"
              @submit-test="showSummary = true"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Mobile Navigation Drawer -->
      <v-navigation-drawer
        v-model="mobileProgressDrawer"
        temporary
        location="right"
        width="320"
      >
        <div class="pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-h6">Question Navigator</h3>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="mobileProgressDrawer = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          
          <TestProgress
            :totalQuestions="testStore.totalQuestions"
            :currentQuestion="testStore.currentQuestionIndex"
            :answers="testProgressAnswers"
            :flagged="testProgressFlagged"
            @navigate="handleNavigate"
            @submit-test="showSummary = true"
          />
        </div>
      </v-navigation-drawer>

      <!-- Mobile FAB for Navigation -->
      <v-btn
        v-if="testStarted && !showSummary"
        color="primary"
        icon
        size="large"
        class="mobile-nav-fab d-lg-none"
        @click="mobileProgressDrawer = true"
      >
        <v-icon>mdi-grid</v-icon>
      </v-btn>

      <!-- Time Warning Snackbar -->
      <v-snackbar
        v-model="timeWarningSnackbar"
        color="warning"
        :timeout="5000"
        location="top"
      >
        <v-icon class="mr-2">mdi-alert</v-icon>
        {{ timeWarningMinutes }} minutes remaining!
      </v-snackbar>

      <!-- Test Submit Dialog -->
      <TestSubmitDialog
        v-model="showSubmitDialog"
        :answeredCount="testStore.sessionProgress?.answered || 0"
        :totalQuestions="testStore.sessionProgress?.total || 0"
        :flaggedCount="testStore.sessionProgress?.flagged || 0"
        :remainingSeconds="testStore.remainingTime"
        :loading="testStore.loading"
        @submit="confirmSubmitTest"
        @review-flagged="reviewFlaggedQuestions"
      />
    </template>
    
    <!-- Debug fallback -->
    <div v-else class="pa-4">
      <h3>Debug: No conditions matched</h3>
      <p>examPending: {{ examPending }}</p>
      <p>examError: {{ examError }}</p>
      <p>exam exists: {{ !!exam }}</p>
      <p>examId: {{ examId }}</p>
    </div>
  </div>
</template>

<style scoped>
.test-interface {
  min-height: calc(100vh - 200px);
}

.question-wrapper {
  min-height: 500px;
}

.mobile-nav-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}
</style>