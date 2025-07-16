<template>
  <v-card elevation="0" rounded="lg" class="summary-card">
    <v-card-text class="pa-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <v-icon size="64" color="primary" class="mb-4">mdi-clipboard-check</v-icon>
        <h2 class="text-h4 font-weight-bold mb-2">Test Summary</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          Review your answers before submitting
        </p>
      </div>

      <!-- Stats Overview -->
      <v-row class="mb-6">
        <v-col cols="6" md="3">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center pa-4">
              <div class="text-h5 font-weight-bold">{{ totalQuestions }}</div>
              <div class="text-caption">Total Questions</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" md="3">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center pa-4">
              <div class="text-h5 font-weight-bold">{{ answeredCount }}</div>
              <div class="text-caption">Answered</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" md="3">
          <v-card variant="tonal" color="grey">
            <v-card-text class="text-center pa-4">
              <div class="text-h5 font-weight-bold">{{ unansweredCount }}</div>
              <div class="text-caption">Unanswered</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="6" md="3">
          <v-card variant="tonal" color="warning">
            <v-card-text class="text-center pa-4">
              <div class="text-h5 font-weight-bold">{{ flaggedCount }}</div>
              <div class="text-caption">Flagged</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Time Spent -->
      <v-alert
        type="info"
        variant="tonal"
        class="mb-6"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="font-weight-semibold">Time Spent</div>
            <div class="text-caption">{{ formattedTime }}</div>
          </div>
          <v-icon size="32">mdi-clock-check</v-icon>
        </div>
      </v-alert>

      <!-- Question Review List -->
      <div v-if="unansweredCount > 0 || flaggedCount > 0" class="mb-6">
        <h3 class="text-h6 font-weight-semibold mb-3">Review Required</h3>
        
        <!-- Unanswered Questions -->
        <div v-if="unansweredCount > 0" class="mb-4">
          <p class="text-subtitle-2 text-medium-emphasis mb-2">
            <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>
            Unanswered Questions ({{ unansweredCount }})
          </p>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="index in unansweredQuestions"
              :key="`unanswered-${index}`"
              color="error"
              variant="tonal"
              size="small"
              @click="$emit('navigate', index)"
            >
              Question {{ index + 1 }}
            </v-chip>
          </div>
        </div>
        
        <!-- Flagged Questions -->
        <div v-if="flaggedCount > 0">
          <p class="text-subtitle-2 text-medium-emphasis mb-2">
            <v-icon size="small" color="warning" class="mr-1">mdi-flag</v-icon>
            Flagged for Review ({{ flaggedCount }})
          </p>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="index in flagged"
              :key="`flagged-${index}`"
              color="warning"
              variant="tonal"
              size="small"
              @click="$emit('navigate', index)"
            >
              Question {{ index + 1 }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- All Questions Ready -->
      <v-alert
        v-else
        type="success"
        variant="tonal"
        class="mb-6"
      >
        <div class="d-flex align-center">
          <v-icon class="mr-3">mdi-check-circle</v-icon>
          <div>
            <div class="font-weight-semibold">All questions answered!</div>
            <div class="text-caption">You're ready to submit your test.</div>
          </div>
        </div>
      </v-alert>

      <!-- Actions -->
      <v-row>
        <v-col cols="12" md="6">
          <v-btn
            variant="outlined"
            size="large"
            block
            @click="$emit('continue-review')"
          >
            <v-icon start>mdi-pencil</v-icon>
            Continue Review
          </v-btn>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            block
            :disabled="!canSubmit"
            @click="confirmSubmit"
          >
            <v-icon start>mdi-check-all</v-icon>
            Submit Test
          </v-btn>
        </v-col>
      </v-row>

      <!-- Warning text -->
      <p class="text-caption text-center text-medium-emphasis mt-4 mb-0">
        Once submitted, you cannot change your answers
      </p>
    </v-card-text>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Test Submission</v-card-title>
        <v-card-text>
          <p class="text-body-1">Are you sure you want to submit your test?</p>
          
          <v-alert
            v-if="unansweredCount > 0"
            type="warning"
            variant="tonal"
            class="mt-3"
          >
            You have {{ unansweredCount }} unanswered question{{ unansweredCount > 1 ? 's' : '' }}.
            These will be marked as incorrect.
          </v-alert>
          
          <p class="text-body-2 text-medium-emphasis mt-3 mb-0">
            This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showConfirmDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="submitTest"
          >
            Submit Test
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  totalQuestions: number
  answers: Record<number, number[]>
  flagged: number[]
  timeSeconds: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: [questionIndex: number]
  'continue-review': []
  'submit-test': []
}>()

// Local state
const showConfirmDialog = ref(false)

// Computed
const answeredCount = computed(() => {
  return Object.keys(props.answers).filter(key => 
    props.answers[parseInt(key)].length > 0
  ).length
})

const unansweredCount = computed(() => {
  return props.totalQuestions - answeredCount.value
})

const flaggedCount = computed(() => {
  return props.flagged.length
})

const unansweredQuestions = computed(() => {
  const unanswered: number[] = []
  for (let i = 0; i < props.totalQuestions; i++) {
    if (!props.answers[i] || props.answers[i].length === 0) {
      unanswered.push(i)
    }
  }
  return unanswered
})

const canSubmit = computed(() => {
  return true // Allow submission even with unanswered questions
})

const formattedTime = computed(() => {
  const hours = Math.floor(props.timeSeconds / 3600)
  const minutes = Math.floor((props.timeSeconds % 3600) / 60)
  const seconds = props.timeSeconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
})

// Methods
const confirmSubmit = () => {
  showConfirmDialog.value = true
}

const submitTest = () => {
  showConfirmDialog.value = false
  emit('submit-test')
}
</script>

<style lang="scss" scoped>
.summary-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  max-width: 800px;
  margin: 0 auto;
}

.v-chip {
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}
</style>