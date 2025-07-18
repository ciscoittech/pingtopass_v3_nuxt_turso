<script setup lang="ts">
// Require admin authentication
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State management
const loading = ref(false)
const generating = ref(false)
const generationResults = ref(null as any)

// Form data
const formData = ref({
  examId: '',
  objectiveId: '',
  count: 5,
  difficulty: 'medium',
  customPrompt: '',
  autoSave: true
})

// Data fetching
const { data: examsData } = await useFetch('/api/exams')
const exams = computed(() => {
  const data = examsData.value?.data || []
  console.log('Exams data:', data)
  return data
})

const { data: objectivesData, refresh: refreshObjectives } = await useFetch('/api/objectives', {
  query: computed(() => ({ examId: formData.value.examId })),
  server: false
})
const objectives = computed(() => objectivesData.value?.data || [])

// Watch exam changes to refresh objectives
watch(() => formData.value.examId, () => {
  formData.value.objectiveId = ''
  refreshObjectives()
})

// Available models with pricing info (using new LangChain integration)
const availableModels = [
  {
    value: 'google/gemini-2.5-flash-preview-05-20',
    title: 'Gemini 2.5 Flash (LangChain Default)',
    description: 'Fast & economical - $0.075/$0.30 per 1M tokens',
    icon: 'mdi-lightning-bolt'
  },
  {
    value: 'google/gemini-2.5-flash-lite-preview-06-17',
    title: 'Gemini 2.5 Flash Lite (Ultra Fast)',
    description: 'Better reasoning - $3/$15 per 1M tokens',
    icon: 'mdi-brain'
  },
  {
    value: 'openai/gpt-4o-mini',
    title: 'GPT-4o Mini (Very Fast)',
    description: 'Quick generation - $0.15/$0.60 per 1M tokens',
    icon: 'mdi-rocket'
  },
  {
    value: 'openai/gpt-4o',
    title: 'GPT-4o (Premium)',
    description: 'Highest quality - $2.50/$10 per 1M tokens',
    icon: 'mdi-star'
  }
]

// Generate questions using new LangChain endpoint
const generateQuestions = async () => {
  try {
    generating.value = true
    generationResults.value = null

    const response = await $fetch('/api/admin/questions/generate-v2', {
      method: 'POST',
      body: {
        examId: formData.value.examId,
        objectiveId: formData.value.objectiveId || null,
        count: formData.value.count,
        difficulty: formData.value.difficulty,
        customPrompt: formData.value.customPrompt || null,
        autoSave: formData.value.autoSave
      }
    })

    if (response.success) {
      generationResults.value = response.data
    }

  } catch (error) {
    console.error('Failed to generate questions:', error)
    // Show error notification
  } finally {
    generating.value = false
  }
}

// Helper functions

const getValidationColor = (isValid: boolean) => {
  return isValid ? 'success' : 'error'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'saved': return 'success'
    case 'validation_failed': return 'warning'
    case 'failed_to_save': return 'error'
    default: return 'info'
  }
}

const estimateCost = () => {
  const model = availableModels.find(m => m.value === formData.value.model)
  const questionsCount = formData.value.count
  
  // Rough estimation: ~500 tokens input, ~800 tokens output per question
  const estimatedInputTokens = questionsCount * 500
  const estimatedOutputTokens = questionsCount * 800
  
  // Using Haiku pricing as baseline
  const estimatedCost = ((estimatedInputTokens / 1_000_000) * 1.00) + ((estimatedOutputTokens / 1_000_000) * 5.00)
  
  return Math.max(0.01, estimatedCost) // Minimum 1 cent
}
</script>

