<script setup lang="ts">
interface Props {
  question: {
    id: string
    questionText: string
    questionType: string
    options: string[]
  }
  selectedAnswers: number[]
  loading: boolean
}

interface Emits {
  (e: 'answer-selected', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectAnswer = (index: number) => {
  emit('answer-selected', index)
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
  <div class="test-question">
    <!-- Question Text -->
    <div class="question-text mb-6">
      <v-card variant="outlined" class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-icon color="primary" class="mr-2">mdi-help-circle</v-icon>
          <v-chip
            :color="isMultipleChoice ? 'primary' : 'secondary'"
            size="small"
            variant="tonal"
          >
            {{ isMultipleChoice ? 'Single Answer' : 'Multiple Answers' }}
          </v-chip>
        </div>
        
        <div class="question-content">
          <p class="text-h6 text-grey-darken-2 mb-0">
            {{ question.questionText }}
          </p>
        </div>
      </v-card>
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
          :disabled="loading"
        >
          <v-card-text class="d-flex align-center pa-4">
            <!-- Option Label -->
            <v-avatar
              :color="isSelected(index) ? 'primary' : 'grey-lighten-1'"
              size="32"
              class="mr-4"
            >
              <span class="text-body-1 font-weight-bold text-white">
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

    <!-- Instructions -->
    <div class="instructions mt-6">
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        class="text-caption"
      >
        <v-icon start>mdi-information</v-icon>
        <div>
          <strong>Test Mode:</strong> 
          {{ isMultipleChoice ? 'Choose the best answer.' : 'Select all correct answers.' }}
          Use the Previous/Next buttons or the grid to navigate between questions.
        </div>
      </v-alert>
    </div>
  </div>
</template>

<style scoped>
.test-question {
  max-width: 100%;
}

.question-text .v-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left: 4px solid #1976d2;
}

.question-content {
  line-height: 1.6;
}

.option-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
}

.option-card:not(.option-selected):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-selected {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.option-card[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.instructions {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

@media (max-width: 768px) {
  .question-text .v-card {
    padding: 16px !important;
  }
  
  .option-card .v-card-text {
    padding: 12px !important;
  }
  
  .option-card .v-avatar {
    size: 28px;
    margin-right: 12px !important;
  }
}
</style>