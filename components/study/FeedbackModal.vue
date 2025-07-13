<script setup lang="ts">
interface Props {
  feedback: {
    isCorrect: boolean
    correctAnswer: number[]
    explanation: string
    isCompleted: boolean
    progress: {
      current: number
      total: number
      correct: number
      incorrect: number
      percentage: number
    }
    nextQuestion?: any
  }
  question: {
    id: string
    questionText: string
    questionType: string
    options: string[]
  }
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

const continueStudy = () => {
  emit('continue')
}

const progressPercentage = computed(() => {
  return Math.round((props.feedback.progress.current / props.feedback.progress.total) * 100)
})
</script>

<template>
  <v-dialog model-value persistent max-width="800px" scrollable>
    <v-card>
      <!-- Header -->
      <v-card-title class="feedback-header" :class="feedback.isCorrect ? 'bg-success' : 'bg-error'">
        <div class="d-flex align-center text-white">
          <v-icon class="mr-3" size="32">
            {{ feedback.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
          <div>
            <h2 class="text-h5 mb-1">
              {{ feedback.isCorrect ? 'Correct!' : 'Incorrect' }}
            </h2>
            <p class="text-body-2 mb-0 opacity-90">
              {{ feedback.isCorrect ? 'Well done! You got it right.' : 'Don\'t worry, let\'s learn from this.' }}
            </p>
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
              :variant="isCorrectAnswer(index) ? 'tonal' : 'outlined'"
              :color="isCorrectAnswer(index) ? 'success' : 'default'"
            >
              <v-card-text class="d-flex align-center pa-3">
                <!-- Option Label -->
                <v-avatar
                  :color="isCorrectAnswer(index) ? 'success' : 'grey-lighten-1'"
                  size="28"
                  class="mr-3"
                >
                  <span class="text-body-2 font-weight-bold">
                    {{ getOptionLabel(index) }}
                  </span>
                </v-avatar>

                <!-- Option Text -->
                <div class="flex-grow-1">
                  <p class="text-body-1 mb-0" :class="{ 'font-weight-bold': isCorrectAnswer(index) }">
                    {{ option }}
                  </p>
                </div>

                <!-- Correct Answer Indicator -->
                <v-icon
                  v-if="isCorrectAnswer(index)"
                  color="success"
                  size="24"
                >
                  mdi-check-circle
                </v-icon>
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
          <h3 class="text-h6 mb-3 text-grey-darken-2">Progress:</h3>
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-card color="grey-lighten-4" variant="tonal" class="pa-4 text-center">
                <div class="text-h4 text-primary mb-1">{{ feedback.progress.current }}</div>
                <div class="text-body-2 text-grey-darken-1">of {{ feedback.progress.total }} questions</div>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-card color="success-lighten-4" variant="tonal" class="pa-4 text-center">
                <div class="text-h4 text-success mb-1">{{ feedback.progress.percentage }}%</div>
                <div class="text-body-2 text-grey-darken-1">accuracy</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Progress Bar -->
          <v-progress-linear
            :model-value="progressPercentage"
            color="primary"
            height="8"
            rounded
            class="mt-4"
          />
          <div class="d-flex justify-space-between mt-2">
            <span class="text-caption">{{ feedback.progress.current }} completed</span>
            <span class="text-caption">{{ feedback.progress.total - feedback.progress.current }} remaining</span>
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

.question-review .v-card {
  background: #f8f9fa;
  border-left: 4px solid #1976d2;
}

.option-review {
  transition: all 0.2s ease;
}

.explanation .v-card {
  border-left: 4px solid #2196f3;
}

.completion-message {
  text-align: center;
}

@media (max-width: 768px) {
  .v-card-text {
    padding: 16px !important;
  }
}
</style>