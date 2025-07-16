<template>
  <v-card elevation="0" rounded="lg" class="navigation-bar">
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <!-- Previous Button -->
        <v-btn
          variant="outlined"
          size="small"
          :disabled="!canGoPrevious"
          @click="goPrevious"
        >
          <v-icon start>mdi-chevron-left</v-icon>
          Previous
        </v-btn>

        <!-- Question Indicators -->
        <div class="question-indicators d-flex align-center gap-1">
          <v-chip
            v-for="(questionId, index) in questionsOrder"
            :key="questionId"
            :color="getQuestionColor(questionId, index)"
            :variant="currentQuestionIndex === index ? 'flat' : 'tonal'"
            size="x-small"
            class="cursor-pointer"
            @click="goToQuestion(index)"
          >
            {{ index + 1 }}
            <v-tooltip activator="parent" location="top">
              <div>Question {{ index + 1 }}</div>
              <div v-if="isAnswered(questionId)" class="text-caption">
                {{ isCorrect(questionId) ? 'Correct' : 'Incorrect' }}
              </div>
              <div v-if="isBookmarked(questionId)" class="text-caption">
                <v-icon size="x-small">mdi-bookmark</v-icon> Bookmarked
              </div>
              <div v-if="isFlagged(questionId)" class="text-caption">
                <v-icon size="x-small">mdi-flag</v-icon> Flagged
              </div>
            </v-tooltip>
          </v-chip>
        </div>

        <!-- Next Button -->
        <v-btn
          variant="outlined"
          size="small"
          :disabled="!canGoNext"
          @click="goNext"
        >
          Next
          <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <!-- Quick Stats -->
      <v-divider class="my-3" />
      <div class="d-flex align-center justify-space-between text-caption">
        <div class="d-flex align-center gap-3">
          <span>
            <v-icon size="small" color="success">mdi-check-circle</v-icon>
            {{ correctCount }} Correct
          </span>
          <span>
            <v-icon size="small" color="error">mdi-close-circle</v-icon>
            {{ incorrectCount }} Incorrect
          </span>
          <span>
            <v-icon size="small" color="grey">mdi-circle-outline</v-icon>
            {{ unansweredCount }} Unanswered
          </span>
        </div>
        
        <div class="d-flex align-center gap-3">
          <span v-if="bookmarkedCount > 0">
            <v-icon size="small" color="warning">mdi-bookmark</v-icon>
            {{ bookmarkedCount }} Bookmarked
          </span>
          <span v-if="flaggedCount > 0">
            <v-icon size="small" color="error">mdi-flag</v-icon>
            {{ flaggedCount }} Flagged
          </span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  currentQuestionIndex: number
  questionsOrder: string[]
  answers: Record<string, {
    questionId: string
    selectedAnswers: number[]
    isCorrect: boolean
    timeSpent: number
    answeredAt: string
  }>
  bookmarks: string[]
  flags: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'navigate': [index: number]
}>()

// Computed
const canGoPrevious = computed(() => props.currentQuestionIndex > 0)
const canGoNext = computed(() => props.currentQuestionIndex < props.questionsOrder.length - 1)

const answeredQuestions = computed(() => Object.keys(props.answers))
const correctCount = computed(() => Object.values(props.answers).filter(a => a.isCorrect).length)
const incorrectCount = computed(() => Object.values(props.answers).filter(a => !a.isCorrect).length)
const unansweredCount = computed(() => props.questionsOrder.length - answeredQuestions.value.length)
const bookmarkedCount = computed(() => props.bookmarks.length)
const flaggedCount = computed(() => props.flags.length)

// Methods
const goPrevious = () => {
  if (canGoPrevious.value) {
    emit('navigate', props.currentQuestionIndex - 1)
  }
}

const goNext = () => {
  if (canGoNext.value) {
    emit('navigate', props.currentQuestionIndex + 1)
  }
}

const goToQuestion = (index: number) => {
  emit('navigate', index)
}

const isAnswered = (questionId: string) => {
  return questionId in props.answers
}

const isCorrect = (questionId: string) => {
  return props.answers[questionId]?.isCorrect || false
}

const isBookmarked = (questionId: string) => {
  return props.bookmarks.includes(questionId)
}

const isFlagged = (questionId: string) => {
  return props.flags.includes(questionId)
}

const getQuestionColor = (questionId: string, index: number) => {
  if (!isAnswered(questionId)) {
    return 'grey'
  }
  return isCorrect(questionId) ? 'success' : 'error'
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  // Prevent shortcuts in inputs
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }
  
  switch (event.key) {
    case 'ArrowLeft':
      if (event.altKey || event.metaKey) {
        goPrevious()
        event.preventDefault()
      }
      break
    
    case 'ArrowRight':
      if (event.altKey || event.metaKey) {
        goNext()
        event.preventDefault()
      }
      break
    
    case 'g':
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + G - Go to question
        const questionNumber = prompt('Go to question number:')
        if (questionNumber) {
          const index = parseInt(questionNumber) - 1
          if (index >= 0 && index < props.questionsOrder.length) {
            goToQuestion(index)
          }
        }
        event.preventDefault()
      }
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.navigation-bar {
  background: rgba(var(--v-theme-surface), 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  position: sticky;
  top: 64px;
  z-index: 10;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.question-indicators {
  max-width: 600px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 2px;
  }
  
  .v-chip {
    min-width: 32px;
    height: 24px;
    font-size: 11px;
    font-weight: 600;
    
    &.cursor-pointer:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

@media (max-width: 960px) {
  .question-indicators {
    max-width: 200px;
  }
}
</style>