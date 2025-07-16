<template>
  <v-card elevation="0" rounded="lg" class="navigation-grid">
    <v-card-text class="pa-4">
      <h3 class="text-h6 font-weight-semibold mb-3">Question Navigator</h3>
      
      <!-- Legend -->
      <div class="d-flex flex-wrap gap-3 mb-4 text-caption">
        <div class="d-flex align-center">
          <v-icon size="small" color="grey" class="mr-1">mdi-circle</v-icon>
          Not Answered
        </div>
        <div class="d-flex align-center">
          <v-icon size="small" color="success" class="mr-1">mdi-check-circle</v-icon>
          Answered
        </div>
        <div class="d-flex align-center">
          <v-icon size="small" color="error" class="mr-1">mdi-flag</v-icon>
          Flagged
        </div>
        <div class="d-flex align-center">
          <v-icon size="small" color="primary" class="mr-1">mdi-circle-slice-8</v-icon>
          Current
        </div>
      </div>
      
      <!-- Question Grid -->
      <div class="question-grid">
        <v-btn
          v-for="(questionId, index) in questionsOrder"
          :key="questionId"
          :color="getQuestionColor(questionId, index)"
          :variant="currentQuestionIndex === index ? 'flat' : 'tonal'"
          :icon="true"
          size="small"
          class="question-btn"
          @click="goToQuestion(index)"
        >
          <span class="text-caption font-weight-medium">{{ index + 1 }}</span>
          <v-icon
            v-if="isFlagged(questionId)"
            size="x-small"
            class="flag-indicator"
          >
            mdi-flag
          </v-icon>
          <v-tooltip activator="parent" location="top">
            <div>Question {{ index + 1 }}</div>
            <div v-if="isAnswered(questionId)" class="text-caption">
              Answered
            </div>
            <div v-if="isFlagged(questionId)" class="text-caption">
              Flagged for review
            </div>
          </v-tooltip>
        </v-btn>
      </div>
      
      <!-- Summary Stats -->
      <v-divider class="my-4" />
      <div class="summary-stats">
        <v-row dense>
          <v-col cols="6">
            <div class="stat-item">
              <span class="text-h6 font-weight-bold text-success">{{ answeredCount }}</span>
              <span class="text-caption text-medium-emphasis ml-1">Answered</span>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-item">
              <span class="text-h6 font-weight-bold text-grey">{{ unansweredCount }}</span>
              <span class="text-caption text-medium-emphasis ml-1">Remaining</span>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-item">
              <span class="text-h6 font-weight-bold text-error">{{ flaggedCount }}</span>
              <span class="text-caption text-medium-emphasis ml-1">Flagged</span>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-item">
              <span class="text-h6 font-weight-bold text-primary">{{ progressPercentage }}%</span>
              <span class="text-caption text-medium-emphasis ml-1">Complete</span>
            </div>
          </v-col>
        </v-row>
      </div>
      
      <!-- Quick Actions -->
      <div class="quick-actions mt-4">
        <v-btn
          v-if="firstUnanswered !== -1"
          variant="outlined"
          size="small"
          block
          @click="goToQuestion(firstUnanswered)"
        >
          <v-icon start size="small">mdi-skip-next</v-icon>
          Go to First Unanswered
        </v-btn>
        
        <v-btn
          v-if="firstFlagged !== -1"
          variant="outlined"
          size="small"
          block
          class="mt-2"
          @click="goToQuestion(firstFlagged)"
        >
          <v-icon start size="small">mdi-flag</v-icon>
          Review Flagged Questions
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  currentQuestionIndex: number
  questionsOrder: string[]
  answers: Record<string, any>
  flags: Array<{ questionId: string; questionIndex: number }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'navigate': [index: number]
}>()

// Computed
const answeredQuestions = computed(() => Object.keys(props.answers))
const answeredCount = computed(() => answeredQuestions.value.length)
const unansweredCount = computed(() => props.questionsOrder.length - answeredCount.value)
const flaggedCount = computed(() => props.flags.length)

const progressPercentage = computed(() => {
  if (props.questionsOrder.length === 0) return 0
  return Math.round((answeredCount.value / props.questionsOrder.length) * 100)
})

const firstUnanswered = computed(() => {
  return props.questionsOrder.findIndex(qId => !isAnswered(qId))
})

const firstFlagged = computed(() => {
  if (props.flags.length === 0) return -1
  return props.flags[0].questionIndex
})

// Methods
const goToQuestion = (index: number) => {
  emit('navigate', index)
}

const isAnswered = (questionId: string) => {
  return questionId in props.answers
}

const isFlagged = (questionId: string) => {
  return props.flags.some(f => f.questionId === questionId)
}

const getQuestionColor = (questionId: string, index: number) => {
  if (index === props.currentQuestionIndex) return 'primary'
  if (isFlagged(questionId)) return 'error'
  if (isAnswered(questionId)) return 'success'
  return 'grey'
}
</script>

<style lang="scss" scoped>
.navigation-grid {
  background: rgba(var(--v-theme-surface), 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 3px;
  }
}

.question-btn {
  position: relative;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .flag-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    background: rgb(var(--v-theme-error));
    color: white;
    border-radius: 50%;
    padding: 2px;
  }
}

.summary-stats {
  .stat-item {
    display: flex;
    align-items: baseline;
    padding: 4px 0;
  }
}

.quick-actions {
  .v-btn {
    text-transform: none;
  }
}

@media (max-width: 600px) {
  .question-grid {
    max-height: 200px;
  }
}
</style>