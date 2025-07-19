<template>
  <v-card elevation="10" rounded="lg" class="config-card">
    <v-card-text class="pa-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <v-avatar color="warning" variant="tonal" size="80" class="mb-4">
          <Icon icon="solar:timer-start-bold-duotone" size="40" />
        </v-avatar>
        <h2 class="text-h4 font-weight-bold mb-2 text-warning">Test Mode</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ examCode }} - {{ examName }}
        </p>
        <v-chip size="small" variant="tonal" color="success" class="mt-2">
          <Icon icon="solar:document-text-line-duotone" size="16" class="mr-1" />
          {{ totalQuestions }} Questions Available
        </v-chip>
      </div>

      <!-- Test Duration -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center">
          <Icon icon="solar:clock-circle-bold-duotone" size="20" class="mr-2 text-warning" />
          Test Duration
        </h3>
        
        <!-- Duration Selection -->
        <v-select
          v-model="selectedDuration"
          :items="durationOptions"
          label="Select time limit"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        >
          <template #prepend-inner>
            <Icon icon="solar:stopwatch-bold-duotone" size="20" class="text-warning" />
          </template>
          <template #item="{ item, props }">
            <v-list-item v-bind="props">
              <template #prepend>
                <Icon icon="solar:clock-circle-bold-duotone" size="20" class="text-warning mr-2" />
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>

      <!-- Question Count -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center">
          <Icon icon="solar:hashtag-bold-duotone" size="20" class="mr-2 text-warning" />
          Number of Questions
        </h3>
        
        <!-- Quick Select Chips -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <v-chip
            v-for="preset in questionPresets"
            :key="preset.value"
            :variant="maxQuestions === preset.value ? 'flat' : 'outlined'"
            :color="maxQuestions === preset.value ? 'warning' : 'default'"
            @click="maxQuestions = preset.value"
            class="font-weight-medium"
          >
            {{ preset.label }}
          </v-chip>
        </div>

        <!-- Custom Input -->
        <v-text-field
          v-model.number="maxQuestions"
          type="number"
          label="Custom amount"
          variant="outlined"
          density="comfortable"
          :min="1"
          :max="totalQuestions"
          :hint="`${totalQuestions} questions available`"
          persistent-hint
        >
          <template v-slot:prepend-inner>
            <Icon icon="solar:pen-bold-duotone" size="20" class="text-warning" />
          </template>
        </v-text-field>
      </div>

      <!-- Test Mode Options -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center">
          <Icon icon="solar:settings-minimalistic-bold-duotone" size="20" class="mr-2 text-warning" />
          Test Options
        </h3>
        
        <v-card variant="outlined" class="options-card pa-4" elevation="1">
          <v-switch
            v-model="simulateRealExam"
            density="comfortable"
            color="warning"
            hide-details
            class="mb-3"
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                <Icon icon="solar:shield-check-bold-duotone" size="20" class="mr-2 text-warning" />
                <span class="text-subtitle-2">Simulate real exam conditions</span>
              </div>
            </template>
          </v-switch>
          
          <v-switch
            v-model="showTimer"
            density="comfortable"
            color="warning"
            hide-details
            class="mb-3"
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                <Icon icon="solar:stopwatch-bold-duotone" size="20" class="mr-2 text-warning" />
                <span class="text-subtitle-2">Show countdown timer</span>
              </div>
            </template>
          </v-switch>
          
          <v-switch
            v-model="allowReview"
            density="comfortable"
            color="warning"
            hide-details
            :disabled="simulateRealExam"
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                <Icon icon="solar:eye-bold-duotone" size="20" class="mr-2 text-warning" />
                <span class="text-subtitle-2">Allow question review</span>
              </div>
            </template>
          </v-switch>
        </v-card>
      </div>

      <!-- Test Information -->
      <v-alert
        type="warning"
        variant="tonal"
        border="start"
        class="mb-6"
      >
        <template #prepend>
          <Icon icon="solar:info-circle-bold-duotone" size="20" />
        </template>
        <div class="text-body-2">
          <strong>Important:</strong> This is a timed test simulation.
          <div class="text-caption mt-1">
            • No pausing once started
            • Questions answered randomly
            • Results available immediately after submission
          </div>
        </div>
      </v-alert>

      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>

      <!-- Start Button -->
      <v-btn
        color="warning"
        size="x-large"
        block
        variant="flat"
        rounded="pill"
        @click="startTest"
        :loading="loading"
        :disabled="!canStart"
        elevation="4"
        class="text-none font-weight-bold"
      >
        <Icon icon="solar:play-bold-duotone" size="20" class="mr-2" />
        Start Test
      </v-btn>

      <!-- Info Text -->
      <p class="text-caption text-center text-medium-emphasis mt-3 mb-0">
        Press <kbd>Enter</kbd> to start • <Icon icon="solar:keyboard-bold-duotone" size="14" class="mx-1" /> Keyboard shortcuts available
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  examId: string
  examCode: string
  examName: string
  totalQuestions: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  start: [config: {
    duration: number
    maxQuestions: number
    simulateRealExam: boolean
    showTimer: boolean
    allowReview: boolean
  }]
}>()

// Duration options
const durationOptions = [
  { title: '30 minutes', value: 1800 },
  { title: '45 minutes', value: 2700 },
  { title: '1 hour', value: 3600 },
  { title: '90 minutes', value: 5400 },
  { title: '2 hours', value: 7200 },
  { title: '3 hours', value: 10800 }
]

// Question presets
const questionPresets = [
  { label: '25 Questions', value: 25 },
  { label: '50 Questions', value: 50 },
  { label: '75 Questions', value: 75 },
  { label: '100 Questions', value: 100 },
  { label: 'All Questions', value: 0 }
]

// Local state
const selectedDuration = ref(3600) // 1 hour default
const maxQuestions = ref(50)
const simulateRealExam = ref(true)
const showTimer = ref(true)
const allowReview = ref(true)
const error = ref('')

// Watch simulateRealExam to disable allowReview
watch(simulateRealExam, (newValue) => {
  if (newValue) {
    allowReview.value = false
  }
})

// Computed
const canStart = computed(() => {
  return !props.loading && selectedDuration.value > 0 && maxQuestions.value > 0
})

// Methods
const startTest = () => {
  console.log('[TestModeConfig] startTest called')
  console.log('[TestModeConfig] canStart:', canStart.value)
  console.log('[TestModeConfig] props:', {
    examId: props.examId,
    examCode: props.examCode,
    examName: props.examName,
    totalQuestions: props.totalQuestions,
    loading: props.loading
  })
  
  if (!canStart.value) {
    console.log('[TestModeConfig] Cannot start - canStart is false')
    return
  }
  
  const config = {
    duration: selectedDuration.value,
    maxQuestions: maxQuestions.value || props.totalQuestions,
    simulateRealExam: simulateRealExam.value,
    showTimer: showTimer.value,
    allowReview: allowReview.value
  }
  
  console.log('[TestModeConfig] Emitting start event with config:', config)
  emit('start', config)
}

// Keyboard shortcut
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && canStart.value) {
    startTest()
    event.preventDefault()
  }
}

onMounted(() => {
  // Set default questions based on available questions
  maxQuestions.value = Math.min(50, props.totalQuestions)
  
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.config-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.5) 100%);
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
}

.options-card {
  background: rgba(var(--v-theme-surface), 0.5);
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(var(--v-theme-warning), 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.v-chip {
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
}

.v-btn {
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--v-theme-warning), 0.3);
  }
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>