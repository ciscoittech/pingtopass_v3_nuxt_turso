<template>
  <v-card elevation="0" rounded="lg" class="question-card">
    <!-- Header -->
    <v-card-text class="pa-6 pb-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-avatar color="primary" variant="tonal" size="44" class="mr-3">
            <v-icon>mdi-help-circle</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold">Question {{ questionNumber }}</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ question.questionType === 'multiple-choice' ? 'Select one answer' : 'Select all that apply' }}
            </p>
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="d-flex gap-2">
          <v-btn
            icon
            variant="text"
            size="small"
            @click="$emit('bookmark')"
          >
            <v-icon :color="isBookmarked ? 'warning' : 'default'">
              {{ isBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}
            </v-icon>
            <v-tooltip activator="parent" location="bottom">
              {{ isBookmarked ? 'Remove bookmark' : 'Bookmark question' }}
            </v-tooltip>
          </v-btn>
          
          <v-btn
            icon
            variant="text"
            size="small"
            @click="$emit('flag')"
          >
            <v-icon :color="isFlagged ? 'error' : 'default'">
              {{ isFlagged ? 'mdi-flag' : 'mdi-flag-outline' }}
            </v-icon>
            <v-tooltip activator="parent" location="bottom">
              {{ isFlagged ? 'Remove flag' : 'Flag for review' }}
            </v-tooltip>
          </v-btn>
          
          <v-btn
            icon
            variant="text"
            size="small"
            @click="showKeyboardHelp = true"
          >
            <v-icon>mdi-keyboard</v-icon>
            <v-tooltip activator="parent" location="bottom">
              Keyboard shortcuts
            </v-tooltip>
          </v-btn>
        </div>
      </div>

      <v-divider class="mb-4" />

      <!-- Question Text -->
      <div class="question-text mb-6">
        <p class="text-body-1" v-html="formattedQuestionText"></p>
        
        <!-- Code block if present -->
        <v-card
          v-if="question.codeBlock"
          variant="tonal"
          color="grey"
          class="mt-4"
        >
          <v-card-text>
            <pre class="code-block"><code>{{ question.codeBlock }}</code></pre>
          </v-card-text>
        </v-card>
      </div>

      <!-- Answer Options -->
      <div class="answer-options">
        <StudyAnswerOption
          v-for="(option, index) in question.options"
          :key="`option-${index}`"
          :option="option"
          :index="index"
          :selected="isSelected(index)"
          :isMultipleChoice="question.questionType === 'multiple-choice'"
          :showFeedback="showFeedback"
          :isCorrect="question.correctAnswers.includes(index)"
          @select="selectAnswer(index)"
        />
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-divider />
    <v-card-actions class="pa-6 pt-4">
      <div class="text-caption text-medium-emphasis">
        <kbd>Space</kbd> or <kbd>Enter</kbd> to submit
      </div>
      
      <v-spacer />
      
      <v-btn
        variant="outlined"
        @click="$emit('skip')"
        :disabled="showFeedback"
      >
        Skip Question
      </v-btn>
      
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        :disabled="!canSubmit || showFeedback"
        :loading="loading"
        @click="$emit('submit')"
      >
        <v-icon start>mdi-check</v-icon>
        Submit Answer
      </v-btn>
    </v-card-actions>

    <!-- Keyboard Help Dialog -->
    <v-dialog v-model="showKeyboardHelp" max-width="500">
      <StudyKeyboardHelp @close="showKeyboardHelp = false" />
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
interface Question {
  id: string
  questionText: string
  questionType: 'multiple-choice' | 'multiple-answer'
  options: string[]
  correctAnswers: number[]
  explanation: string
  codeBlock?: string
  resources?: Array<{
    title: string
    url: string
  }>
}

interface Props {
  question: Question
  selectedAnswers: number[]
  showFeedback?: boolean
  isBookmarked?: boolean
  isFlagged?: boolean
  loading?: boolean
  questionIndex: number
}

const props = withDefaults(defineProps<Props>(), {
  showFeedback: false,
  isBookmarked: false,
  isFlagged: false,
  loading: false
})

const emit = defineEmits<{
  'answer-selected': [index: number]
  'submit': []
  'skip': []
  'bookmark': []
  'flag': []
  'report': []
}>()

// Local state
const showKeyboardHelp = ref(false)

// Computed
const canSubmit = computed(() => props.selectedAnswers.length > 0)

const questionNumber = computed(() => props.questionIndex + 1)

const formattedQuestionText = computed(() => {
  // Basic formatting for question text
  return props.question.questionText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
})

// Methods
const isSelected = (index: number) => {
  return props.selectedAnswers.includes(index)
}

const selectAnswer = (index: number) => {
  if (!props.showFeedback) {
    emit('answer-selected', index)
  }
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  // Prevent shortcuts in inputs
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }
  
  // Don't handle shortcuts when showing feedback
  if (props.showFeedback) {
    return
  }
  
  switch (event.key.toLowerCase()) {
    case 'a':
    case 'b':
    case 'c':
    case 'd':
    case 'e':
    case 'f':
      const letterIndex = event.key.toLowerCase().charCodeAt(0) - 97
      if (letterIndex < props.question.options.length) {
        selectAnswer(letterIndex)
        event.preventDefault()
      }
      break
    
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      const numberIndex = parseInt(event.key) - 1
      if (numberIndex < props.question.options.length) {
        selectAnswer(numberIndex)
        event.preventDefault()
      }
      break
    
    case 'enter':
    case ' ':
      if (canSubmit.value) {
        emit('submit')
        event.preventDefault()
      }
      break
    
    case 'arrowup':
    case 'arrowdown':
      if (props.question.questionType === 'multiple-choice' && props.selectedAnswers.length > 0) {
        const currentIndex = props.selectedAnswers[0]
        const nextIndex = event.key === 'arrowup' 
          ? (currentIndex - 1 + props.question.options.length) % props.question.options.length
          : (currentIndex + 1) % props.question.options.length
        selectAnswer(nextIndex)
        event.preventDefault()
      }
      break
    
    case 'b':
      if (event.ctrlKey || event.metaKey) {
        emit('bookmark')
        event.preventDefault()
      }
      break
    
    case 'f':
      if (event.ctrlKey || event.metaKey) {
        emit('flag')
        event.preventDefault()
      }
      break
    
    case '?':
    case 'h':
      showKeyboardHelp.value = true
      event.preventDefault()
      break
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.question-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}

.question-text {
  line-height: 1.7;
  
  :deep(.inline-code) {
    padding: 2px 6px;
    background: rgba(var(--v-theme-primary), 0.1);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9em;
  }
}

.code-block {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
}

kbd {
  display: inline-block;
  padding: 3px 6px;
  font-size: 0.75rem;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  font-family: 'Monaco', 'Menlo', monospace;
  margin: 0 2px;
}
</style>