<template>
  <v-card elevation="0" rounded="lg" class="progress-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <h3 class="text-subtitle-1 font-weight-semibold">Test Progress</h3>
        <v-chip
          :color="allAnswered ? 'success' : 'warning'"
          variant="tonal"
          size="small"
        >
          {{ answeredCount }} / {{ totalQuestions }} Answered
        </v-chip>
      </div>

      <!-- Question Grid -->
      <div class="question-grid">
        <v-btn
          v-for="index in totalQuestions"
          :key="`q-${index}`"
          :color="getQuestionColor(index - 1)"
          :variant="getQuestionVariant(index - 1)"
          size="small"
          class="question-btn"
          @click="$emit('navigate', index - 1)"
        >
          {{ index }}
          <v-icon
            v-if="isFlagged(index - 1)"
            size="12"
            class="flag-icon"
          >
            mdi-flag
          </v-icon>
        </v-btn>
      </div>

      <!-- Legend -->
      <v-divider class="my-3" />
      <div class="d-flex flex-wrap gap-3 text-caption">
        <div class="d-flex align-center">
          <v-icon size="16" color="primary" class="mr-1">mdi-circle</v-icon>
          Current
        </div>
        <div class="d-flex align-center">
          <v-icon size="16" color="success" class="mr-1">mdi-check-circle</v-icon>
          Answered
        </div>
        <div class="d-flex align-center">
          <v-icon size="16" color="grey" class="mr-1">mdi-circle-outline</v-icon>
          Not Answered
        </div>
        <div class="d-flex align-center">
          <v-icon size="16" color="warning" class="mr-1">mdi-flag</v-icon>
          Flagged
        </div>
      </div>

      <!-- Quick Stats -->
      <v-divider class="my-3" />
      <v-row dense>
        <v-col cols="4" class="text-center">
          <div class="text-h6 font-weight-bold text-success">{{ answeredCount }}</div>
          <div class="text-caption text-medium-emphasis">Answered</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h6 font-weight-bold text-grey">{{ unansweredCount }}</div>
          <div class="text-caption text-medium-emphasis">Remaining</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h6 font-weight-bold text-warning">{{ flaggedCount }}</div>
          <div class="text-caption text-medium-emphasis">Flagged</div>
        </v-col>
      </v-row>

      <!-- Actions -->
      <div class="mt-4">
        <v-btn
          color="primary"
          variant="flat"
          block
          :disabled="!allAnswered"
          @click="$emit('submit-test')"
        >
          <v-icon start>mdi-check-all</v-icon>
          {{ allAnswered ? 'Submit Test' : `Answer ${unansweredCount} More Questions` }}
        </v-btn>
        
        <v-btn
          v-if="flaggedCount > 0"
          variant="outlined"
          block
          class="mt-2"
          @click="navigateToNextFlagged"
        >
          <v-icon start>mdi-flag</v-icon>
          Review Flagged ({{ flaggedCount }})
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  totalQuestions: number
  currentQuestion: number
  answers: Record<number, number[]> // questionIndex -> selectedAnswers
  flagged: number[] // Array of flagged question indices
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: [questionIndex: number]
  'submit-test': []
}>()

// Computed
const answeredCount = computed(() => {
  return Object.keys(props.answers).filter(key => 
    props.answers[parseInt(key)].length > 0
  ).length
})

const unansweredCount = computed(() => {
  return props.totalQuestions - answeredCount.value
})

const flaggedCount = computed(() => {
  return props.flagged.length
})

const allAnswered = computed(() => {
  return answeredCount.value === props.totalQuestions
})

// Methods
const getQuestionColor = (index: number) => {
  if (index === props.currentQuestion) return 'primary'
  if (props.answers[index] && props.answers[index].length > 0) return 'success'
  if (props.flagged.includes(index)) return 'warning'
  return 'default'
}

const getQuestionVariant = (index: number) => {
  if (index === props.currentQuestion) return 'flat'
  if (props.answers[index] && props.answers[index].length > 0) return 'tonal'
  return 'outlined'
}

const isFlagged = (index: number) => {
  return props.flagged.includes(index)
}

const navigateToNextFlagged = () => {
  // Find next flagged question after current
  const currentIndex = props.currentQuestion
  const nextFlagged = props.flagged.find(index => index > currentIndex)
  
  if (nextFlagged !== undefined) {
    emit('navigate', nextFlagged)
  } else if (props.flagged.length > 0) {
    // Wrap around to first flagged
    emit('navigate', props.flagged[0])
  }
}
</script>

<style lang="scss" scoped>
.progress-card {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
}

.question-btn {
  min-width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  position: relative;
  font-weight: 600;
  
  .flag-icon {
    position: absolute;
    top: 2px;
    right: 2px;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}
</style>