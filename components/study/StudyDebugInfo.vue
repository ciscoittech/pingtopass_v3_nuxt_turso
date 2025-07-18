<template>
  <v-card v-if="showDebug" class="mb-4" color="grey-darken-3">
    <v-card-title class="text-h6">
      <v-icon class="mr-2">mdi-bug</v-icon>
      Debug Information
    </v-card-title>
    <v-card-text>
      <div class="debug-grid">
        <div class="debug-section">
          <h4>Session Info</h4>
          <pre>{{ sessionInfo }}</pre>
        </div>
        <div class="debug-section">
          <h4>Current Question</h4>
          <pre>{{ questionInfo }}</pre>
        </div>
        <div class="debug-section">
          <h4>Store State</h4>
          <pre>{{ storeState }}</pre>
        </div>
        <div class="debug-section">
          <h4>Progress</h4>
          <pre>{{ progressInfo }}</pre>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useStudyStore } from '~/stores/study'

// Show debug info only in development
const config = useRuntimeConfig()
const showDebug = ref(config.public.nodeEnv === 'development' || import.meta.env.DEV)

const studyStore = useStudyStore()

const sessionInfo = computed(() => {
  if (!studyStore.currentSession) return 'No session'
  
  return {
    id: studyStore.currentSession.id,
    examId: studyStore.currentSession.examId,
    status: studyStore.currentSession.status,
    mode: studyStore.currentSession.mode,
    totalQuestions: studyStore.currentSession.totalQuestions,
    currentIndex: studyStore.currentSession.currentQuestionIndex,
    questionsLoaded: studyStore.currentSession.questions?.length || 0,
    answersCount: Object.keys(studyStore.currentSession.answers || {}).length
  }
})

const questionInfo = computed(() => {
  if (!studyStore.currentQuestion) return 'No current question'
  
  return {
    id: studyStore.currentQuestion.id,
    type: studyStore.currentQuestion.questionType,
    textPreview: studyStore.currentQuestion.questionText?.substring(0, 50) + '...',
    optionsCount: studyStore.currentQuestion.options?.length,
    hasCorrectAnswers: !!studyStore.currentQuestion.correctAnswers,
    correctAnswersCount: studyStore.currentQuestion.correctAnswers?.length
  }
})

const storeState = computed(() => ({
  loading: studyStore.loading,
  error: studyStore.error,
  showFeedback: studyStore.showFeedback,
  selectedAnswers: studyStore.selectedAnswers,
  sessionTime: studyStore.sessionTime,
  hasCurrentQuestion: studyStore.hasCurrentQuestion,
  currentQuestionId: studyStore.currentQuestionId
}))

const progressInfo = computed(() => {
  const progress = studyStore.sessionProgress
  if (!progress) return 'No progress data'
  
  return {
    current: progress.current,
    total: progress.total,
    answered: progress.answered,
    correct: progress.correct,
    incorrect: progress.incorrect,
    accuracy: progress.accuracy?.toFixed(1) + '%',
    remaining: progress.remaining
  }
})
</script>

<style scoped>
.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.debug-section {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 4px;
}

.debug-section h4 {
  margin: 0 0 0.5rem 0;
  color: #90caf9;
}

pre {
  margin: 0;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>