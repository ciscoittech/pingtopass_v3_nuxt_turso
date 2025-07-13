<script setup lang="ts">
interface Props {
  question: {
    questionText: string
    questionType: string
    options: string[]
    correctAnswer: number[]
    explanation: string
  }
}

const props = defineProps<Props>()

const getOptionLabel = (index: number) => {
  return String.fromCharCode(65 + index) // A, B, C, D, etc.
}

const isCorrectAnswer = (index: number) => {
  return props.question.correctAnswer.includes(index)
}
</script>

<template>
  <v-card class="question-preview" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-eye</v-icon>
      Question Preview
    </v-card-title>
    
    <v-card-text>
      <!-- Question Text -->
      <div class="mb-4">
        <h3 class="text-h6 mb-3">{{ question.questionText || 'Question text will appear here...' }}</h3>
        
        <!-- Question Type Badge -->
        <v-chip
          :color="question.questionType === 'multiple-choice' ? 'primary' : 'secondary'"
          size="small"
          class="mb-3"
        >
          {{ question.questionType.replace('-', ' ').toUpperCase() }}
        </v-chip>
      </div>

      <!-- Answer Options -->
      <div v-if="question.options.length > 0" class="mb-4">
        <h4 class="text-subtitle-1 mb-2">Answer Options:</h4>
        
        <v-list density="compact">
          <v-list-item
            v-for="(option, index) in question.options"
            :key="index"
            class="pa-2 ma-1 rounded"
            :class="{
              'bg-success-lighten-4': isCorrectAnswer(index),
              'bg-grey-lighten-4': !isCorrectAnswer(index)
            }"
          >
            <template v-slot:prepend>
              <v-avatar
                size="24"
                :color="isCorrectAnswer(index) ? 'success' : 'grey-lighten-1'"
                class="mr-3"
              >
                <span class="text-caption font-weight-bold">
                  {{ getOptionLabel(index) }}
                </span>
              </v-avatar>
            </template>
            
            <v-list-item-title>
              {{ option || `Option ${getOptionLabel(index)}` }}
              <v-icon
                v-if="isCorrectAnswer(index)"
                color="success"
                size="small"
                class="ml-2"
              >
                mdi-check-circle
              </v-icon>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- No Options Message -->
      <div v-else class="mb-4">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
        >
          Add answer options to see preview
        </v-alert>
      </div>

      <!-- Explanation -->
      <div v-if="question.explanation" class="mb-2">
        <h4 class="text-subtitle-1 mb-2">Explanation:</h4>
        <v-card variant="outlined" class="pa-3">
          <p class="text-body-2 mb-0">{{ question.explanation }}</p>
        </v-card>
      </div>

      <!-- Correct Answer Summary -->
      <div v-if="question.correctAnswer.length > 0" class="mt-4">
        <v-chip
          color="success"
          variant="outlined"
          size="small"
        >
          <v-icon start>mdi-check</v-icon>
          Correct Answer{{ question.correctAnswer.length > 1 ? 's' : '' }}: 
          {{ question.correctAnswer.map(i => getOptionLabel(i)).join(', ') }}
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.question-preview {
  border: 2px solid #e0e0e0;
}
</style>