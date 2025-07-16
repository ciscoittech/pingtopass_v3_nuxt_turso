<template>
  <v-card elevation="0" rounded="lg" class="config-card">
    <v-card-text class="pa-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <v-avatar color="primary" variant="tonal" size="80" class="mb-4">
          <v-icon size="40">mdi-book-open-variant</v-icon>
        </v-avatar>
        <h2 class="text-h4 font-weight-bold mb-2">Study Mode</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ examCode }} - {{ examName }}
        </p>
      </div>

      <!-- Study Mode Selection -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3">Choose Study Mode</h3>
        <v-row>
          <v-col
            v-for="mode in studyModes"
            :key="mode.value"
            cols="12"
            sm="6"
          >
            <v-card
              :variant="selectedMode === mode.value ? 'flat' : 'outlined'"
              :color="selectedMode === mode.value ? 'primary' : 'default'"
              class="mode-card pa-4"
              :class="{ 'mode-selected': selectedMode === mode.value }"
              @click="selectedMode = mode.value"
            >
              <div class="d-flex align-center">
                <v-icon
                  :color="selectedMode === mode.value ? 'white' : 'primary'"
                  size="28"
                  class="mr-3"
                >
                  {{ mode.icon }}
                </v-icon>
                <div>
                  <h4 class="text-subtitle-2 font-weight-semibold">
                    {{ mode.title }}
                  </h4>
                  <p class="text-caption mb-0" :class="selectedMode === mode.value ? 'text-white' : 'text-medium-emphasis'">
                    {{ mode.description }}
                  </p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Question Count -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3">Number of Questions</h3>
        
        <!-- Quick Select Chips -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <v-chip
            v-for="preset in questionPresets"
            :key="preset.value"
            :variant="maxQuestions === preset.value ? 'flat' : 'outlined'"
            :color="maxQuestions === preset.value ? 'primary' : 'default'"
            @click="maxQuestions = preset.value"
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
          :min="0"
          :max="totalQuestions"
          :hint="`${totalQuestions} questions available`"
          persistent-hint
        >
          <template v-slot:append-inner>
            <v-icon>mdi-help-circle</v-icon>
          </template>
        </v-text-field>
      </div>

      <!-- Additional Options -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3">Options</h3>
        
        <v-switch
          v-model="showTimer"
          label="Show timer"
          density="comfortable"
          color="primary"
          hide-details
          class="mb-3"
        />
        
        <v-switch
          v-model="autoAdvance"
          label="Auto-advance after answering"
          density="comfortable"
          color="primary"
          hide-details
          class="mb-3"
        />
        
        <v-switch
          v-model="showExplanations"
          label="Show explanations immediately"
          density="comfortable"
          color="primary"
          hide-details
        />
      </div>

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
        color="primary"
        size="x-large"
        block
        variant="flat"
        rounded="pill"
        @click="startSession"
        :loading="loading"
        :disabled="!canStart"
      >
        <v-icon start>mdi-play</v-icon>
        Start Study Session
      </v-btn>

      <!-- Info Text -->
      <p class="text-caption text-center text-medium-emphasis mt-3 mb-0">
        Press <kbd>Enter</kbd> to start
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
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
    mode: string
    maxQuestions: number
    showTimer: boolean
    autoAdvance: boolean
    showExplanations: boolean
  }]
}>()

// Study modes configuration
const studyModes = [
  {
    value: 'sequential',
    title: 'Sequential',
    description: 'Questions in order',
    icon: 'mdi-arrow-right'
  },
  {
    value: 'random',
    title: 'Random',
    description: 'Random question order',
    icon: 'mdi-shuffle'
  },
  {
    value: 'flagged',
    title: 'Flagged Only',
    description: 'Review flagged questions',
    icon: 'mdi-flag'
  },
  {
    value: 'incorrect',
    title: 'Incorrect Only',
    description: 'Practice wrong answers',
    icon: 'mdi-close-circle'
  },
  {
    value: 'review',
    title: 'Review Mode',
    description: 'Review all answered questions',
    icon: 'mdi-book-check'
  },
  {
    value: 'weak_areas',
    title: 'Weak Areas',
    description: 'Focus on low-scoring topics',
    icon: 'mdi-target'
  }
]

// Question presets
const questionPresets = [
  { label: '10 Questions', value: 10 },
  { label: '25 Questions', value: 25 },
  { label: '50 Questions', value: 50 },
  { label: '100 Questions', value: 100 },
  { label: 'All Questions', value: 0 }
]

// Local state
const selectedMode = ref('sequential')
const maxQuestions = ref(25)
const showTimer = ref(true)
const autoAdvance = ref(false)
const showExplanations = ref(true)
const error = ref('')

// Computed
const canStart = computed(() => {
  return !props.loading && selectedMode.value
})

// Methods
const startSession = () => {
  console.log('[StudyModeConfig] startSession called')
  console.log('[StudyModeConfig] canStart:', canStart.value)
  console.log('[StudyModeConfig] props:', {
    examId: props.examId,
    examCode: props.examCode,
    examName: props.examName,
    totalQuestions: props.totalQuestions,
    loading: props.loading
  })
  
  if (!canStart.value) {
    console.log('[StudyModeConfig] Cannot start - canStart is false')
    return
  }
  
  const config = {
    mode: selectedMode.value,
    maxQuestions: maxQuestions.value || props.totalQuestions,
    showTimer: showTimer.value,
    autoAdvance: autoAdvance.value,
    showExplanations: showExplanations.value
  }
  
  console.log('[StudyModeConfig] Emitting start event with config:', config)
  emit('start', config)
}

// Keyboard shortcut
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && canStart.value) {
    startSession()
    event.preventDefault()
  }
}

onMounted(() => {
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
}

.mode-card {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  
  &:hover:not(.mode-selected) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: rgb(var(--v-theme-primary));
  }
  
  &.mode-selected {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.3);
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