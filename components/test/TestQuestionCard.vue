<template>
  <v-card elevation="0" rounded="lg" class="question-card">
    <!-- Header -->
    <v-card-text class="pa-6 pb-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-avatar color="primary" variant="tonal" size="44" class="mr-3">
            <span class="font-weight-bold">{{ questionNumber }}</span>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold">Question {{ questionNumber }} of {{ totalQuestions }}</h3>
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
            @click="$emit('flag')"
          >
            <v-icon :color="isFlagged ? 'error' : 'default'">
              {{ isFlagged ? 'mdi-flag' : 'mdi-flag-outline' }}
            </v-icon>
            <v-tooltip activator="parent" location="bottom">
              {{ isFlagged ? 'Remove flag' : 'Flag for review' }}
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
        <TestAnswerOption
          v-for="(option, index) in question.options"
          :key="`option-${index}`"
          :option="option"
          :index="index"
          :selected="isSelected(index)"
          :isMultipleChoice="question.questionType === 'multiple-choice'"
          @select="selectAnswer(index)"
        />
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-divider />
    <v-card-actions class="pa-6 pt-4">
      <v-btn
        variant="text"
        @click="$emit('previous')"
        :disabled="isFirstQuestion"
      >
        <v-icon start>mdi-chevron-left</v-icon>
        Previous
      </v-btn>
      
      <v-spacer />
      
      <div class="text-caption text-medium-emphasis mr-3">
        <span v-if="isAnswered" class="text-success">
          <v-icon size="small" class="mr-1">mdi-check-circle</v-icon>
          Answered
        </span>
        <span v-else>
          <v-icon size="small" class="mr-1">mdi-circle-outline</v-icon>
          Not answered
        </span>
      </div>
      
      <v-btn
        v-if="!isLastQuestion"
        color="primary"
        variant="flat"
        size="large"
        @click="$emit('next')"
        :disabled="loading"
      >
        Save & Next
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
      
      <v-btn
        v-else
        color="success"
        variant="flat"
        size="large"
        @click="$emit('finish')"
        :disabled="loading"
      >
        <v-icon start>mdi-check-circle</v-icon>
        Finish Test
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Question {
  id: string
  questionText: string
  questionType: 'multiple-choice' | 'multiple-answer'
  options: string[]
  codeBlock?: string
}

interface Props {
  question: Question
  selectedAnswers: number[]
  questionNumber: number
  totalQuestions: number
  isAnswered?: boolean
  isFlagged?: boolean
  loading?: boolean
  isFirstQuestion?: boolean
  isLastQuestion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAnswered: false,
  isFlagged: false,
  loading: false,
  isFirstQuestion: false,
  isLastQuestion: false
})

const emit = defineEmits<{
  'answer-selected': [index: number]
  'previous': []
  'next': []
  'finish': []
  'flag': []
}>()

// Computed
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
  emit('answer-selected', index)
}
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
</style>