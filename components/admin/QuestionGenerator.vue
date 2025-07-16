<script setup lang="ts">
import { Icon } from '@iconify/vue'
import QuestionTypeChip from '@/components/admin/QuestionTypeChip.vue'
import type { QuestionType } from '@/types/question'

interface Props {
  open: boolean
  examId?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'generated', count: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const step = ref(1)
const generatedQuestions = ref<any[]>([])
const selectedQuestions = ref<string[]>([])

// Form data
const formData = ref({
  examId: props.examId || '',
  objectiveId: '',
  count: 5,
  difficulty: 'medium',
  model: 'anthropic/claude-3.5-haiku',
  customPrompt: '',
  autoValidate: false
})

// Fetch exams
const { data: examsData } = await useFetch('/api/exams')
const exams = computed(() => examsData.value?.data || [])

// Watch for examId prop changes
watch(() => props.examId, (newExamId) => {
  if (newExamId) {
    formData.value.examId = newExamId
  }
})

// Difficulty options
const difficulties = [
  { title: 'Easy', value: 'easy' },
  { title: 'Medium', value: 'medium' },
  { title: 'Hard', value: 'hard' },
  { title: 'Mixed', value: 'mixed' }
]

// Model options
const models = [
  { title: 'Claude 3.5 Haiku (Fast)', value: 'anthropic/claude-3.5-haiku' },
  { title: 'Claude 3.5 Sonnet (Balanced)', value: 'anthropic/claude-3.5-sonnet' },
  { title: 'GPT-4o (Advanced)', value: 'openai/gpt-4o' },
  { title: 'GPT-4o Mini (Fast)', value: 'openai/gpt-4o-mini' }
]

// Helper function to parse correct answer
const parseCorrectAnswer = (answer: string | string[] | number[]): number[] => {
  if (Array.isArray(answer)) {
    return answer.map(a => typeof a === 'number' ? a : letterToIndex(a))
  }
  if (typeof answer === 'string') {
    // Handle single letter answers like 'A', 'B', etc.
    return [letterToIndex(answer)]
  }
  return [0] // Default to first option
}

const letterToIndex = (letter: string): number => {
  const index = letter.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.
  return index >= 0 && index < 26 ? index : 0
}

// Methods
const generateQuestions = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/generate-questions', {
      method: 'POST',
      body: {
        examId: formData.value.examId,
        objectiveId: formData.value.objectiveId || null,
        count: formData.value.count,
        difficulty: formData.value.difficulty,
        model: formData.value.model,
        customPrompt: formData.value.customPrompt,
        autoValidate: formData.value.autoValidate
      }
    })

    if (response.success && response.data?.questions) {
      // Transform the API response to match our component format
      generatedQuestions.value = response.data.questions.map((q: any, index: number) => ({
        id: `generated_${index}`,
        questionText: q.question || q.questionText,
        questionType: (q.questionType || 'multiple-choice') as QuestionType,
        options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
        correctAnswer: parseCorrectAnswer(q.correctAnswer),
        explanation: q.explanation,
        difficulty: q.difficulty || formData.value.difficulty,
        objectiveId: q.objectiveId
      }))
      selectedQuestions.value = generatedQuestions.value.map((q: any) => q.id)
      step.value = 2
    } else {
      throw new Error('Failed to generate questions')
    }
  } catch (error) {
    console.error('Error generating questions:', error)
    // TODO: Show error notification
  }
  loading.value = false
}

const saveSelectedQuestions = async () => {
  loading.value = true
  try {
    const questionsToSave = generatedQuestions.value.filter(q => 
      selectedQuestions.value.includes(q.id)
    )
    
    // Save each selected question
    for (const question of questionsToSave) {
      await $fetch('/api/questions', {
        method: 'POST',
        body: {
          examId: formData.value.examId,
          objectiveId: question.objectiveId || null,
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          isActive: true
        }
      })
    }
    
    emit('generated', questionsToSave.length)
    resetDialog()
  } catch (error) {
    console.error('Error saving questions:', error)
  }
  loading.value = false
}

const resetDialog = () => {
  step.value = 1
  generatedQuestions.value = []
  selectedQuestions.value = []
  formData.value = {
    examId: props.examId || '',
    objectiveId: '',
    count: 5,
    difficulty: 'medium',
    model: 'anthropic/claude-3.5-haiku',
    customPrompt: '',
    autoValidate: false
  }
  emit('close')
}

const toggleQuestionSelection = (questionId: string) => {
  const index = selectedQuestions.value.indexOf(questionId)
  if (index > -1) {
    selectedQuestions.value.splice(index, 1)
  } else {
    selectedQuestions.value.push(questionId)
  }
}

const selectAll = () => {
  selectedQuestions.value = generatedQuestions.value.map(q => q.id)
}

const deselectAll = () => {
  selectedQuestions.value = []
}

// Computed
const dialogTitle = computed(() => {
  return step.value === 1 ? 'Generate Questions with AI' : 'Review Generated Questions'
})

const selectedExamName = computed(() => {
  const exam = exams.value.find(e => e.id === formData.value.examId)
  return exam ? `${exam.examCode} - ${exam.examName}` : ''
})
</script>

