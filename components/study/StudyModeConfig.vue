<template>
  <v-card elevation="10" class="config-card">
    <v-card-text class="pa-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <v-avatar color="primary" variant="tonal" size="80" class="mb-4">
          <Icon icon="solar:book-bold-duotone" size="40" />
        </v-avatar>
        <h2 class="text-h4 font-weight-bold mb-2 text-primary">Study Mode</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ examCode }} - {{ examName }}
        </p>
        <v-chip size="small" variant="tonal" color="success" class="mt-2">
          <Icon icon="solar:document-text-line-duotone" size="16" class="mr-1" />
          {{ totalQuestions }} Questions Available
        </v-chip>
      </div>

      <!-- Study Mode Selection -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center">
          <Icon icon="solar:settings-bold-duotone" size="20" class="mr-2 text-primary" />
          Choose Study Mode
        </h3>
        <v-row>
          <v-col
            v-for="mode in studyModes"
            :key="mode.value"
            cols="12"
          >
            <v-card
              :variant="selectedMode === mode.value ? 'flat' : 'tonal'"
              :color="selectedMode === mode.value ? 'primary' : 'grey'"
              class="mode-card pa-3 mb-2"
              :class="{ 'mode-selected': selectedMode === mode.value }"
              @click="selectedMode = mode.value"
              elevation="0"
            >
              <div class="d-flex align-center">
                <Icon
                  :icon="mode.icon"
                  size="24"
                  class="mr-3"
                />
                <div>
                  <h4 class="text-subtitle-2 font-weight-semibold">
                    {{ mode.title }}
                  </h4>
                  <p class="text-caption mb-0 text-medium-emphasis">
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
        <h3 class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center">
          <Icon icon="solar:hashtag-bold-duotone" size="20" class="mr-2 text-primary" />
          Number of Questions
        </h3>
        
        <!-- Quick Select Buttons -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <v-btn
            v-for="preset in questionPresets"
            :key="preset.value"
            :variant="maxQuestions === preset.value ? 'flat' : 'outlined'"
            :color="maxQuestions === preset.value ? 'primary' : 'default'"
            @click="maxQuestions = preset.value"
            rounded="pill"
            size="default"
          >
            {{ preset.label }}
          </v-btn>
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
            <Icon icon="solar:pen-bold-duotone" size="20" />
          </template>
        </v-text-field>
      </div>

      <!-- Additional Options -->
      <div class="mb-6">
        <h3 class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center">
          <Icon icon="solar:settings-minimalistic-bold-duotone" size="20" class="mr-2 text-primary" />
          Study Options
        </h3>
        
        <v-card variant="outlined" class="options-card pa-4" elevation="0">
          <v-switch
            v-model="showTimer"
            density="comfortable"
            color="primary"
            hide-details
            class="mb-3"
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                <Icon icon="solar:stopwatch-bold-duotone" size="20" class="mr-2" />
                <span class="text-subtitle-2">Show timer</span>
              </div>
            </template>
          </v-switch>
          
          <v-switch
            v-model="autoAdvance"
            density="comfortable"
            color="primary"
            hide-details
            class="mb-3"
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                <Icon icon="solar:arrow-right-bold-duotone" size="20" class="mr-2" />
                <span class="text-subtitle-2">Auto-advance after answering</span>
              </div>
            </template>
          </v-switch>
          
          <v-switch
            v-model="showExplanations"
            density="comfortable"
            color="primary"
            hide-details
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                <Icon icon="solar:info-circle-bold-duotone" size="20" class="mr-2" />
                <span class="text-subtitle-2">Show explanations immediately</span>
              </div>
            </template>
          </v-switch>
        </v-card>
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
        size="large"
        block
        variant="flat"
        rounded="lg"
        @click="startSession"
        :loading="loading"
        :disabled="!canStart"
        class="text-none font-weight-semibold"
      >
        <Icon icon="solar:play-bold-duotone" size="20" class="mr-2" />
        Start Study Session
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
    icon: 'solar:arrow-right-bold-duotone'
  },
  {
    value: 'random',
    title: 'Random',
    description: 'Random question order',
    icon: 'solar:shuffle-bold-duotone'
  },
  {
    value: 'flagged',
    title: 'Flagged Only',
    description: 'Review flagged questions',
    icon: 'solar:flag-bold-duotone'
  },
  {
    value: 'incorrect',
    title: 'Incorrect Only',
    description: 'Practice wrong answers',
    icon: 'solar:close-circle-bold-duotone'
  },
  {
    value: 'review',
    title: 'Review Mode',
    description: 'Review all answered questions',
    icon: 'solar:book-bookmark-bold-duotone'
  },
  {
    value: 'weak_areas',
    title: 'Weak Areas',
    description: 'Focus on low-scoring topics',
    icon: 'solar:target-bold-duotone'
  }
]

// Question presets
const questionPresets = computed(() => [
  { label: '10 Questions', value: 10 },
  { label: '25 Questions', value: 25 },
  { label: '50 Questions', value: 50 },
  { label: '100 Questions', value: 100 },
  { label: 'All Questions', value: props.totalQuestions }
])

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
  // console.log('[StudyModeConfig] startSession called')
  // console.log('[StudyModeConfig] canStart:', canStart.value)
  // console.log('[StudyModeConfig] props:', {
  //   examId: props.examId,
  //   examCode: props.examCode,
  //   examName: props.examName,
  //   totalQuestions: props.totalQuestions,
  //   loading: props.loading
  // })
  
  if (!canStart.value) {
    // console.log('[StudyModeConfig] Cannot start - canStart is false')
    return
  }
  
  const config = {
    mode: selectedMode.value,
    maxQuestions: maxQuestions.value || props.totalQuestions,
    showTimer: showTimer.value,
    autoAdvance: autoAdvance.value,
    showExplanations: showExplanations.value
  }
  
  // console.log('[StudyModeConfig] Emitting start event with config:', config)
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
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
}

.mode-card {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover:not(.mode-selected) {
    opacity: 0.9;
  }
}

.options-card {
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
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