<template>
  <div class="ai-generation-page">
    <v-container>
      <!-- Header -->
      <div class="page-header mb-6">
        <h1 class="text-h4 font-weight-bold mb-2">
          <v-icon class="mr-2" color="primary">mdi-robot</v-icon>
          AI Question Generation (LangChain)
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          Generate high-quality exam questions using LangChain with LangSmith observability
        </p>
      </div>

      <v-row>
        <!-- Generation Form -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-settings</v-icon>
              Generation Settings
            </v-card-title>
            
            <v-card-text>
              <v-form @submit.prevent="generateQuestions">
                <!-- Exam Selection -->
                <v-select
                  v-model="formData.examId"
                  label="Target Exam"
                  :items="exams.map(exam => ({ 
                    title: `${exam.code} - ${exam.name}`, 
                    value: exam.id 
                  }))"
                  variant="outlined"
                  required
                  class="mb-4"
                >
                  <template #prepend-inner>
                    <v-icon>mdi-school</v-icon>
                  </template>
                </v-select>

                <!-- Objective Selection (Optional) -->
                <v-select
                  v-model="formData.objectiveId"
                  label="Focus Objective (Optional)"
                  :items="[
                    { title: 'All Objectives', value: '' },
                    ...objectives.map(obj => ({ 
                      title: obj.title, 
                      value: obj.id 
                    }))
                  ]"
                  variant="outlined"
                  class="mb-4"
                  :disabled="!formData.examId"
                >
                  <template #prepend-inner>
                    <v-icon>mdi-target</v-icon>
                  </template>
                </v-select>

                <!-- Question Count -->
                <v-text-field
                  v-model.number="formData.count"
                  label="Number of Questions"
                  type="number"
                  min="1"
                  max="20"
                  variant="outlined"
                  class="mb-4"
                >
                  <template #prepend-inner>
                    <v-icon>mdi-numeric</v-icon>
                  </template>
                </v-text-field>

                <!-- Difficulty Level -->
                <v-select
                  v-model="formData.difficulty"
                  label="Difficulty Level"
                  :items="[
                    { title: 'Easy', value: 'easy' },
                    { title: 'Medium', value: 'medium' },
                    { title: 'Hard', value: 'hard' }
                  ]"
                  variant="outlined"
                  class="mb-4"
                >
                  <template #prepend-inner>
                    <v-icon>mdi-chart-line</v-icon>
                  </template>
                </v-select>

                <!-- Model Info -->
                <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                  <v-icon size="small">mdi-information</v-icon>
                  Using Gemini 2.5 Flash via LangChain (fastest & most economical)
                </v-alert>


                <!-- Custom Prompt (Advanced) -->
                <v-textarea
                  v-model="formData.customPrompt"
                  label="Custom Prompt (Optional)"
                  placeholder="Add specific instructions for question generation..."
                  variant="outlined"
                  rows="3"
                  class="mb-4"
                />

                <!-- Auto-save Toggle -->
                <v-switch
                  v-model="formData.autoSave"
                  label="Auto-save questions to database"
                  color="primary"
                  class="mb-4"
                >
                  <template #details>
                    <span class="text-caption">Generated questions will be automatically saved to the database</span>
                  </template>
                </v-switch>

                <!-- Cost Estimation -->
                <v-card color="info" variant="tonal" class="mb-4">
                  <v-card-text class="pa-3">
                    <div class="d-flex align-center">
                      <v-icon class="mr-2">mdi-calculator</v-icon>
                      <div>
                        <div class="text-subtitle-2">Estimated Cost</div>
                        <div class="text-h6">${{ estimateCost().toFixed(3) }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Generate Button -->
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="generating"
                  :disabled="!formData.examId"
                >
                  <v-icon start>mdi-magic</v-icon>
                  Generate {{ formData.count }} Questions
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Results Panel -->
        <v-col cols="12" md="6">
          <v-card elevation="2" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-clipboard-list</v-icon>
              Generation Results
            </v-card-title>
            
            <v-card-text>
              <!-- Loading State -->
              <div v-if="generating" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="64" />
                <p class="text-h6 mt-4">Generating questions...</p>
                <p class="text-body-2">This may take 30-60 seconds</p>
              </div>

              <!-- No Results Yet -->
              <div v-else-if="!generationResults" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-robot-outline</v-icon>
                <p class="text-h6 mt-4">Ready to Generate</p>
                <p class="text-body-2">Configure your settings and click generate to start</p>
              </div>

              <!-- Generation Results -->
              <div v-else>
                <!-- Summary Stats -->
                <v-card color="success" variant="tonal" class="mb-4">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-h6">{{ generationResults.generated }} Questions Generated</div>
                        <div class="text-body-2" v-if="formData.autoSave">
                          <v-icon size="small" color="success" class="mr-1">mdi-check</v-icon>
                          {{ generationResults.saved }} Saved to Database
                        </div>
                        <div class="text-body-2" v-else>
                          <v-icon size="small" color="warning" class="mr-1">mdi-alert</v-icon>
                          Not saved (auto-save disabled)
                        </div>
                      </div>
                      <v-icon size="32">mdi-check-circle</v-icon>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- LangChain Metadata -->
                <v-card v-if="generationResults.metadata" variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1">
                    <v-icon size="small" class="mr-2">mdi-information</v-icon>
                    Generation Details
                  </v-card-title>
                  <v-card-text>
                    <v-row dense>
                      <v-col cols="6" sm="3">
                        <div class="text-caption text-medium-emphasis">Model</div>
                        <div class="text-body-2">Gemini 2.5 Flash</div>
                      </v-col>
                      <v-col cols="6" sm="3">
                        <div class="text-caption text-medium-emphasis">Tokens Used</div>
                        <div class="text-body-2">{{ generationResults.metadata?.totalTokens?.toLocaleString() || 'N/A' }}</div>
                      </v-col>
                      <v-col cols="6" sm="3">
                        <div class="text-caption text-medium-emphasis">Cost</div>
                        <div class="text-body-2">${{ generationResults.metadata?.cost?.toFixed(4) || '0.00' }}</div>
                      </v-col>
                      <v-col cols="6" sm="3">
                        <div class="text-caption text-medium-emphasis">Workflow Steps</div>
                        <div class="text-body-2">{{ generationResults.metadata?.workflowSteps?.join(' → ') || '3 steps' }}</div>
                      </v-col>
                    </v-row>
                    <div v-if="$config.public.langsmithEnabled" class="mt-3">
                      <v-btn
                        variant="tonal"
                        size="small"
                        color="primary"
                        href="https://smith.langchain.com"
                        target="_blank"
                      >
                        <v-icon start size="small">mdi-open-in-new</v-icon>
                        View in LangSmith
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Validation Summary -->
                <div v-if="generationResults.validationResults?.length > 0" class="mb-4">
                  <h3 class="text-h6 mb-2">Validation Results</h3>
                  <div class="d-flex gap-2 mb-3">
                    <v-chip
                      color="success"
                      size="small"
                      variant="tonal"
                    >
                      {{ generationResults.validationResults.filter(v => v.isValid).length }} Valid
                    </v-chip>
                    <v-chip
                      color="error"
                      size="small"
                      variant="tonal"
                    >
                      {{ generationResults.validationResults.filter(v => !v.isValid).length }} Issues
                    </v-chip>
                  </div>
                </div>

                <!-- Generated Questions -->
                <div class="questions-list">
                  <h3 class="text-h6 mb-3">Generated Questions</h3>
                  <div class="questions-container" style="max-height: 600px; overflow-y: auto;">
                    <v-expansion-panels variant="accordion">
                      <v-expansion-panel
                        v-for="(question, index) in generationResults.questions"
                        :key="index"
                        class="mb-2"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center justify-space-between w-100 mr-4">
                            <span class="text-subtitle-1">Question {{ index + 1 }}</span>
                            <v-chip
                              :color="getStatusColor(question.status)"
                              size="small"
                              variant="tonal"
                            >
                              {{ question.status }}
                            </v-chip>
                          </div>
                        </v-expansion-panel-title>
                        
                        <v-expansion-panel-text>
                          <div class="question-content">
                            <!-- Question Text -->
                            <div class="mb-3">
                              <strong>Question:</strong>
                              <p class="mt-1">{{ question.question }}</p>
                            </div>

                            <!-- Options -->
                            <div class="mb-3">
                              <strong>Options:</strong>
                              <ul class="mt-1">
                                <li 
                                  v-for="(option, optIndex) in question.options" 
                                  :key="optIndex"
                                  :class="{ 'font-weight-bold text-success': 
                                    String.fromCharCode(65 + optIndex) === question.correctAnswer }"
                                >
                                  {{ option }}
                                </li>
                              </ul>
                            </div>

                            <!-- Explanation -->
                            <div class="mb-3">
                              <strong>Explanation:</strong>
                              <p class="mt-1">{{ question.explanation }}</p>
                            </div>

                            <!-- Validation Issues -->
                            <div v-if="question.validation && !question.validation.isValid" class="mb-3">
                              <strong class="text-error">Validation Issues:</strong>
                              <ul class="mt-1">
                                <li v-for="issue in question.validation.issues" :key="issue" class="text-error">
                                  {{ issue }}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.ai-generation-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24px 0;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.questions-container {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 12px;
}

.question-content {
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .ai-generation-page {
    padding: 16px 0;
  }
  
  .page-header {
    padding: 16px;
  }
}
</style>