<template>
  <v-dialog
    :model-value="open"
    @update:model-value="$event ? null : resetDialog()"
    max-width="1200"
    scrollable
  >
    <v-card elevation="10">
      <v-card-title class="d-flex align-center">
        <Icon icon="solar:magic-stick-3-bold-duotone" class="mr-2" />
        {{ dialogTitle }}
        <v-spacer />
        <v-btn icon variant="text" @click="resetDialog">
          <Icon icon="solar:close-circle-line-duotone" />
        </v-btn>
      </v-card-title>

      <!-- Step 1: Configuration -->
      <v-card-text v-if="step === 1">
        <v-row>
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-4">Generation Settings</h4>
            
            <v-select
              v-model="formData.examId"
              :items="exams"
              item-title="examName"
              item-value="id"
              label="Select Exam *"
              variant="outlined"
              required
              class="mb-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title>{{ item.raw.examCode }} - {{ item.raw.examName }}</v-list-item-title>
                </v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                {{ item.raw.examCode }} - {{ item.raw.examName }}
              </template>
            </v-select>

            <v-text-field
              v-model.number="formData.count"
              label="Number of Questions"
              type="number"
              min="1"
              max="20"
              variant="outlined"
              class="mb-4"
            />

            <v-select
              v-model="formData.difficulty"
              :items="difficulties"
              label="Difficulty Level"
              variant="outlined"
              class="mb-4"
            />

            <v-select
              v-model="formData.model"
              :items="models"
              label="AI Model"
              variant="outlined"
              class="mb-4"
            />

          </v-col>

          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-4">Custom Instructions (Optional)</h4>
            
            <v-textarea
              v-model="formData.customPrompt"
              label="Additional instructions for the AI"
              placeholder="E.g., Focus on practical scenarios, include code examples, avoid trick questions..."
              variant="outlined"
              rows="10"
              persistent-placeholder
            />
          </v-col>
        </v-row>

        <v-alert type="info" variant="tonal" class="mt-4">
          <template #prepend>
            <Icon icon="solar:info-circle-line-duotone" />
          </template>
          The AI will generate questions based on the exam's official objectives and your specifications. 
          Generated questions will follow the exam's style and difficulty level.
        </v-alert>
      </v-card-text>

      <!-- Step 2: Review Generated Questions -->
      <v-card-text v-else>
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h4 class="text-h6">Generated Questions for {{ selectedExamName }}</h4>
            <p class="text-body-2 text-grey-darken-1">
              Select the questions you want to add to the database
            </p>
          </div>
          <div>
            <v-btn variant="text" size="small" @click="selectAll">Select All</v-btn>
            <v-btn variant="text" size="small" @click="deselectAll">Deselect All</v-btn>
          </div>
        </div>

        <v-list>
          <v-list-item
            v-for="(question, index) in generatedQuestions"
            :key="question.id"
            class="mb-4 pa-4 border rounded"
          >
            <template v-slot:prepend>
              <v-checkbox
                :model-value="selectedQuestions.includes(question.id)"
                @update:model-value="toggleQuestionSelection(question.id)"
                hide-details
              />
            </template>

            <div class="flex-grow-1">
              <div class="d-flex align-center mb-2">
                <span class="text-h6 mr-2">Question {{ index + 1 }}</span>
                <QuestionTypeChip :question-type="question.questionType" size="small" />
                <v-chip size="small" class="ml-2" variant="tonal">
                  {{ question.difficulty || formData.difficulty }}
                </v-chip>
              </div>

              <p class="text-body-1 mb-3">{{ question.questionText }}</p>

              <v-row dense>
                <v-col 
                  v-for="(option, optIndex) in question.options" 
                  :key="optIndex"
                  cols="12"
                  md="6"
                >
                  <div class="d-flex align-center">
                    <Icon 
                      :icon="question.correctAnswer.includes(optIndex) ? 'solar:check-circle-bold' : 'solar:circle-line-duotone'"
                      :class="question.correctAnswer.includes(optIndex) ? 'text-success' : 'text-grey'"
                      class="mr-2"
                      size="20"
                    />
                    <span :class="{ 'font-weight-bold': question.correctAnswer.includes(optIndex) }">
                      {{ option }}
                    </span>
                  </div>
                </v-col>
              </v-row>

              <div v-if="question.explanation" class="mt-3">
                <p class="text-caption text-grey-darken-1">Explanation:</p>
                <p class="text-body-2">{{ question.explanation }}</p>
              </div>
            </div>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        
        <v-btn
          v-if="step === 2"
          variant="text"
          @click="step = 1"
        >
          Back
        </v-btn>
        
        <v-btn
          variant="text"
          @click="resetDialog"
        >
          Cancel
        </v-btn>
        
        <v-btn
          v-if="step === 1"
          color="primary"
          @click="generateQuestions"
          :loading="loading"
          :disabled="!formData.examId"
        >
          Generate Questions
        </v-btn>
        
        <v-btn
          v-else
          color="primary"
          @click="saveSelectedQuestions"
          :loading="loading"
          :disabled="selectedQuestions.length === 0"
        >
          Save {{ selectedQuestions.length }} Question{{ selectedQuestions.length !== 1 ? 's' : '' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>