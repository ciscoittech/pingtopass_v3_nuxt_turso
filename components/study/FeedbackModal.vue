<script setup lang="ts">
interface Props {
  feedback: {
    isCorrect: boolean
    correctAnswer: number[]
    explanation: string
    isCompleted: boolean
    timeSpent?: number
    progress: {
      current: number
      total: number
      correct: number
      incorrect: number
      percentage: number
      averageTime?: number
      streak?: number
    }
    nextQuestion?: any
  }
  question: {
    id: string
    questionText: string
    questionType: string
    options: string[]
  }
  selectedAnswers?: number[]
}

interface Emits {
  (e: 'continue'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getOptionLabel = (index: number) => {
  return String.fromCharCode(65 + index) // A, B, C, D, etc.
}

const isCorrectAnswer = (index: number) => {
  return props.feedback.correctAnswer.includes(index)
}

const isSelectedAnswer = (index: number) => {
  return props.selectedAnswers?.includes(index) || false
}

const continueStudy = () => {
  emit('continue')
}

const progressPercentage = computed(() => {
  return Math.round((props.feedback.progress.current / props.feedback.progress.total) * 100)
})

const accuracyPercentage = computed(() => {
  const total = props.feedback.progress.correct + props.feedback.progress.incorrect
  if (total === 0) return 100
  return Math.round((props.feedback.progress.correct / total) * 100)
})

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

const getStreakMessage = () => {
  const streak = props.feedback.progress.streak || 0
  if (streak >= 5) return `🔥 ${streak} question streak!`
  if (streak >= 3) return `⚡ ${streak} in a row!`
  if (streak >= 2) return `✨ ${streak} correct!`
  return ''
}

const getOptionVariant = (index: number) => {
  if (isCorrectAnswer(index)) return 'tonal'
  if (isSelectedAnswer(index)) return 'outlined'
  return 'outlined'
}

const getOptionColor = (index: number) => {
  if (isCorrectAnswer(index)) return 'success'
  if (isSelectedAnswer(index) && !isCorrectAnswer(index)) return 'error'
  return 'default'
}

const getAvatarColor = (index: number) => {
  if (isCorrectAnswer(index)) return 'success'
  if (isSelectedAnswer(index) && !isCorrectAnswer(index)) return 'error'
  return 'grey-lighten-1'
}
</script>

<template>
  <v-dialog model-value persistent max-width="800px" scrollable>
    <v-card>
      <!-- Header -->
      <v-card-title class="feedback-header" :class="feedback.isCorrect ? 'bg-success' : 'bg-error'">
        <div class="d-flex align-center justify-space-between text-white">
          <div class="d-flex align-center">
            <v-icon class="mr-3" size="32">
              {{ feedback.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            <div>
              <h2 class="text-h5 mb-1">
                {{ feedback.isCorrect ? 'Correct!' : 'Incorrect' }}
              </h2>
              <div class="d-flex align-center">
                <p class="text-body-2 mb-0 opacity-90 mr-3">
                  {{ feedback.isCorrect ? 'Well done! You got it right.' : 'Don\'t worry, let\'s learn from this.' }}
                </p>
                <!-- Streak Display -->
                <div v-if="getStreakMessage()" class="streak-badge">
                  <v-chip
                    size="small"
                    color="warning"
                    variant="tonal"
                    class="text-caption font-weight-bold"
                  >
                    {{ getStreakMessage() }}
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Time Indicator -->
          <div v-if="feedback.timeSpent" class="time-indicator text-center">
            <v-icon size="20" class="mb-1">mdi-clock-outline</v-icon>
            <div class="text-caption">{{ formatTime(feedback.timeSpent) }}</div>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Question Review -->
        <div class="question-review mb-6">
          <h3 class="text-h6 mb-3 text-grey-darken-2">Question:</h3>
          <v-card variant="outlined" class="pa-4">
            <p class="text-body-1 mb-0">{{ question.questionText }}</p>
          </v-card>
        </div>

        <!-- Answer Options with Correct Indicators -->
        <div class="answer-review mb-6">
          <h3 class="text-h6 mb-3 text-grey-darken-2">Answer Options:</h3>
          
          <div class="options-list">
            <v-card
              v-for="(option, index) in question.options"
              :key="index"
              class="option-review mb-2"
              :variant="getOptionVariant(index)"
              :color="getOptionColor(index)"
            >
              <v-card-text class="d-flex align-center pa-3">
                <!-- Option Label -->
                <v-avatar
                  :color="getAvatarColor(index)"
                  size="28"
                  class="mr-3"
                >
                  <span class="text-body-2 font-weight-bold text-white">
                    {{ getOptionLabel(index) }}
                  </span>
                </v-avatar>

                <!-- Option Text -->
                <div class="flex-grow-1">
                  <p class="text-body-1 mb-0" :class="{ 'font-weight-bold': isCorrectAnswer(index) }">
                    {{ option }}
                  </p>
                  <!-- Your Answer Indicator -->
                  <div v-if="isSelectedAnswer(index)" class="text-caption text-grey-darken-1">
                    <v-icon size="14" class="mr-1">mdi-account</v-icon>
                    Your answer
                  </div>
                </div>

                <!-- Status Icons -->
                <div class="d-flex align-center">
                  <!-- Correct Answer Icon -->
                  <v-icon
                    v-if="isCorrectAnswer(index)"
                    color="success"
                    size="24"
                    class="mr-2"
                  >
                    mdi-check-circle
                  </v-icon>
                  
                  <!-- Selected Wrong Answer Icon -->
                  <v-icon
                    v-if="isSelectedAnswer(index) && !isCorrectAnswer(index)"
                    color="error"
                    size="24"
                  >
                    mdi-close-circle
                  </v-icon>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>

        <!-- Explanation -->
        <div v-if="feedback.explanation" class="explanation mb-6">
          <h3 class="text-h6 mb-3 text-grey-darken-2">Explanation:</h3>
          <v-card color="blue-lighten-5" variant="tonal" class="pa-4">
            <div class="d-flex">
              <v-icon color="blue" class="mr-3 mt-1">mdi-lightbulb</v-icon>
              <p class="text-body-1 mb-0">{{ feedback.explanation }}</p>
            </div>
          </v-card>
        </div>

        <!-- Progress Summary -->
        <div class="progress-summary">
          <h3 class="text-h6 mb-3 text-grey-darken-2">Progress & Performance:</h3>
          
          <!-- Main Progress Stats -->
          <v-row class="mb-4">
            <v-col cols="6" sm="3">
              <v-card color="grey-lighten-4" variant="tonal" class="pa-3 text-center">
                <v-icon color="primary" size="20" class="mb-1">mdi-progress-check</v-icon>
                <div class="text-h5 text-primary mb-1">{{ feedback.progress.current }}</div>
                <div class="text-caption text-grey-darken-1">of {{ feedback.progress.total }}</div>
              </v-card>
            </v-col>
            
            <v-col cols="6" sm="3">
              <v-card color="success-lighten-4" variant="tonal" class="pa-3 text-center">
                <v-icon color="success" size="20" class="mb-1">mdi-check-circle</v-icon>
                <div class="text-h5 text-success mb-1">{{ feedback.progress.correct }}</div>
                <div class="text-caption text-grey-darken-1">correct</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card color="error-lighten-4" variant="tonal" class="pa-3 text-center">
                <v-icon color="error" size="20" class="mb-1">mdi-close-circle</v-icon>
                <div class="text-h5 text-error mb-1">{{ feedback.progress.incorrect }}</div>
                <div class="text-caption text-grey-darken-1">incorrect</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card color="info-lighten-4" variant="tonal" class="pa-3 text-center">
                <v-icon color="info" size="20" class="mb-1">mdi-percent</v-icon>
                <div class="text-h5 text-info mb-1">{{ accuracyPercentage }}%</div>
                <div class="text-caption text-grey-darken-1">accuracy</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Performance Metrics -->
          <v-row v-if="feedback.timeSpent || feedback.progress.averageTime" class="mb-4">
            <v-col v-if="feedback.timeSpent" cols="6">
              <v-card color="purple-lighten-4" variant="tonal" class="pa-3 text-center">
                <v-icon color="purple" size="20" class="mb-1">mdi-clock-fast</v-icon>
                <div class="text-h6 text-purple mb-1">{{ formatTime(feedback.timeSpent) }}</div>
                <div class="text-caption text-grey-darken-1">this question</div>
              </v-card>
            </v-col>
            
            <v-col v-if="feedback.progress.averageTime" cols="6">
              <v-card color="orange-lighten-4" variant="tonal" class="pa-3 text-center">
                <v-icon color="orange" size="20" class="mb-1">mdi-clock-outline</v-icon>
                <div class="text-h6 text-orange mb-1">{{ formatTime(feedback.progress.averageTime) }}</div>
                <div class="text-caption text-grey-darken-1">avg time</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Progress Bar -->
          <div class="progress-bar-section">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2">Session Progress</span>
              <span class="text-subtitle-2 font-weight-bold">{{ progressPercentage }}%</span>
            </div>
            
            <v-progress-linear
              :model-value="progressPercentage"
              color="primary"
              height="12"
              rounded
              class="mb-2"
            >
              <template #default="{ value }">
                <span class="text-caption text-white font-weight-bold">{{ Math.ceil(value) }}%</span>
              </template>
            </v-progress-linear>
            
            <div class="d-flex justify-space-between">
              <span class="text-caption text-grey-darken-1">{{ feedback.progress.current }} completed</span>
              <span class="text-caption text-grey-darken-1">{{ feedback.progress.total - feedback.progress.current }} remaining</span>
            </div>
          </div>
        </div>

        <!-- Session Completion Message -->
        <div v-if="feedback.isCompleted" class="completion-message mt-6">
          <v-alert
            type="success"
            variant="tonal"
            prominent
            class="text-center"
          >
            <v-icon size="48" class="mb-2">mdi-trophy</v-icon>
            <div class="text-h6 mb-2">Study Session Complete!</div>
            <div class="text-body-1">
              You answered {{ feedback.progress.correct }} out of {{ feedback.progress.total }} questions correctly.
            </div>
          </v-alert>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        
        <v-btn
          v-if="feedback.isCompleted"
          color="primary"
          size="large"
          @click="continueStudy"
        >
          <v-icon start>mdi-chart-line</v-icon>
          View Results
        </v-btn>
        
        <v-btn
          v-else
          color="primary"
          size="large"
          @click="continueStudy"
        >
          <v-icon start>mdi-arrow-right</v-icon>
          Continue Studying
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.feedback-header {
  background: linear-gradient(135deg, var(--v-theme-primary) 0%, var(--v-theme-primary-darken-1) 100%);
}

.streak-badge {
  animation: pulse 1.5s ease-in-out infinite;
}

.time-indicator {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  backdrop-filter: blur(10px);
}

.question-review .v-card {
  background: #f8f9fa;
  border-left: 4px solid #1976d2;
}

.option-review {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.option-review:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.explanation .v-card {
  border-left: 4px solid #2196f3;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
}

.progress-summary .v-card {
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.progress-summary .v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.progress-bar-section {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.completion-message {
  text-align: center;
}

.completion-message .v-alert {
  background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
  animation: celebrate 0.6s ease-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes celebrate {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .v-card-text {
    padding: 16px !important;
  }
  
  .feedback-header .d-flex {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .time-indicator {
    margin-top: 8px;
    align-self: flex-end;
  }
}
</style>