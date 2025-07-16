<template>
  <v-dialog
    v-model="show"
    max-width="500"
    persistent
  >
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex align-center">
        <v-icon size="28" color="primary" class="mr-2">mdi-clipboard-check</v-icon>
        Submit Test
      </v-card-title>
      
      <v-card-text>
        <!-- Summary Statistics -->
        <v-alert
          v-if="unansweredCount > 0"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert</v-icon>
            <div>
              <strong>{{ unansweredCount }} questions not answered</strong>
              <div class="text-caption">
                These will be marked as incorrect
              </div>
            </div>
          </div>
        </v-alert>
        
        <!-- Test Summary -->
        <div class="test-summary">
          <v-row dense>
            <v-col cols="6">
              <div class="stat-item">
                <v-icon size="20" color="primary">mdi-timer-outline</v-icon>
                <div class="ml-2">
                  <div class="text-caption text-medium-emphasis">Time Remaining</div>
                  <div class="font-weight-medium">{{ formattedTime }}</div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="6">
              <div class="stat-item">
                <v-icon size="20" color="success">mdi-check-circle</v-icon>
                <div class="ml-2">
                  <div class="text-caption text-medium-emphasis">Answered</div>
                  <div class="font-weight-medium">{{ answeredCount }} / {{ totalQuestions }}</div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="6">
              <div class="stat-item">
                <v-icon size="20" color="error">mdi-flag</v-icon>
                <div class="ml-2">
                  <div class="text-caption text-medium-emphasis">Flagged</div>
                  <div class="font-weight-medium">{{ flaggedCount }} questions</div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="6">
              <div class="stat-item">
                <v-icon size="20" color="info">mdi-percent</v-icon>
                <div class="ml-2">
                  <div class="text-caption text-medium-emphasis">Completion</div>
                  <div class="font-weight-medium">{{ completionPercentage }}%</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
        
        <v-divider class="my-4" />
        
        <!-- Confirmation Message -->
        <p class="text-body-1 mb-0">
          Are you sure you want to submit your test? Once submitted, you cannot change your answers.
        </p>
        
        <!-- Flagged Questions Warning -->
        <v-alert
          v-if="flaggedCount > 0"
          type="info"
          variant="text"
          density="compact"
          class="mt-3"
        >
          <div class="text-caption">
            <v-icon size="small" class="mr-1">mdi-information</v-icon>
            You have {{ flaggedCount }} flagged question{{ flaggedCount !== 1 ? 's' : '' }} for review.
            Consider reviewing {{ flaggedCount === 1 ? 'it' : 'them' }} before submitting.
          </div>
        </v-alert>
      </v-card-text>
      
      <v-divider />
      
      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          Continue Test
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          v-if="flaggedCount > 0"
          color="warning"
          variant="outlined"
          @click="handleReviewFlagged"
        >
          <v-icon start size="small">mdi-flag</v-icon>
          Review Flagged
        </v-btn>
        
        <v-btn
          color="primary"
          variant="flat"
          :loading="loading"
          @click="handleSubmit"
        >
          <v-icon start size="small">mdi-send</v-icon>
          Submit Test
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  answeredCount: number
  totalQuestions: number
  flaggedCount: number
  remainingSeconds: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': []
  'review-flagged': []
}>()

// Local state
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Computed
const unansweredCount = computed(() => {
  return props.totalQuestions - props.answeredCount
})

const completionPercentage = computed(() => {
  if (props.totalQuestions === 0) return 0
  return Math.round((props.answeredCount / props.totalQuestions) * 100)
})

const formattedTime = computed(() => {
  const hours = Math.floor(props.remainingSeconds / 3600)
  const minutes = Math.floor((props.remainingSeconds % 3600) / 60)
  const seconds = props.remainingSeconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
const handleSubmit = () => {
  emit('submit')
}

const handleCancel = () => {
  show.value = false
}

const handleReviewFlagged = () => {
  show.value = false
  emit('review-flagged')
}
</script>

<style lang="scss" scoped>
.test-summary {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
</style>