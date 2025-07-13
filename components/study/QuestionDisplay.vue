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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectAnswer = (index: number) => {
  emit('answer-selected', index)
}

const submitAnswer = () => {
  emit('submit')
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
</script>

<template>
  <v-card class="question-card" elevation="8">
    <!-- Question Header -->
    <v-card-title class="question-header">
      <div class="d-flex align-center">
        <v-icon class="mr-3" color="primary" size="24">
          mdi-help-circle
        </v-icon>
        <span class="text-h6">Question</span>
        <v-spacer />
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
              <!-- Option Label -->
              <v-avatar
                :color="isSelected(index) ? 'primary' : 'grey-lighten-1'"
                size="32"
                class="mr-4"
              >
                <span class="text-body-1 font-weight-bold">
                  {{ getOptionLabel(index) }}
                </span>
              </v-avatar>

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
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.question-card {
  border-radius: 16px;
  overflow: hidden;
}

.question-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
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

.options-grid {
  max-width: 100%;
}

@media (max-width: 768px) {
  .question-text {
    padding: 16px;
  }
  
  .option-card .v-card-text {
    padding: 12px !important;
  }
}
</style>