<template>
  <v-card elevation="10">
    <v-card-title class="text-h6">
      <Icon icon="solar:eye-line-duotone" class="mr-2" />
      Preview
    </v-card-title>
    
    <v-card-text>
      <div class="question-preview">
        <!-- Question Type Badge -->
        <QuestionTypeChip
          :question-type="question.questionType"
          size="small"
          class="mb-4"
          show-icon
        />
        
        <!-- Question Text -->
        <div class="text-body-1 mb-4">
          <strong>Question:</strong>
          <div class="mt-2" v-html="formattedQuestionText"></div>
        </div>
        
        <!-- Answer Options -->
        <div v-if="hasOptions" class="mb-4">
          <strong class="text-body-2">Options:</strong>
          
          <!-- Multiple Choice / Multiple Select -->
          <v-radio-group
            v-if="question.questionType === 'multiple-choice'"
            :model-value="question.correctAnswer[0]"
            readonly
            class="mt-2"
          >
            <v-radio
              v-for="(option, index) in question.options"
              :key="index"
              :label="option || `Option ${index + 1}`"
              :value="index"
              :color="question.correctAnswer.includes(index) ? 'success' : 'default'"
            >
              <template #label>
                <span :class="{ 'text-success font-weight-medium': question.correctAnswer.includes(index) }">
                  {{ option || `Option ${index + 1}` }}
                  <Icon 
                    v-if="question.correctAnswer.includes(index)" 
                    icon="solar:check-circle-bold" 
                    class="ml-1" 
                    size="16" 
                  />
                </span>
              </template>
            </v-radio>
          </v-radio-group>
          
          <!-- Multiple Select -->
          <div v-else-if="question.questionType === 'multiple-select'" class="mt-2">
            <v-checkbox
              v-for="(option, index) in question.options"
              :key="index"
              :label="option || `Option ${index + 1}`"
              :model-value="question.correctAnswer.includes(index)"
              readonly
              :color="question.correctAnswer.includes(index) ? 'success' : 'default'"
              class="mb-2"
            >
              <template #label>
                <span :class="{ 'text-success font-weight-medium': question.correctAnswer.includes(index) }">
                  {{ option || `Option ${index + 1}` }}
                  <Icon 
                    v-if="question.correctAnswer.includes(index)" 
                    icon="solar:check-circle-bold" 
                    class="ml-1" 
                    size="16" 
                  />
                </span>
              </template>
            </v-checkbox>
          </div>
          
          <!-- True/False -->
          <v-radio-group
            v-else-if="question.questionType === 'true-false'"
            :model-value="question.correctAnswer[0]"
            readonly
            class="mt-2"
          >
            <v-radio
              label="True"
              :value="0"
              :color="question.correctAnswer.includes(0) ? 'success' : 'default'"
            >
              <template #label>
                <span :class="{ 'text-success font-weight-medium': question.correctAnswer.includes(0) }">
                  True
                  <Icon 
                    v-if="question.correctAnswer.includes(0)" 
                    icon="solar:check-circle-bold" 
                    class="ml-1" 
                    size="16" 
                  />
                </span>
              </template>
            </v-radio>
            <v-radio
              label="False"
              :value="1"
              :color="question.correctAnswer.includes(1) ? 'success' : 'default'"
            >
              <template #label>
                <span :class="{ 'text-success font-weight-medium': question.correctAnswer.includes(1) }">
                  False
                  <Icon 
                    v-if="question.correctAnswer.includes(1)" 
                    icon="solar:check-circle-bold" 
                    class="ml-1" 
                    size="16" 
                  />
                </span>
              </template>
            </v-radio>
          </v-radio-group>
        </div>
        
        <!-- Explanation -->
        <div v-if="question.explanation" class="mt-4">
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
          >
            <template #prepend>
              <Icon icon="solar:info-circle-line-duotone" />
            </template>
            <strong>Explanation:</strong>
            <div class="mt-1">{{ question.explanation }}</div>
          </v-alert>
        </div>
        
        <!-- No Content Message -->
        <div v-if="!question.questionText" class="text-center py-8 text-medium-emphasis">
          <Icon icon="solar:document-text-broken" size="48" class="mb-2" />
          <div>Enter question details to see preview</div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import QuestionTypeChip from '@/components/admin/QuestionTypeChip.vue'
import type { QuestionFormData } from '@/types/question'

interface Props {
  question: QuestionFormData
}

const props = defineProps<Props>()

const hasOptions = computed(() => {
  return ['multiple-choice', 'multiple-select', 'true-false'].includes(props.question.questionType)
})

const formattedQuestionText = computed(() => {
  if (!props.question.questionText) return ''
  // Simple formatting - convert line breaks to <br>
  return props.question.questionText.replace(/\n/g, '<br>')
})
</script>

<style scoped>
.question-preview {
  min-height: 200px;
}
</style>