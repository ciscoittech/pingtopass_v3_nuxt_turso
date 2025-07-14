<template>
  <NuxtLayout>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">AI Question Generation</h1>
          <p class="text-subtitle-1 text-grey mb-6">
            Generate high-quality exam questions using AI with concurrent processing
          </p>
        </v-col>
      </v-row>

      <!-- Generation Form -->
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-brain</v-icon>
              New Generation Job
            </v-card-title>
            
            <v-card-text>
              <v-form ref="form" v-model="valid">
                <!-- Exam Selection -->
                <v-select
                  v-model="selectedExam"
                  :items="exams"
                  item-title="name"
                  item-value="id"
                  label="Select Exam"
                  :rules="[v => !!v || 'Exam is required']"
                  @update:model-value="loadObjectives"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-list-item-subtitle>
                        {{ item.raw.code }} - {{ item.raw.vendor.name }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Objectives Selection -->
                <v-select
                  v-model="selectedObjectives"
                  :items="objectives"
                  item-title="title"
                  item-value="id"
                  label="Select Objectives (optional)"
                  multiple
                  chips
                  closable-chips
                  :disabled="!selectedExam"
                  hint="Leave empty to generate for all objectives"
                  persistent-hint
                />

                <!-- Question Count -->
                <v-text-field
                  v-model.number="questionCount"
                  label="Number of Questions"
                  type="number"
                  :rules="[
                    v => !!v || 'Count is required',
                    v => v > 0 || 'Must be greater than 0',
                    v => v <= 100 || 'Maximum 100 questions per job'
                  ]"
                  hint="Questions will be distributed across selected objectives"
                  persistent-hint
                  class="mt-4"
                />

                <!-- Difficulty -->
                <v-select
                  v-model="difficulty"
                  :items="difficultyOptions"
                  label="Difficulty Level"
                  class="mt-4"
                />

                <!-- Model Selection -->
                <v-select
                  v-model="selectedModel"
                  :items="availableModels"
                  item-title="displayName"
                  item-value="id"
                  label="AI Model"
                  class="mt-4"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-list-item-subtitle>
                        ${{ item.raw.costPerMillion.toFixed(2) }}/1M tokens
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Cost Estimate -->
                <v-alert type="info" density="compact" class="mt-4">
                  <strong>Estimated Cost:</strong> 
                  ${{ estimatedCost.toFixed(2) }} - ${{ (estimatedCost * 1.5).toFixed(2) }}
                  <br>
                  <small>Based on {{ questionCount }} questions at ~500 tokens each</small>
                </v-alert>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                :loading="isGenerating"
                :disabled="!valid || isGenerating"
                @click="startGeneration"
              >
                <v-icon start>mdi-creation</v-icon>
                Start Generation
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Active Jobs -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-progress-clock</v-icon>
              Active Jobs
            </v-card-title>
            
            <v-list v-if="activeJobs.length > 0">
              <v-list-item
                v-for="job in activeJobs"
                :key="job.jobId"
                @click="selectedJob = job"
              >
                <template v-slot:prepend>
                  <v-progress-circular
                    :model-value="job.completionPercentage"
                    :color="getJobColor(job.status)"
                    size="40"
                    width="4"
                  >
                    <small>{{ job.completionPercentage }}%</small>
                  </v-progress-circular>
                </template>

                <v-list-item-title>
                  {{ job.examName || 'Job ' + job.jobId }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ job.questionsGenerated }}/{{ job.totalQuestionsRequested }} questions
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-chip :color="getJobColor(job.status)" size="small">
                    {{ job.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <v-card-text v-else class="text-center text-grey">
              No active jobs
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Job Details Dialog -->
      <v-dialog v-model="showJobDetails" max-width="800" scrollable>
        <v-card v-if="selectedJob">
          <v-card-title class="d-flex align-center">
            <span>Job Details: {{ selectedJob.jobId }}</span>
            <v-spacer />
            <v-btn icon @click="showJobDetails = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Progress Overview -->
            <v-row>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3">{{ selectedJob.questionsGenerated }}</div>
                  <div class="text-caption">Generated</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3">{{ selectedJob.questionsValidated }}</div>
                  <div class="text-caption">Validated</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3">{{ selectedJob.questionsSaved }}</div>
                  <div class="text-caption">Valid</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3">{{ selectedJob.invalidQuestions?.length || 0 }}</div>
                  <div class="text-caption">Invalid</div>
                </div>
              </v-col>
            </v-row>

            <!-- Metrics -->
            <v-divider class="my-4" />
            <h4 class="mb-2">Performance Metrics</h4>
            <v-simple-table dense>
              <template v-slot:default>
                <tbody>
                  <tr>
                    <td>Generation Time</td>
                    <td>{{ formatTime(selectedJob.metrics?.generationTime) }}</td>
                  </tr>
                  <tr>
                    <td>Validation Time</td>
                    <td>{{ formatTime(selectedJob.metrics?.validationTime) }}</td>
                  </tr>
                  <tr>
                    <td>Total Time</td>
                    <td>{{ formatTime(selectedJob.metrics?.totalTime) }}</td>
                  </tr>
                  <tr>
                    <td>Estimated Cost</td>
                    <td>${{ selectedJob.metrics?.costEstimate?.toFixed(2) || '0.00' }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>

            <!-- Errors -->
            <template v-if="selectedJob.errors?.length > 0">
              <v-divider class="my-4" />
              <h4 class="mb-2">Errors</h4>
              <v-alert
                v-for="(error, idx) in selectedJob.errors"
                :key="idx"
                type="error"
                density="compact"
                class="mb-2"
              >
                {{ error }}
              </v-alert>
            </template>
          </v-card-text>

          <v-card-actions v-if="selectedJob.status === 'completed'">
            <v-spacer />
            <v-btn
              color="success"
              :loading="isSaving"
              @click="saveQuestions(selectedJob.jobId)"
            >
              <v-icon start>mdi-content-save</v-icon>
              Save {{ selectedJob.questionsSaved }} Questions
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

definePageMeta({
  title: 'AI Question Generation',
  requiresAuth: true,
  layout: 'admin'
})

// Reactive data
const exams = ref<any[]>([])
const objectives = ref<any[]>([])
const availableModels = ref<any[]>([])
const activeJobs = ref<any[]>([])

const selectedExam = ref('')
const selectedObjectives = ref<string[]>([])
const questionCount = ref(10)
const difficulty = ref('mixed')
const selectedModel = ref('')
const valid = ref(false)

const isGenerating = ref(false)
const isSaving = ref(false)
const selectedJob = ref<any>(null)
const showJobDetails = computed({
  get: () => !!selectedJob.value,
  set: (val) => { if (!val) selectedJob.value = null }
})

const difficultyOptions = [
  { title: 'Mixed (Easy, Medium, Hard)', value: 'mixed' },
  { title: 'Easy', value: 'easy' },
  { title: 'Medium', value: 'medium' },
  { title: 'Hard', value: 'hard' }
]

// Polling interval
let pollInterval: any = null

// Computed
const estimatedCost = computed(() => {
  if (!selectedModel.value || !questionCount.value) return 0
  
  const model = availableModels.value.find(m => m.id === selectedModel.value)
  if (!model) return 0
  
  // Estimate ~500 tokens per question (prompt + response)
  const tokensPerQuestion = 500
  const totalTokens = questionCount.value * tokensPerQuestion
  const costPerMillion = model.costPerMillion || 0
  
  return (totalTokens / 1_000_000) * costPerMillion
})

// Methods
const loadExams = async () => {
  try {
    const { data } = await $fetch('/api/exams')
    exams.value = data.exams || []
  } catch (error) {
    console.error('Failed to load exams:', error)
  }
}

const loadObjectives = async () => {
  if (!selectedExam.value) {
    objectives.value = []
    return
  }

  try {
    const { data } = await $fetch('/api/objectives', {
      params: { examId: selectedExam.value }
    })
    objectives.value = data.objectives || []
  } catch (error) {
    console.error('Failed to load objectives:', error)
  }
}

const loadModels = async () => {
  try {
    const response = await $fetch('/api/admin/models', {
      params: { feature: 'question_generation' }
    })
    
    availableModels.value = response.availableModels.map((m: any) => ({
      ...m,
      displayName: `${m.name} (${m.provider})`,
      costPerMillion: m.averageCost
    }))
    
    // Set default model
    const currentSetting = response.currentSettings.question_generation
    if (currentSetting) {
      selectedModel.value = currentSetting.modelId
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

const startGeneration = async () => {
  isGenerating.value = true
  
  try {
    const response = await $fetch(`${getWorkersUrl()}/api/generate-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: {
        examId: selectedExam.value,
        objectiveIds: selectedObjectives.value.length > 0 ? selectedObjectives.value : undefined,
        totalCount: questionCount.value,
        difficulty: difficulty.value,
        userId: useNuxtApp().$auth.user?.id,
        modelId: selectedModel.value
      }
    })

    if (response.success) {
      useNuxtApp().$toast?.success(`Generation job started: ${response.jobId}`)
      
      // Start polling for job status
      pollJobStatus(response.jobId)
      
      // Reset form
      selectedObjectives.value = []
      questionCount.value = 10
    }
  } catch (error: any) {
    console.error('Failed to start generation:', error)
    useNuxtApp().$toast?.error(error.data?.message || 'Failed to start generation')
  } finally {
    isGenerating.value = false
  }
}

const pollJobStatus = async (jobId: string) => {
  try {
    const response = await $fetch(`${getWorkersUrl()}/api/status/${jobId}`)
    
    // Update active jobs
    const existingIndex = activeJobs.value.findIndex(j => j.jobId === jobId)
    if (existingIndex >= 0) {
      activeJobs.value[existingIndex] = response
    } else {
      activeJobs.value.unshift(response)
    }
    
    // Continue polling if not completed
    if (response.status === 'processing' || response.status === 'queued') {
      setTimeout(() => pollJobStatus(jobId), 2000) // Poll every 2 seconds
    } else if (response.status === 'completed') {
      useNuxtApp().$toast?.success(`Generation completed: ${response.questionsSaved} valid questions`)
    } else if (response.status === 'failed') {
      useNuxtApp().$toast?.error(`Generation failed: ${response.errors?.[0] || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Failed to poll job status:', error)
  }
}

const saveQuestions = async (jobId: string) => {
  isSaving.value = true
  
  try {
    const job = activeJobs.value.find(j => j.jobId === jobId)
    if (!job) return
    
    const response = await $fetch(`${getWorkersUrl()}/api/save-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: {
        jobId,
        examId: job.examId
      }
    })
    
    if (response.success) {
      useNuxtApp().$toast?.success(`Saved ${response.savedCount} questions to database`)
      
      // Remove job from active list
      activeJobs.value = activeJobs.value.filter(j => j.jobId !== jobId)
      selectedJob.value = null
    }
  } catch (error: any) {
    console.error('Failed to save questions:', error)
    useNuxtApp().$toast?.error(error.data?.message || 'Failed to save questions')
  } finally {
    isSaving.value = false
  }
}

// Helpers
const getJobColor = (status: string) => {
  switch (status) {
    case 'queued': return 'grey'
    case 'processing': return 'primary'
    case 'completed': return 'success'
    case 'failed': return 'error'
    default: return 'grey'
  }
}

const formatTime = (ms?: number) => {
  if (!ms) return '0s'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

const getWorkersUrl = () => {
  // In production, this would be your Workers URL
  return process.env.WORKERS_URL || 'http://localhost:8787'
}

const getAuthToken = async () => {
  // Get auth token for Workers API
  // In production, implement proper auth
  return 'dummy-token'
}

// Lifecycle
onMounted(() => {
  loadExams()
  loadModels()
  
  // Poll for active jobs every 5 seconds
  pollInterval = setInterval(() => {
    activeJobs.value.forEach(job => {
      if (job.status === 'processing' || job.status === 'queued') {
        pollJobStatus(job.jobId)
      }
    })
  }, 5000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<style scoped>
.v-simple-table td:first-child {
  font-weight: 500;
}
</style>