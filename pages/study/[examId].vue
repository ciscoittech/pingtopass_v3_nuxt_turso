<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

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
  { title: 'Sequential', value: 'sequential', icon: 'solar:arrow-right-linear' },
  { title: 'Random', value: 'random', icon: 'solar:shuffle-linear' },
  { title: 'Flagged Only', value: 'flagged', icon: 'solar:flag-linear' },
  { title: 'Incorrect Only', value: 'incorrect', icon: 'solar:close-circle-linear' }
]

// Breadcrumb
const page = ref({ title: 'Study Mode' })
const breadcrumbs = ref([
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
    text: 'Study Mode',
    disabled: true,
    to: ''
  }
])

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
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    
    <!-- Study Session Setup -->
    <div v-if="!sessionStarted">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <UiParentCard>
            <div class="text-center mb-6">
              <v-avatar color="primary" variant="tonal" size="80" class="mb-4">
                <Icon icon="solar:book-2-bold-duotone" size="40" />
              </v-avatar>
              <h2 class="text-h4 mb-2">Study Mode</h2>
              <p class="text-subtitle-1 text-grey100" v-if="exam">
                {{ exam.examCode }} - {{ exam.examName }}
              </p>
            </div>

            <!-- Study Mode Selection -->
            <div class="mb-6">
              <h3 class="text-h6 mb-3">Choose Study Mode</h3>
              <v-btn-toggle
                v-model="selectedStudyMode"
                mandatory
                color="primary"
                class="d-flex flex-wrap gap-2"
                rounded="0"
                group
              >
                <v-btn
                  v-for="mode in studyModeOptions"
                  :key="mode.value"
                  :value="mode.value"
                  class="flex-fill"
                  variant="text"
                  elevation="10"
                >
                  <Icon :icon="mode.icon" class="mr-2" />
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
                color="primary"
              />
            </div>

            <!-- Start Button -->
            <v-btn
              color="primary"
              size="large"
              block
              variant="flat"
              @click="startStudySession"
              :loading="loading"
            >
              <Icon icon="solar:play-bold" class="mr-2" />
              Start Study Session
            </v-btn>
          </UiParentCard>
        </v-col>
      </v-row>
    </div>

    <!-- Study Interface -->
    <div v-else-if="currentQuestion && !showFeedback">
      <!-- Progress Bar -->
      <UiParentCard class="mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div class="d-flex align-center">
            <Icon icon="solar:book-2-line-duotone" size="24" class="mr-2 text-primary" />
            <h5 class="text-h5">Study Progress</h5>
          </div>
          
          <!-- Progress Info -->
          <div v-if="sessionProgress" class="d-flex align-center gap-2">
            <v-chip color="primary" variant="tonal">
              {{ sessionProgress.current + 1 }} / {{ sessionProgress.total }}
            </v-chip>
            <v-chip color="success" variant="tonal">
              <Icon icon="solar:check-circle-linear" size="16" class="mr-1" />
              {{ sessionProgress.correct }}
            </v-chip>
            <v-chip color="error" variant="tonal">
              <Icon icon="solar:close-circle-linear" size="16" class="mr-1" />
              {{ sessionProgress.incorrect }}
            </v-chip>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <v-progress-linear
          v-if="sessionProgress"
          :model-value="(sessionProgress.current / sessionProgress.total) * 100"
          color="primary"
          height="8"
          rounded
          class="mt-4"
        />
      </UiParentCard>

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