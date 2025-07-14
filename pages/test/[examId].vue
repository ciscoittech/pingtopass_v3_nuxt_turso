<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'minimal'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

// Test state
const testSession = ref(null as any)
const currentQuestion = ref(null as any)
const currentQuestionIndex = ref(0)
const answers = ref({} as Record<string, number[]>)
const reviewFlags = ref({} as Record<string, boolean>)
const timeRemaining = ref(0)
const isLoading = ref(false)
const showStartDialog = ref(true)
const showSubmitDialog = ref(false)
const showNavigationGrid = ref(false)

// Test configuration
const selectedTimeLimit = ref(3600) // 1 hour default
const selectedMaxQuestions = ref(0) // 0 means all questions

// Timer management
let timerInterval: NodeJS.Timeout | null = null

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const isTestActive = computed(() => {
  return testSession.value && testSession.value.status === 'active'
})

const currentAnswer = computed(() => {
  return currentQuestion.value ? answers.value[currentQuestion.value.id] || [] : []
})

const canSubmitTest = computed(() => {
  return isTestActive.value && Object.keys(answers.value).length > 0
})

const questionStatus = computed(() => {
  if (!testSession.value) return {}
  
  const status = {} as Record<string, 'answered' | 'flagged' | 'unanswered'>
  const questionIds = testSession.value.questionIds || []
  
  questionIds.forEach((qId: string) => {
    if (answers.value[qId] && answers.value[qId].length > 0) {
      status[qId] = reviewFlags.value[qId] ? 'flagged' : 'answered'
    } else {
      status[qId] = reviewFlags.value[qId] ? 'flagged' : 'unanswered'
    }
  })
  
  return status
})

