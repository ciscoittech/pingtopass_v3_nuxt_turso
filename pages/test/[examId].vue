<template>
  <div>
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
              {{ exam?.code || exam?.examCode }} - {{ exam?.name || exam?.examName }}
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
    <div v-if="testStarted" class="test-interface">
      <!-- Test Header -->
      <v-app-bar
        color="surface"
        elevation="0"
        border
        fixed
      >
        <v-app-bar-title>
          <div class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-clipboard-text</v-icon>
            <span class="text-h6">{{ exam?.code || exam?.examCode }} - Test Mode</span>
          </div>
        </v-app-bar-title>
        
        <v-spacer />
        
        <!-- Timer -->
        <div class="mr-4">
          <TestTimer
            :timeSeconds="testStore.elapsedTime"
            :totalTime="testStore.currentSession?.duration"
            :isCountdown="true"
            :showPauseButton="false"
            :showWarningButton="true"
            @time-warning="handleTimeWarning"
            @time-expired="handleTimeExpired"
          />
        </div>
        
        <!-- Submit Button -->
        <v-btn
          color="success"
          variant="flat"
          @click="showSummary = true"
        >
          <v-icon start>mdi-check-all</v-icon>
          Review & Submit
        </v-btn>
      </v-app-bar>

      <!-- Main Content -->
      <v-main class="test-main">
        <v-container fluid class="pa-0 h-100">
          <v-row class="h-100 ma-0">
            <!-- Question Area -->
            <v-col
              cols="12"
              lg="9"
              class="pa-0 h-100"
            >
              <div class="question-wrapper pa-4">
                <!-- Question Card -->
                <TestQuestionCard
                  v-if="!testStore.showSummary && testStore.currentQuestion"
                  :questionNumber="testStore.currentQuestionNumber"
                  :totalQuestions="testStore.totalQuestions"
                  :questionText="testStore.currentQuestion.questionText"
                  :questionType="testStore.currentQuestion.questionType"
                  :options="testStore.currentQuestion.options"
                  :selectedAnswers="testStore.currentAnswers"
                  :isFlagged="testStore.isCurrentFlagged"
                  :codeBlock="testStore.currentQuestion.codeBlock"
                  @select-answer="testStore.toggleAnswer"
                  @flag="testStore.toggleFlag"
                  @previous="testStore.previousQuestion"
                  @next="testStore.nextQuestion"
                />

                <!-- Test Summary -->
                <TestSummary
                  v-else-if="testStore.showSummary"
                  :totalQuestions="testStore.totalQuestions"
                  :answers="testStore.answers"
                  :flagged="testStore.flagged"
                  :timeSeconds="testStore.elapsedTime"
                  @navigate="handleNavigate"
                  @continue-review="testStore.continueReview"
                  @submit-test="submitTest"
                />
              </div>
            </v-col>

            <!-- Progress Sidebar -->
            <v-col
              cols="12"
              lg="3"
              class="pa-0 progress-sidebar d-none d-lg-block"
            >
              <div class="pa-4 h-100">
                <TestProgress
                  :totalQuestions="testStore.totalQuestions"
                  :currentQuestion="testStore.currentQuestionIndex"
                  :answers="testStore.answers"
                  :flagged="testStore.flagged"
                  @navigate="handleNavigate"
                  @submit-test="showSummary = true"
                />
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
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
          :answers="testStore.answers"
          :flagged="testStore.flagged"
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
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import TestTimer from '@/components/test/TestTimer.vue'
import TestProgress from '@/components/test/TestProgress.vue'
import TestQuestionCard from '@/components/test/TestQuestionCard.vue'
import TestSummary from '@/components/test/TestSummary.vue'
import TestSubmitDialog from '@/components/test/TestSubmitDialog.vue'
import { useTestStore } from '~/stores/test'

definePageMeta({
  middleware: 'auth',
  layout: 'minimal'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

console.log('[Test Page] Loading with examId:', examId)

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
const totalAvailableQuestions = ref(100) // TODO: Get from API

const durationOptions = [
  { title: '30 minutes', value: 1800 },
  { title: '1 hour', value: 3600 },
  { title: '90 minutes', value: 5400 },
  { title: '2 hours', value: 7200 },
  { title: '3 hours', value: 10800 }
]

// Get exam info by ID
const { data: examData, error: examError } = await useFetch(`/api/exams/${examId}`)
const exam = computed(() => examData.value?.data || null)

// Handle exam not found
if (examError.value || !exam.value) {
  console.error('Failed to load exam:', examError.value)
  throw createError({
    statusCode: 404,
    statusMessage: `Exam not found: ${examId}`
  })
}

// Get the actual exam ID from the fetched data
const actualExamId = computed(() => exam.value?.id || examId)

// Get available questions count
const { data: questionsData } = await useFetch(`/api/exams/${actualExamId.value}/questions/count`)
if (questionsData.value?.data?.count) {
  totalAvailableQuestions.value = questionsData.value.data.count
  maxQuestions.value = Math.min(50, totalAvailableQuestions.value)
}

// SEO
useSeoMeta({
  title: `Test Mode - ${exam.value?.examCode} | PingToPass`,
  description: `Take a practice test for ${exam.value?.examName} certification exam.`
})

// Methods
const startTest = async () => {
  const success = await testStore.startTest({
    examId: actualExamId.value, // Use the actual exam ID from database
    examCode: exam.value?.code || exam.value?.examCode || '',
    examName: exam.value?.name || exam.value?.examName || '',
    duration: selectedDuration.value
  })
  
  if (success) {
    showConfigDialog.value = false
    testStarted.value = true
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

// Prevent accidental navigation
onMounted(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (testStarted.value && !testStore.currentSession?.submitted) {
      e.preventDefault()
      e.returnValue = 'You have an active test. Are you sure you want to leave?'
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
})

// Cleanup
onUnmounted(() => {
  if (testStarted.value && !testStore.currentSession?.submitted) {
    // Save progress before leaving
    testStore.saveProgress()
  }
})
</script>

<style scoped>
.test-interface {
  height: 100vh;
  overflow: hidden;
}

.test-main {
  padding-top: 64px;
  height: 100vh;
}

.question-wrapper {
  height: 100%;
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
}

.progress-sidebar {
  background: rgba(var(--v-theme-surface), 0.95);
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  height: 100%;
  overflow-y: auto;
}

.mobile-nav-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

/* Custom scrollbar */
.question-wrapper::-webkit-scrollbar,
.progress-sidebar::-webkit-scrollbar {
  width: 8px;
}

.question-wrapper::-webkit-scrollbar-track,
.progress-sidebar::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.question-wrapper::-webkit-scrollbar-thumb,
.progress-sidebar::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
}

.question-wrapper::-webkit-scrollbar-thumb:hover,
.progress-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}
</style>