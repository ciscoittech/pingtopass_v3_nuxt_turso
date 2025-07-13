<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

// State
const loading = ref(false)
const studySession = ref(null)
const currentQuestion = ref(null)
const selectedAnswers = ref<number[]>([])
const showFeedback = ref(false)
const feedbackData = ref(null)
const sessionProgress = ref(null)

// Study mode options
const studyModeOptions = [
  { title: 'Sequential', value: 'sequential', icon: 'mdi-arrow-right' },
  { title: 'Random', value: 'random', icon: 'mdi-shuffle' },
  { title: 'Flagged Only', value: 'flagged', icon: 'mdi-flag' },
  { title: 'Incorrect Only', value: 'incorrect', icon: 'mdi-close-circle' }
]

const selectedStudyMode = ref('sequential')
const maxQuestions = ref(25)
const sessionStarted = ref(false)

// Get exam info
const { data: examData } = await useFetch(`/api/exams/${examId}`)
const exam = computed(() => examData.value?.data || null)

// Start study session
const startStudySession = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/study/start', {
      method: 'POST',
      body: {
        examId,
        studyMode: selectedStudyMode.value,
        maxQuestions: maxQuestions.value > 0 ? maxQuestions.value : undefined
      }
    })

    if (response.success) {
      studySession.value = response.data
      currentQuestion.value = response.data.firstQuestion
      sessionStarted.value = true
      await fetchProgress()
    }
  } catch (error) {
    console.error('Error starting study session:', error)
  }
  loading.value = false
}

// Submit answer
const submitAnswer = async () => {
  if (!currentQuestion.value || selectedAnswers.value.length === 0) return

  loading.value = true
  try {
    const response = await $fetch('/api/study/answer', {
      method: 'POST',
      body: {
        sessionId: studySession.value.sessionId,
        questionId: currentQuestion.value.id,
        selectedAnswers: selectedAnswers.value
      }
    })

    if (response.success) {
      feedbackData.value = response.data
      showFeedback.value = true
      
      // Update progress
      if (response.data.progress) {
        sessionProgress.value = response.data.progress
      }
    }
  } catch (error) {
    console.error('Error submitting answer:', error)
  }
  loading.value = false
}

// Continue to next question
const continueToNext = async () => {
  showFeedback.value = false
  selectedAnswers.value = []
  
  if (feedbackData.value?.isCompleted) {
    // Session completed - show results
    await router.push(`/study/${examId}/results`)
  } else if (feedbackData.value?.nextQuestion) {
    // Load next question
    currentQuestion.value = feedbackData.value.nextQuestion
  }
  
  feedbackData.value = null
}

// Fetch current progress
const fetchProgress = async () => {
  try {
    const response = await $fetch('/api/study/progress')
    if (response.success) {
      sessionProgress.value = response.data.progress
      if (response.data.currentQuestion) {
        currentQuestion.value = response.data.currentQuestion
      }
    }
  } catch (error) {
    console.error('Error fetching progress:', error)
  }
}

// Answer selection handlers
const toggleAnswer = (index: number) => {
  if (!currentQuestion.value) return
  
  if (currentQuestion.value.questionType === 'multiple-choice') {
    // Single selection
    selectedAnswers.value = [index]
  } else {
    // Multiple selection
    const answerIndex = selectedAnswers.value.indexOf(index)
    if (answerIndex > -1) {
      selectedAnswers.value.splice(answerIndex, 1)
    } else {
      selectedAnswers.value.push(index)
    }
  }
}

const isAnswerSelected = (index: number) => {
  return selectedAnswers.value.includes(index)
}

// Check if we can continue
const canSubmit = computed(() => {
  return selectedAnswers.value.length > 0 && !loading.value
})

// Load existing session on mount
onMounted(async () => {
  try {
    await fetchProgress()
    if (sessionProgress.value) {
      sessionStarted.value = true
      studySession.value = {
        sessionId: sessionProgress.value.sessionId,
        examId: sessionProgress.value.examId
      }
    }
  } catch (error) {
    // No existing session
  }
})
</script>

<template>
  <div class="study-page">
    <!-- Study Session Setup -->
    <div v-if="!sessionStarted" class="setup-container">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-card class="pa-6">
              <v-card-title class="text-h4 text-center mb-4">
                <v-icon class="mr-3" color="primary">mdi-book-open-page-variant</v-icon>
                Study Mode
              </v-card-title>
              
              <v-card-subtitle class="text-center mb-6" v-if="exam">
                {{ exam.examCode }} - {{ exam.examName }}
              </v-card-subtitle>

              <!-- Study Mode Selection -->
              <div class="mb-6">
                <h3 class="text-h6 mb-3">Study Mode</h3>
                <v-btn-toggle
                  v-model="selectedStudyMode"
                  mandatory
                  class="d-flex flex-wrap gap-2"
                >
                  <v-btn
                    v-for="mode in studyModeOptions"
                    :key="mode.value"
                    :value="mode.value"
                    class="flex-fill"
                    variant="outlined"
                  >
                    <v-icon start>{{ mode.icon }}</v-icon>
                    {{ mode.title }}
                  </v-btn>
                </v-btn-toggle>
              </div>

              <!-- Max Questions -->
              <div class="mb-6">
                <h3 class="text-h6 mb-3">Number of Questions</h3>
                <v-text-field
                  v-model.number="maxQuestions"
                  type="number"
                  label="Max questions (0 = all)"
                  variant="outlined"
                  min="0"
                  max="200"
                  hint="Set to 0 to study all available questions"
                />
              </div>

              <!-- Start Button -->
              <v-btn
                color="primary"
                size="large"
                block
                @click="startStudySession"
                :loading="loading"
              >
                <v-icon start>mdi-play</v-icon>
                Start Study Session
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Study Interface -->
    <div v-else-if="currentQuestion && !showFeedback" class="study-interface">
      <!-- Progress Header -->
      <v-app-bar color="primary" density="compact">
        <v-toolbar-title>
          <v-icon class="mr-2">mdi-book-open-page-variant</v-icon>
          Study Mode
        </v-toolbar-title>
        
        <v-spacer />
        
        <!-- Progress Info -->
        <div v-if="sessionProgress" class="d-flex align-center mr-4">
          <v-chip color="white" text-color="primary" class="mr-2">
            {{ sessionProgress.current + 1 }} / {{ sessionProgress.total }}
          </v-chip>
          <v-chip color="success" text-color="white" class="mr-2">
            {{ sessionProgress.correct }} correct
          </v-chip>
          <v-chip color="error" text-color="white">
            {{ sessionProgress.incorrect }} incorrect
          </v-chip>
        </div>
      </v-app-bar>

      <v-container class="pt-6">
        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <!-- Question Card -->
            <StudyQuestionDisplay
              :question="currentQuestion"
              :selected-answers="selectedAnswers"
              :can-submit="canSubmit"
              :loading="loading"
              @answer-selected="toggleAnswer"
              @submit="submitAnswer"
            />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Feedback Modal -->
    <StudyFeedbackModal
      v-if="showFeedback && feedbackData"
      :feedback="feedbackData"
      :question="currentQuestion"
      @continue="continueToNext"
    />
  </div>
</template>

<style scoped>
.study-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.setup-container {
  padding: 60px 0;
}

.study-interface {
  min-height: 100vh;
}
</style>