const startTest = async () => {
  isLoading.value = true
  
  try {
    const { data } = await $fetch('/api/test/start', {
      method: 'POST',
      body: {
        examId,
        timeLimit: selectedTimeLimit.value,
        maxQuestions: selectedMaxQuestions.value || undefined
      }
    })
    
    testSession.value = data
    currentQuestion.value = data.currentQuestion
    currentQuestionIndex.value = data.currentQuestionIndex
    timeRemaining.value = data.timeRemaining
    
    if (data.isResuming) {
      // Load existing answers and flags
      // This would be handled by the API returning the saved state
    }
    
    showStartDialog.value = false
    startTimer()
    
  } catch (error) {
    console.error('Failed to start test:', error)
  } finally {
    isLoading.value = false
  }
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
      
      // Save progress every 30 seconds
      if (timeRemaining.value % 30 === 0) {
        saveProgress()
      }
      
      // Auto-submit when time runs out
      if (timeRemaining.value === 0) {
        autoSubmitTest()
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const saveProgress = async () => {
  if (!testSession.value) return
  
  try {
    await $fetch('/api/test/save-progress', {
      method: 'POST',
      body: {
        sessionId: testSession.value.sessionId,
        currentQuestionIndex: currentQuestionIndex.value,
        answers: answers.value,
        reviewFlags: reviewFlags.value,
        timeRemaining: timeRemaining.value
      }
    })
  } catch (error) {
    console.error('Failed to save progress:', error)
  }
}

const navigateToQuestion = async (index: number) => {
  if (!testSession.value || index < 0 || index >= testSession.value.totalQuestions) return
  
  // Save current progress
  await saveProgress()
  
  currentQuestionIndex.value = index
  const questionIds = testSession.value.questionIds || []
  const questionId = questionIds[index]
  
  try {
    const { data } = await $fetch(`/api/questions/${questionId}`)
    currentQuestion.value = {
      ...data.question,
      options: data.question.options
    }
    showNavigationGrid.value = false
  } catch (error) {
    console.error('Failed to load question:', error)
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < testSession.value.totalQuestions - 1) {
    navigateToQuestion(currentQuestionIndex.value + 1)
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    navigateToQuestion(currentQuestionIndex.value - 1)
  }
}

const selectAnswer = (answerIndex: number) => {
  if (!currentQuestion.value) return
  
  const questionId = currentQuestion.value.id
  const currentAnswers = answers.value[questionId] || []
  
  if (currentQuestion.value.questionType === 'multiple-choice') {
    // Single selection
    answers.value[questionId] = [answerIndex]
  } else {
    // Multiple selection
    const newAnswers = [...currentAnswers]
    const existingIndex = newAnswers.indexOf(answerIndex)
    
    if (existingIndex > -1) {
      newAnswers.splice(existingIndex, 1)
    } else {
      newAnswers.push(answerIndex)
    }
    
    answers.value[questionId] = newAnswers
  }
}

const toggleReviewFlag = () => {
  if (!currentQuestion.value) return
  
  const questionId = currentQuestion.value.id
  reviewFlags.value[questionId] = !reviewFlags.value[questionId]
}

const submitTest = async () => {
  showSubmitDialog.value = false
  isLoading.value = true
  stopTimer()
  
  try {
    const timeSpent = testSession.value.timeLimit - timeRemaining.value
    
    const { data } = await $fetch('/api/test/submit', {
      method: 'POST',
      body: {
        sessionId: testSession.value.sessionId,
        answers: answers.value,
        reviewFlags: reviewFlags.value,
        timeSpent,
        isAutoSubmit: false
      }
    })
    
    // Navigate to results page
    router.push(`/test/results/${testSession.value.sessionId}`)
    
  } catch (error) {
    console.error('Failed to submit test:', error)
    isLoading.value = false
  }
}

const autoSubmitTest = async () => {
  isLoading.value = true
  stopTimer()
  
  try {
    const timeSpent = testSession.value.timeLimit
    
    await $fetch('/api/test/submit', {
      method: 'POST',
      body: {
        sessionId: testSession.value.sessionId,
        answers: answers.value,
        reviewFlags: reviewFlags.value,
        timeSpent,
        isAutoSubmit: true
      }
    })
    
    // Navigate to results page
    router.push(`/test/results/${testSession.value.sessionId}`)
    
  } catch (error) {
    console.error('Failed to auto-submit test:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Prevent browser back/refresh during test
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isTestActive.value) {
      e.preventDefault()
      e.returnValue = 'You have an active test. Are you sure you want to leave?'
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    stopTimer()
  })
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="test-container">
    <!-- Test Start Dialog -->
    <v-dialog v-model="showStartDialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-clock-outline</v-icon>
          Start Test
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <h3 class="text-h6 mb-2">Test Configuration</h3>
            <p class="text-body-2 text-grey-darken-1 mb-4">
              Configure your test settings before starting.
            </p>
          </div>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedTimeLimit"
                label="Time Limit"
                :items="[
                  { title: '30 minutes', value: 1800 },
                  { title: '1 hour', value: 3600 },
                  { title: '1.5 hours', value: 5400 },
                  { title: '2 hours', value: 7200 },
                  { title: '3 hours', value: 10800 }
                ]"
                variant="outlined"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="selectedMaxQuestions"
                label="Max Questions (0 = all)"
                type="number"
                min="0"
                max="500"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-btn
            text
            @click="$router.back()"
          >
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="isLoading"
            @click="startTest"
          >
            <v-icon start>mdi-play</v-icon>
            Start Test
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Test Interface -->
    <div v-if="isTestActive" class="test-interface">
      <!-- Test Header -->
      <v-app-bar color="primary" density="compact" fixed>
        <v-app-bar-title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-text</v-icon>
            {{ testSession.examName }} - Test Mode
          </div>
        </v-app-bar-title>
        
        <v-spacer />
        
        <!-- Timer -->
        <v-chip
          :color="timeRemaining < 300 ? 'error' : 'white'"
          variant="elevated"
          class="mr-4"
        >
          <v-icon start>mdi-timer</v-icon>
          {{ formatTime(timeRemaining) }}
        </v-chip>
        
        <!-- Navigation Grid Button -->
        <v-btn
          icon
          @click="showNavigationGrid = true"
        >
          <v-icon>mdi-grid</v-icon>
        </v-btn>
        
        <!-- Submit Button -->
        <v-btn
          color="success"
          variant="elevated"
          class="ml-2"
          @click="showSubmitDialog = true"
          :disabled="!canSubmitTest"
        >
          Submit Test
        </v-btn>
      </v-app-bar>

      <!-- Main Content -->
      <v-main class="test-main">
        <v-container fluid class="pa-0">
          <div class="question-container">
            <!-- Question Header -->
            <div class="question-header">
              <div class="d-flex justify-space-between align-center mb-4">
                <h2 class="text-h6">
                  Question {{ currentQuestionIndex + 1 }} of {{ testSession.totalQuestions }}
                </h2>
                
                <v-btn
                  :color="reviewFlags[currentQuestion?.id] ? 'warning' : 'grey'"
                  :variant="reviewFlags[currentQuestion?.id] ? 'tonal' : 'outlined'"
                  size="small"
                  @click="toggleReviewFlag"
                >
                  <v-icon start>mdi-flag</v-icon>
                  {{ reviewFlags[currentQuestion?.id] ? 'Flagged' : 'Flag for Review' }}
                </v-btn>
              </div>
              
              <v-progress-linear
                :model-value="((currentQuestionIndex + 1) / testSession.totalQuestions) * 100"
                color="primary"
                height="4"
                rounded
              />
            </div>

            <!-- Question Content -->
            <TestQuestionDisplay
              v-if="currentQuestion"
              :question="currentQuestion"
              :selected-answers="currentAnswer"
              :loading="isLoading"
              @answer-selected="selectAnswer"
            />
          </div>
          
          <!-- Navigation Controls -->
          <div class="navigation-controls">
            <v-row>
              <v-col cols="6">
                <v-btn
                  variant="outlined"
                  :disabled="currentQuestionIndex === 0"
                  @click="previousQuestion"
                  block
                >
                  <v-icon start>mdi-arrow-left</v-icon>
                  Previous
                </v-btn>
              </v-col>
              
              <v-col cols="6">
                <v-btn
                  color="primary"
                  :disabled="currentQuestionIndex === testSession.totalQuestions - 1"
                  @click="nextQuestion"
                  block
                >
                  Next
                  <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-container>
      </v-main>
    </div>

    <!-- Question Navigation Grid -->
    <TestNavigationGrid
      v-if="testSession"
      v-model="showNavigationGrid"
      :questions="testSession.questionIds || []"
      :current-index="currentQuestionIndex"
      :question-status="questionStatus"
      @navigate="navigateToQuestion"
    />

    <!-- Submit Confirmation Dialog -->
    <TestSubmitDialog
      v-model="showSubmitDialog"
      :total-questions="testSession?.totalQuestions || 0"
      :answered-questions="Object.keys(answers).length"
      :time-remaining="timeRemaining"
      @submit="submitTest"
    />

    <!-- Loading Overlay -->
    <v-overlay
      v-model="isLoading"
      contained
      class="d-flex align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
    </v-overlay>
  </div>
</template>

<style scoped>
.test-container {
  height: 100vh;
  background: #f5f5f5;
}

.test-main {
  margin-top: 64px; /* Account for app bar */
  height: calc(100vh - 64px);
}

.question-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
}

.question-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.navigation-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px;
  z-index: 10;
}

@media (max-width: 768px) {
  .question-container {
    margin: 8px;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>