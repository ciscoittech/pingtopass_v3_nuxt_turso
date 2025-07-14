<script setup lang="ts">
interface Props {
  question: {
    id: string
    questionText: string
    questionType: string
    options: string[]
  }
  selectedAnswers: number[]
  canSubmit: boolean
  loading: boolean
}

interface Emits {
  (e: 'answer-selected', index: number): void
  (e: 'submit'): void
  (e: 'bookmark'): void
  (e: 'flag'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const questionRef = ref<HTMLElement>()
const keyboardHelpVisible = ref(false)

const selectAnswer = (index: number) => {
  emit('answer-selected', index)
}

const submitAnswer = () => {
  emit('submit')
}

const toggleBookmark = () => {
  emit('bookmark')
}

const toggleFlag = () => {
  emit('flag')
}

const getOptionLabel = (index: number) => {
  return String.fromCharCode(65 + index) // A, B, C, D, etc.
}

const isMultipleChoice = computed(() => {
  return props.question.questionType === 'multiple-choice'
})

const isSelected = (index: number) => {
  return props.selectedAnswers.includes(index)
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  // Prevent shortcuts when typing in inputs
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }
  
  switch (event.key.toLowerCase()) {
    case 'a':
    case 'b':
    case 'c':
    case 'd':
    case 'e':
    case 'f':
      // Select option A, B, C, D, E, F
      const optionIndex = event.key.toLowerCase().charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
      if (optionIndex < props.question.options.length) {
        selectAnswer(optionIndex)
        event.preventDefault()
      }
      break
    
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      // Select option by number
      const numberIndex = parseInt(event.key) - 1
      if (numberIndex < props.question.options.length) {
        selectAnswer(numberIndex)
        event.preventDefault()
      }
      break
    
    case 'enter':
    case ' ': // Space bar
      if (props.canSubmit) {
        submitAnswer()
        event.preventDefault()
      }
      break
    
    case 'arrowup':
      // Select previous option
      if (props.selectedAnswers.length > 0) {
        const currentIndex = Math.min(...props.selectedAnswers)
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : props.question.options.length - 1
        selectAnswer(prevIndex)
        event.preventDefault()
      }
      break
    
    case 'arrowdown':
      // Select next option
      if (props.selectedAnswers.length > 0) {
        const currentIndex = Math.max(...props.selectedAnswers)
        const nextIndex = currentIndex < props.question.options.length - 1 ? currentIndex + 1 : 0
        selectAnswer(nextIndex)
        event.preventDefault()
      } else if (props.question.options.length > 0) {
        selectAnswer(0)
        event.preventDefault()
      }
      break
    
    case 'b':
      // Bookmark (Ctrl/Cmd + B)
      if (event.ctrlKey || event.metaKey) {
        toggleBookmark()
        event.preventDefault()
      }
      break
    
    case 'f':
      // Flag (Ctrl/Cmd + F)
      if (event.ctrlKey || event.metaKey) {
        toggleFlag()
        event.preventDefault()
      }
      break
    
    case '?':
    case 'h':
      // Show help
      keyboardHelpVisible.value = true
      event.preventDefault()
      break
    
    case 'escape':
      // Close help or exit
      if (keyboardHelpVisible.value) {
        keyboardHelpVisible.value = false
        event.preventDefault()
      }
      break
  }
}

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  // Focus the question container for keyboard navigation
  nextTick(() => {
    questionRef.value?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <v-card 
    ref="questionRef"
    class="question-card" 
    elevation="8"
    tabindex="0"
  >
    <!-- Question Header -->
    <v-card-title class="question-header">
      <div class="d-flex align-center">
        <v-icon class="mr-3" color="primary" size="24">
          mdi-help-circle
        </v-icon>
        <span class="text-h6">Question</span>
        <v-spacer />
        
        <!-- Quick Action Buttons -->
        <div class="quick-actions mr-3">
          <v-btn
            size="small"
            icon
            variant="text"
            @click="toggleBookmark"
            class="mr-1"
          >
            <v-icon size="20">mdi-bookmark-outline</v-icon>
            <v-tooltip activator="parent" location="bottom">
              Bookmark (Ctrl+B)
            </v-tooltip>
          </v-btn>
          
          <v-btn
            size="small"
            icon
            variant="text"
            @click="toggleFlag"
            class="mr-1"
          >
            <v-icon size="20">mdi-flag-outline</v-icon>
            <v-tooltip activator="parent" location="bottom">
              Flag (Ctrl+F)
            </v-tooltip>
          </v-btn>
          
          <v-btn
            size="small"
            icon
            variant="text"
            @click="keyboardHelpVisible = true"
          >
            <v-icon size="20">mdi-keyboard</v-icon>
            <v-tooltip activator="parent" location="bottom">
              Keyboard Shortcuts (?)
            </v-tooltip>
          </v-btn>
        </div>
        
        <v-chip
          :color="question.questionType === 'multiple-choice' ? 'primary' : 'secondary'"
          size="small"
        >
          {{ question.questionType.replace('-', ' ').toUpperCase() }}
        </v-chip>
      </div>
    </v-card-title>

    <v-divider />

    <!-- Question Text -->
    <v-card-text class="question-content">
      <div class="question-text mb-6">
        <p class="text-h6 text-grey-darken-2">
          {{ question.questionText }}
        </p>
      </div>

      <!-- Answer Options -->
      <div class="answer-options">
        <h4 class="text-subtitle-1 mb-4 text-grey-darken-1">
          {{ isMultipleChoice ? 'Select one answer:' : 'Select all that apply:' }}
        </h4>

        <div class="options-grid">
          <v-card
            v-for="(option, index) in question.options"
            :key="index"
            class="option-card mb-3"
            :class="{
              'option-selected': isSelected(index),
              'option-hover': !isSelected(index)
            }"
            @click="selectAnswer(index)"
            :variant="isSelected(index) ? 'tonal' : 'outlined'"
            :color="isSelected(index) ? 'primary' : 'default'"
          >
            <v-card-text class="d-flex align-center pa-4">
              <!-- Option Label with Keyboard Shortcut -->
              <div class="option-label-container mr-4">
                <v-avatar
                  :color="isSelected(index) ? 'primary' : 'grey-lighten-1'"
                  size="32"
                >
                  <span class="text-body-1 font-weight-bold">
                    {{ getOptionLabel(index) }}
                  </span>
                </v-avatar>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  color="grey"
                  class="keyboard-hint mt-1"
                >
                  {{ getOptionLabel(index).toLowerCase() }} or {{ index + 1 }}
                </v-chip>
              </div>

              <!-- Option Text -->
              <div class="flex-grow-1">
                <p class="text-body-1 mb-0" :class="{ 'font-weight-bold': isSelected(index) }">
                  {{ option }}
                </p>
              </div>

              <!-- Selection Indicator -->
              <v-icon
                v-if="isSelected(index)"
                color="primary"
                size="24"
              >
                {{ isMultipleChoice ? 'mdi-radiobox-marked' : 'mdi-checkbox-marked' }}
              </v-icon>
              <v-icon
                v-else
                color="grey-lighten-1"
                size="24"
              >
                {{ isMultipleChoice ? 'mdi-radiobox-blank' : 'mdi-checkbox-blank-outline' }}
              </v-icon>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <!-- Action Buttons -->
    <v-card-actions class="pa-6">
      <div class="keyboard-hint-text">
        <v-chip size="x-small" variant="text" color="grey">
          Press <kbd>?</kbd> for keyboard shortcuts
        </v-chip>
      </div>
      
      <v-spacer />
      
      <v-btn
        variant="outlined"
        class="mr-3"
        @click="$router.back()"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Exit Study
      </v-btn>

      <v-btn
        color="primary"
        size="large"
        :disabled="!canSubmit"
        :loading="loading"
        @click="submitAnswer"
      >
        <v-icon start>mdi-check</v-icon>
        Submit Answer
        <v-chip size="x-small" variant="tonal" color="white" class="ml-2">
          Space / Enter
        </v-chip>
      </v-btn>
    </v-card-actions>

    <!-- Keyboard Help Dialog -->
    <v-dialog v-model="keyboardHelpVisible" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-keyboard</v-icon>
          Keyboard Shortcuts
        </v-card-title>
        
        <v-card-text>
          <div class="shortcuts-grid">
            <!-- Answer Selection -->
            <v-card variant="outlined" class="mb-4">
              <v-card-subtitle class="text-primary font-weight-bold">
                Answer Selection
              </v-card-subtitle>
              <v-card-text class="pa-3">
                <div class="shortcut-row">
                  <kbd>A</kbd>, <kbd>B</kbd>, <kbd>C</kbd>, <kbd>D</kbd>
                  <span>Select answer option</span>
                </div>
                <div class="shortcut-row">
                  <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd>
                  <span>Select option by number</span>
                </div>
                <div class="shortcut-row">
                  <kbd>↑</kbd> / <kbd>↓</kbd>
                  <span>Navigate between options</span>
                </div>
              </v-card-text>
            </v-card>
            
            <!-- Actions -->
            <v-card variant="outlined" class="mb-4">
              <v-card-subtitle class="text-primary font-weight-bold">
                Actions
              </v-card-subtitle>
              <v-card-text class="pa-3">
                <div class="shortcut-row">
                  <kbd>Space</kbd> / <kbd>Enter</kbd>
                  <span>Submit answer</span>
                </div>
                <div class="shortcut-row">
                  <kbd>Ctrl</kbd> + <kbd>B</kbd>
                  <span>Bookmark question</span>
                </div>
                <div class="shortcut-row">
                  <kbd>Ctrl</kbd> + <kbd>F</kbd>
                  <span>Flag for review</span>
                </div>
              </v-card-text>
            </v-card>
            
            <!-- Help -->
            <v-card variant="outlined">
              <v-card-subtitle class="text-primary font-weight-bold">
                Help & Navigation
              </v-card-subtitle>
              <v-card-text class="pa-3">
                <div class="shortcut-row">
                  <kbd>?</kbd> / <kbd>H</kbd>
                  <span>Show this help</span>
                </div>
                <div class="shortcut-row">
                  <kbd>Esc</kbd>
                  <span>Close dialogs</span>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="tonal"
            @click="keyboardHelpVisible = false"
          >
            Got it!
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.question-card {
  border-radius: 16px;
  overflow: hidden;
}

.question-card:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.question-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
}

.quick-actions {
  display: flex;
  align-items: center;
}

.question-content {
  background: #fff;
}

.question-text {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid #1976d2;
}

.option-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
}

.option-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-selected {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.option-label-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.keyboard-hint {
  margin-top: 4px;
  font-size: 0.7rem;
  opacity: 0.7;
}

.options-grid {
  max-width: 100%;
}

/* Keyboard shortcuts styling */
kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  line-height: 1;
  color: #333;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  margin: 0 2px;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.shortcut-row:last-child {
  margin-bottom: 0;
}

.shortcut-row span {
  flex: 1;
  margin-left: 12px;
  color: #666;
}

.keyboard-hint-text {
  opacity: 0.7;
}

.shortcuts-grid {
  max-height: 400px;
  overflow-y: auto;
}

/* Animation for keyboard interaction */
.option-card.keyboard-focus {
  animation: keyboard-pulse 0.3s ease;
}

@keyframes keyboard-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .question-text {
    padding: 16px;
  }
  
  .option-card .v-card-text {
    padding: 12px !important;
  }
  
  .option-label-container {
    margin-right: 8px !important;
  }
  
  .keyboard-hint {
    display: none; /* Hide keyboard hints on mobile */
  }
  
  .quick-actions {
    flex-direction: column;
    gap: 4px;
  }
}
</style>