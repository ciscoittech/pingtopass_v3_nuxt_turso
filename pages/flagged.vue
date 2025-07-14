<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Stats Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Total Flagged</p>
                <h4 class="text-h4 font-weight-bold">{{ totalFlagged }}</h4>
              </div>
              <v-avatar color="error" variant="tonal" size="48">
                <Icon icon="solar:flag-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Need Review</p>
                <h4 class="text-h4 font-weight-bold">{{ needReview }}</h4>
              </div>
              <v-avatar color="warning" variant="tonal" size="48">
                <Icon icon="solar:eye-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Difficult</p>
                <h4 class="text-h4 font-weight-bold">{{ difficultQuestions }}</h4>
              </div>
              <v-avatar color="orange" variant="tonal" size="48">
                <Icon icon="solar:shield-warning-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Resolved</p>
                <h4 class="text-h4 font-weight-bold">{{ resolvedFlags }}</h4>
              </div>
              <v-avatar color="success" variant="tonal" size="48">
                <Icon icon="solar:check-circle-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Flagged Questions List -->
    <UiParentCard title="Flagged Questions for Review">
      <template #action>
        <div class="d-flex gap-2 align-center">
          <v-select
            v-model="selectedType"
            :items="flagTypes"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="All Types"
            clearable
            style="max-width: 150px"
          />
          <v-select
            v-model="selectedExam"
            :items="examFilters"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="All Exams"
            clearable
            style="max-width: 200px"
          />
          <v-btn-toggle
            v-model="sortBy"
            density="compact"
            variant="outlined"
            divided
            mandatory
          >
            <v-btn value="recent" size="small">
              <Icon icon="solar:calendar-linear" class="mr-1" size="16" />
              Recent
            </v-btn>
            <v-btn value="priority" size="small">
              <Icon icon="solar:danger-circle-linear" class="mr-1" size="16" />
              Priority
            </v-btn>
          </v-btn-toggle>
        </div>
      </template>

      <!-- Flagged Questions Grid -->
      <v-row v-if="filteredFlags.length > 0">
        <v-col
          v-for="flag in filteredFlags"
          :key="flag.id"
          cols="12"
          md="6"
        >
          <v-card
            variant="outlined"
            :class="['h-100', 'border', { 'border-error': flag.priority === 'high' }]"
          >
            <!-- Flag Header -->
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar :color="getFlagColor(flag.flagType)" variant="tonal">
                  <Icon :icon="getFlagIcon(flag.flagType)" />
                </v-avatar>
              </template>
              <v-card-title class="text-body-1 font-weight-semibold">
                {{ flag.exam.code }} - Question #{{ flag.questionId }}
              </v-card-title>
              <v-card-subtitle>
                <v-chip 
                  :color="getFlagColor(flag.flagType)" 
                  size="x-small" 
                  variant="tonal"
                >
                  {{ flag.flagType }}
                </v-chip>
                <span class="ml-2 text-caption">
                  {{ formatRelativeTime(flag.createdAt) }}
                </span>
              </v-card-subtitle>
              <template v-slot:append>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="studyQuestion(flag)">
                      <template v-slot:prepend>
                        <Icon icon="solar:book-linear" />
                      </template>
                      <v-list-item-title>Study Question</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="changeFlagType(flag)">
                      <template v-slot:prepend>
                        <Icon icon="solar:tag-linear" />
                      </template>
                      <v-list-item-title>Change Type</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="resolveFlag(flag)" class="text-success">
                      <template v-slot:prepend>
                        <Icon icon="solar:check-circle-linear" />
                      </template>
                      <v-list-item-title>Mark Resolved</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="removeFlag(flag)" class="text-error">
                      <template v-slot:prepend>
                        <Icon icon="solar:trash-bin-trash-linear" />
                      </template>
                      <v-list-item-title>Remove Flag</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-card-item>
            
            <v-card-text>
              <!-- Question Text -->
              <p class="text-body-2 mb-3">
                {{ flag.question.questionText }}
              </p>
              
              <!-- Flag Reason -->
              <div v-if="flag.reason" class="mb-3">
                <div class="d-flex align-center mb-1">
                  <Icon icon="solar:info-circle-linear" class="mr-1" size="16" />
                  <span class="text-caption text-medium-emphasis">Reason for flagging:</span>
                </div>
                <v-alert
                  :color="getFlagColor(flag.flagType)"
                  variant="tonal"
                  density="compact"
                  class="text-body-2"
                >
                  {{ flag.reason }}
                </v-alert>
              </div>
              
              <!-- Question Stats -->
              <v-row dense>
                <v-col cols="6">
                  <div class="d-flex align-center">
                    <Icon icon="solar:chart-line-duotone" class="mr-1" size="16" />
                    <span class="text-caption text-medium-emphasis">Accuracy: </span>
                    <span class="text-caption font-weight-bold ml-1">{{ flag.userAccuracy }}%</span>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="d-flex align-center">
                    <Icon icon="solar:timer-linear" class="mr-1" size="16" />
                    <span class="text-caption text-medium-emphasis">Attempts: </span>
                    <span class="text-caption font-weight-bold ml-1">{{ flag.attempts }}</span>
                  </div>
                </v-col>
              </v-row>
              
              <!-- Action Progress -->
              <div v-if="flag.studyProgress" class="mt-3">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-caption text-medium-emphasis">Study Progress</span>
                  <span class="text-caption font-weight-bold">{{ flag.studyProgress }}%</span>
                </div>
                <v-progress-linear
                  :model-value="flag.studyProgress"
                  :color="flag.studyProgress >= 80 ? 'success' : 'warning'"
                  height="6"
                  rounded
                />
              </div>
            </v-card-text>
            
            <v-card-actions>
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                @click="studyQuestion(flag)"
              >
                <Icon icon="solar:book-linear" class="mr-1" size="16" />
                Study Now
              </v-btn>
              <v-spacer />
              <v-btn
                v-if="!flag.isResolved"
                color="success"
                variant="text"
                size="small"
                @click="resolveFlag(flag)"
              >
                Mark Resolved
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon icon="solar:flag-broken" size="64" class="mb-4 text-grey-lighten-1" />
        <h5 class="text-h5 mb-2">No Flagged Questions</h5>
        <p class="text-body-1 text-grey100 mb-4">
          {{ selectedType || selectedExam ? 'No questions match your filters' : 'All your questions are mastered!' }}
        </p>
        <v-btn v-if="!selectedType && !selectedExam" color="primary" variant="flat" :to="'/study'">
          Continue Studying
          <Icon icon="solar:arrow-right-linear" class="ml-1" />
        </v-btn>
      </div>
    </UiParentCard>

    <!-- Change Flag Type Dialog -->
    <v-dialog v-model="typeDialog" max-width="400">
      <v-card>
        <v-card-title>Change Flag Type</v-card-title>
        <v-card-text>
          <v-radio-group v-model="newFlagType">
            <v-radio
              v-for="type in flagTypeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-icon :icon="type.icon" :color="type.color" class="mr-2" />
                  {{ type.label }}
                </div>
              </template>
            </v-radio>
          </v-radio-group>
          <v-textarea
            v-model="newFlagReason"
            label="Reason (optional)"
            rows="3"
            variant="outlined"
            hide-details
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="typeDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveFlagType">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Breadcrumb
const page = ref({ title: 'Flagged Questions' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Flagged Questions',
    disabled: true,
    to: ''
  }
])

