<script setup lang="ts">
interface Props {
  modelValue: boolean
  questions: string[]
  currentIndex: number
  questionStatus: Record<string, 'answered' | 'flagged' | 'unanswered'>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'navigate', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const navigateToQuestion = (index: number) => {
  emit('navigate', index)
}

const getQuestionStatusColor = (questionId: string, index: number) => {
  const status = props.questionStatus[questionId]
  
  if (index === props.currentIndex) {
    return 'primary'
  }
  
  switch (status) {
    case 'answered':
      return 'success'
    case 'flagged':
      return 'warning'
    default:
      return 'grey'
  }
}

const getQuestionStatusIcon = (questionId: string, index: number) => {
  const status = props.questionStatus[questionId]
  
  if (index === props.currentIndex) {
    return 'mdi-account-circle'
  }
  
  switch (status) {
    case 'answered':
      return 'mdi-check-circle'
    case 'flagged':
      return 'mdi-flag'
    default:
      return 'mdi-circle-outline'
  }
}

const questionCounts = computed(() => {
  const counts = {
    answered: 0,
    flagged: 0,
    unanswered: 0
  }
  
  Object.values(props.questionStatus).forEach(status => {
    counts[status]++
  })
  
  return counts
})
</script>

<template>
  <v-dialog v-model="isOpen" max-width="800px">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-grid</v-icon>
        Question Navigation
        <v-spacer />
        <v-btn
          icon
          size="small"
          @click="isOpen = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <!-- Progress Summary -->
      <v-card-subtitle>
        <v-row class="my-2">
          <v-col cols="4">
            <v-chip
              color="success"
              size="small"
              variant="tonal"
              class="ma-1"
            >
              <v-icon start size="14">mdi-check-circle</v-icon>
              {{ questionCounts.answered }} Answered
            </v-chip>
          </v-col>
          
          <v-col cols="4">
            <v-chip
              color="warning"
              size="small"
              variant="tonal"
              class="ma-1"
            >
              <v-icon start size="14">mdi-flag</v-icon>
              {{ questionCounts.flagged }} Flagged
            </v-chip>
          </v-col>
          
          <v-col cols="4">
            <v-chip
              color="grey"
              size="small"
              variant="tonal"
              class="ma-1"
            >
              <v-icon start size="14">mdi-circle-outline</v-icon>
              {{ questionCounts.unanswered }} Unanswered
            </v-chip>
          </v-col>
        </v-row>
      </v-card-subtitle>
      
      <v-divider />
      
      <v-card-text class="pa-4">
        <!-- Question Grid -->
        <div class="question-grid">
          <v-btn
            v-for="(questionId, index) in questions"
            :key="questionId"
            class="question-button ma-1"
            :color="getQuestionStatusColor(questionId, index)"
            :variant="index === currentIndex ? 'elevated' : 'tonal'"
            size="large"
            @click="navigateToQuestion(index)"
          >
            <div class="question-button-content">
              <div class="question-number">{{ index + 1 }}</div>
              <v-icon
                size="14"
                class="question-status-icon"
              >
                {{ getQuestionStatusIcon(questionId, index) }}
              </v-icon>
            </div>
          </v-btn>
        </div>
      </v-card-text>
      
      <v-divider />
      
      <!-- Legend -->
      <v-card-text class="pa-4">
        <h4 class="text-subtitle-2 mb-3">Legend:</h4>
        <div class="legend-grid">
          <div class="legend-item">
            <v-icon color="primary" class="mr-2">mdi-account-circle</v-icon>
            <span class="text-body-2">Current Question</span>
          </div>
          
          <div class="legend-item">
            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
            <span class="text-body-2">Answered</span>
          </div>
          
          <div class="legend-item">
            <v-icon color="warning" class="mr-2">mdi-flag</v-icon>
            <span class="text-body-2">Flagged for Review</span>
          </div>
          
          <div class="legend-item">
            <v-icon color="grey" class="mr-2">mdi-circle-outline</v-icon>
            <span class="text-body-2">Unanswered</span>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          @click="isOpen = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.question-button {
  aspect-ratio: 1;
  min-height: 80px !important;
  border-radius: 12px !important;
}

.question-button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.question-number {
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
}

.question-status-icon {
  margin-top: 4px;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .question-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
  
  .question-button {
    min-height: 60px !important;
  }
  
  .question-number {
    font-size: 1rem;
  }
  
  .legend-grid {
    grid-template-columns: 1fr;
  }
}
</style>