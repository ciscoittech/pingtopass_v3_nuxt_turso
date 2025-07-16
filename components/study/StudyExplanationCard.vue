<template>
  <v-card elevation="0" rounded="lg" class="explanation-card">
    <!-- Header -->
    <v-card-text class="pa-6">
      <div class="d-flex align-center mb-4">
        <v-avatar
          :color="isCorrect ? 'success' : 'error'"
          variant="flat"
          size="56"
          class="mr-4"
        >
          <v-icon size="32">
            {{ isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
        </v-avatar>
        
        <div>
          <h3 class="text-h5 font-weight-bold">
            {{ isCorrect ? 'Correct!' : 'Incorrect' }}
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ isCorrect ? 'Great job! You got it right.' : 'Don\'t worry, let\'s learn from this.' }}
          </p>
        </div>
      </div>

      <v-divider class="mb-4" />

      <!-- Your Answer vs Correct Answer -->
      <div class="answer-comparison mb-6">
        <div class="mb-4">
          <h4 class="text-subtitle-2 text-medium-emphasis mb-2">Your Answer{{ selectedAnswers.length > 1 ? 's' : '' }}:</h4>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="index in selectedAnswers"
              :key="`selected-${index}`"
              :color="correctAnswers.includes(index) ? 'success' : 'error'"
              variant="flat"
              size="small"
            >
              {{ getOptionLabel(index) }}: {{ options[index] }}
            </v-chip>
          </div>
        </div>
        
        <div v-if="!isCorrect">
          <h4 class="text-subtitle-2 text-medium-emphasis mb-2">Correct Answer{{ correctAnswers.length > 1 ? 's' : '' }}:</h4>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="index in correctAnswers"
              :key="`correct-${index}`"
              color="success"
              variant="flat"
              size="small"
            >
              {{ getOptionLabel(index) }}: {{ options[index] }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Explanation -->
      <v-card
        variant="tonal"
        :color="isCorrect ? 'success' : 'info'"
        class="mb-6"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-start">
            <v-icon class="mr-3 mt-1" size="20">mdi-lightbulb</v-icon>
            <div>
              <h4 class="text-subtitle-1 font-weight-semibold mb-2">Explanation</h4>
              <p class="text-body-2 mb-0" v-html="formattedExplanation"></p>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Additional Resources -->
      <div v-if="resources && resources.length > 0" class="resources-section">
        <h4 class="text-subtitle-1 font-weight-semibold mb-3">
          <v-icon size="20" class="mr-2">mdi-book-open-variant</v-icon>
          Learn More
        </h4>
        <v-list density="compact" class="pa-0">
          <v-list-item
            v-for="(resource, index) in resources"
            :key="`resource-${index}`"
            :href="resource.url"
            target="_blank"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-icon size="16" color="primary">mdi-link</v-icon>
            </template>
            <v-list-item-title class="text-body-2">
              {{ resource.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Performance Stats -->
      <v-divider class="my-4" />
      <div class="performance-stats">
        <v-row dense>
          <v-col cols="4" class="text-center">
            <div class="text-h6 font-weight-bold" :class="accuracyColor">
              {{ Math.round(accuracy) }}%
            </div>
            <div class="text-caption text-medium-emphasis">
              Session Accuracy
            </div>
          </v-col>
          <v-col cols="4" class="text-center">
            <div class="text-h6 font-weight-bold">
              {{ questionsAnswered }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Questions Done
            </div>
          </v-col>
          <v-col cols="4" class="text-center">
            <div class="text-h6 font-weight-bold">
              {{ timeSpent }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Time Spent
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-divider />
    <v-card-actions class="pa-6 pt-4">
      <v-btn
        variant="text"
        @click="$emit('report-issue')"
      >
        <v-icon start>mdi-flag</v-icon>
        Report Issue
      </v-btn>
      
      <v-spacer />
      
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        @click="$emit('continue')"
      >
        Continue
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Resource {
  title: string
  url: string
}

interface Props {
  isCorrect: boolean
  selectedAnswers: number[]
  correctAnswers: number[]
  options: string[]
  explanation: string
  resources?: Resource[]
  accuracy: number
  questionsAnswered: number
  timeSeconds: number
}

const props = withDefaults(defineProps<Props>(), {
  resources: () => []
})

const emit = defineEmits<{
  continue: []
  'report-issue': []
}>()

// Computed
const getOptionLabel = (index: number) => {
  return String.fromCharCode(65 + index)
}

const formattedExplanation = computed(() => {
  return props.explanation
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
})

const timeSpent = computed(() => {
  const minutes = Math.floor(props.timeSeconds / 60)
  const seconds = props.timeSeconds % 60
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
})

const accuracyColor = computed(() => {
  if (props.accuracy >= 80) return 'text-success'
  if (props.accuracy >= 60) return 'text-warning'
  return 'text-error'
})

// Keyboard shortcut for continue
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    emit('continue')
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
.explanation-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.answer-comparison {
  .v-chip {
    max-width: 100%;
    height: auto;
    white-space: normal;
    padding: 8px 12px;
  }
}

:deep(.inline-code) {
  padding: 2px 6px;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9em;
}

.resources-section {
  .v-list-item {
    min-height: 32px;
    
    &:hover {
      color: rgb(var(--v-theme-primary));
    }
  }
}

.performance-stats {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
  padding: 16px;
}
</style>