// State
const selectedType = ref('')
const selectedExam = ref('')
const sortBy = ref('recent')
const typeDialog = ref(false)
const editingFlag = ref<any>(null)
const newFlagType = ref('')
const newFlagReason = ref('')

// Flag type options
const flagTypeOptions = [
  { value: 'review', label: 'Need Review', icon: 'mdi-eye', color: 'warning' },
  { value: 'difficult', label: 'Too Difficult', icon: 'mdi-alert', color: 'orange' },
  { value: 'incorrect', label: 'Incorrect Answer', icon: 'mdi-close-circle', color: 'error' },
  { value: 'confusing', label: 'Confusing Wording', icon: 'mdi-help-circle', color: 'info' }
]

const flagTypes = flagTypeOptions.map(type => ({
  title: type.label,
  value: type.value
}))

// Mock data (replace with actual API call)
const flags = ref([
  {
    id: '1',
    questionId: '123',
    exam: { id: 'exam1', code: 'AZ-900', name: 'Azure Fundamentals' },
    question: {
      questionText: 'Which Azure service provides serverless computing?',
      difficultyLevel: 'medium'
    },
    flagType: 'difficult',
    reason: 'The options are very similar and confusing',
    priority: 'high',
    userAccuracy: 45,
    attempts: 3,
    studyProgress: 60,
    isResolved: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    questionId: '456',
    exam: { id: 'exam2', code: 'AWS-SAA', name: 'AWS Solutions Architect' },
    question: {
      questionText: 'What is the maximum size of an S3 object?',
      difficultyLevel: 'easy'
    },
    flagType: 'review',
    reason: '',
    priority: 'medium',
    userAccuracy: 70,
    attempts: 2,
    studyProgress: 40,
    isResolved: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    questionId: '789',
    exam: { id: 'exam1', code: 'AZ-900', name: 'Azure Fundamentals' },
    question: {
      questionText: 'Which of the following is a Platform as a Service (PaaS) offering?',
      difficultyLevel: 'hard'
    },
    flagType: 'incorrect',
    reason: 'The marked correct answer seems wrong based on Microsoft documentation',
    priority: 'high',
    userAccuracy: 20,
    attempts: 5,
    studyProgress: 80,
    isResolved: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
])

// Stats
const totalFlagged = computed(() => flags.value.length)
const needReview = computed(() => flags.value.filter(f => f.flagType === 'review' && !f.isResolved).length)
const difficultQuestions = computed(() => flags.value.filter(f => f.flagType === 'difficult' && !f.isResolved).length)
const resolvedFlags = computed(() => flags.value.filter(f => f.isResolved).length)

// Exam filters
const examFilters = computed(() => {
  const exams = new Map()
  flags.value.forEach(f => {
    if (!exams.has(f.exam.id)) {
      exams.set(f.exam.id, {
        title: `${f.exam.code} - ${f.exam.name}`,
        value: f.exam.id
      })
    }
  })
  return Array.from(exams.values())
})

// Filtered flags
const filteredFlags = computed(() => {
  let filtered = flags.value.filter(f => !f.isResolved)
  
  if (selectedType.value) {
    filtered = filtered.filter(f => f.flagType === selectedType.value)
  }
  
  if (selectedExam.value) {
    filtered = filtered.filter(f => f.exam.id === selectedExam.value)
  }
  
  // Sort
  if (sortBy.value === 'priority') {
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  } else {
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
  
  return filtered
})

// Methods
const studyQuestion = (flag: any) => {
  navigateTo(`/study/${flag.exam.id}?question=${flag.questionId}`)
}

const changeFlagType = (flag: any) => {
  editingFlag.value = flag
  newFlagType.value = flag.flagType
  newFlagReason.value = flag.reason || ''
  typeDialog.value = true
}

const saveFlagType = () => {
  if (editingFlag.value) {
    editingFlag.value.flagType = newFlagType.value
    editingFlag.value.reason = newFlagReason.value
  }
  typeDialog.value = false
}

const resolveFlag = (flag: any) => {
  flag.isResolved = true
}

const removeFlag = (flag: any) => {
  flags.value = flags.value.filter(f => f.id !== flag.id)
}

// Helper functions
const getFlagColor = (type: string) => {
  const colors = {
    review: 'warning',
    difficult: 'orange',
    incorrect: 'error',
    confusing: 'info'
  }
  return colors[type] || 'grey'
}

const getFlagIcon = (type: string) => {
  const icons = {
    review: 'solar:eye-bold',
    difficult: 'solar:shield-warning-bold',
    incorrect: 'solar:close-circle-bold',
    confusing: 'solar:help-circle-bold'
  }
  return icons[type] || 'solar:flag-bold'
}

const formatRelativeTime = (date: string) => {
  const timestamp = new Date(date).getTime()
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
</script>

<style scoped>
.border-error {
  border-color: rgb(var(--v-theme-error)) !important;
}
</style>