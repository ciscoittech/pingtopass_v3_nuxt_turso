<template>
  <v-card elevation="0" rounded="lg" class="progress-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <!-- Session Info -->
        <div class="d-flex align-center">
          <v-avatar color="primary" variant="tonal" size="40" class="mr-3">
            <v-icon>mdi-book-open-variant</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-1 font-weight-semibold">Study Session</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ examName }}
            </p>
          </div>
        </div>

        <!-- Progress Stats -->
        <div class="d-flex align-center gap-3">
          <!-- Question Count -->
          <v-chip
            color="primary"
            variant="tonal"
            size="small"
          >
            <v-icon start size="small">mdi-help-circle</v-icon>
            {{ current }} / {{ total }}
          </v-chip>

          <!-- Correct Answers -->
          <v-chip
            color="success"
            variant="tonal"
            size="small"
          >
            <v-icon start size="small">mdi-check-circle</v-icon>
            {{ correct }}
          </v-chip>

          <!-- Incorrect Answers -->
          <v-chip
            color="error"
            variant="tonal"
            size="small"
          >
            <v-icon start size="small">mdi-close-circle</v-icon>
            {{ incorrect }}
          </v-chip>

          <!-- Accuracy -->
          <Transition name="fade" mode="out-in">
            <v-chip
              :key="`accuracy-${Math.round(accuracy)}`"
              :color="accuracyColor"
              variant="flat"
              size="small"
              class="accuracy-chip"
            >
              <v-icon start size="small">mdi-target</v-icon>
              {{ Math.round(accuracy) }}%
            </v-chip>
          </Transition>

          <!-- Time -->
          <v-chip
            variant="tonal"
            size="small"
          >
            <v-icon start size="small">mdi-clock-outline</v-icon>
            {{ formattedTime }}
          </v-chip>
        </div>

        <!-- Actions -->
        <div class="d-flex gap-2">
          <v-btn
            icon
            variant="text"
            size="small"
            @click="$emit('pause')"
          >
            <v-icon>mdi-pause</v-icon>
            <v-tooltip activator="parent" location="bottom">
              Pause Session
            </v-tooltip>
          </v-btn>
          
          <v-btn
            icon
            variant="text"
            size="small"
            @click="$emit('end')"
          >
            <v-icon>mdi-stop</v-icon>
            <v-tooltip activator="parent" location="bottom">
              End Session
            </v-tooltip>
          </v-btn>
        </div>
      </div>

      <!-- Progress Bar -->
      <v-progress-linear
        :model-value="progressPercentage"
        :color="progressColor"
        height="8"
        rounded
        class="mt-4 progress-bar-animated"
      >
        <template v-slot:default="{ value }">
          <span class="text-caption font-weight-bold">{{ Math.round(value) }}%</span>
        </template>
      </v-progress-linear>

      <!-- Session Mode -->
      <div class="d-flex align-center justify-space-between mt-3">
        <div class="text-caption text-medium-emphasis">
          <v-icon size="small" class="mr-1">{{ modeIcon }}</v-icon>
          {{ modeLabel }} Mode
        </div>
        
        <div class="text-caption text-medium-emphasis">
          {{ remaining }} questions remaining
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  examName: string
  current: number
  total: number
  correct: number
  incorrect: number
  timeSeconds: number
  mode: 'sequential' | 'random' | 'flagged' | 'incorrect' | 'weak_areas' | 'review'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  pause: []
  end: []
}>()

// Computed
const progressPercentage = computed(() => {
  if (props.total === 0) return 0
  return (props.current / props.total) * 100
})

const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage < 33) return 'primary'
  if (percentage < 66) return 'info'
  if (percentage < 90) return 'warning'
  return 'success'
})

const accuracy = computed(() => {
  const answered = props.correct + props.incorrect
  if (answered === 0) return 100
  return (props.correct / answered) * 100
})

const accuracyColor = computed(() => {
  if (accuracy.value >= 80) return 'success'
  if (accuracy.value >= 60) return 'warning'
  return 'error'
})

const remaining = computed(() => {
  return props.total - props.current
})

const formattedTime = computed(() => {
  const minutes = Math.floor(props.timeSeconds / 60)
  const seconds = props.timeSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const modeIcon = computed(() => {
  const icons = {
    sequential: 'mdi-arrow-right',
    random: 'mdi-shuffle',
    flagged: 'mdi-flag',
    incorrect: 'mdi-close-circle',
    weak_areas: 'mdi-target',
    review: 'mdi-book-check'
  }
  return icons[props.mode]
})

const modeLabel = computed(() => {
  return props.mode.charAt(0).toUpperCase() + props.mode.slice(1)
})

// Update time every second
const timeInterval = ref<NodeJS.Timeout>()

onMounted(() => {
  timeInterval.value = setInterval(() => {
    // Force reactivity update for time
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})
</script>

<style lang="scss" scoped>
.progress-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-primary), 0.02) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.progress-bar-animated {
  :deep(.v-progress-linear__determinate) {
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.accuracy-chip {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .d-flex {
    flex-direction: column;
    align-items: flex-start !important;
    
    &.gap-3 {
      gap: 0.5rem !important;
    }
  }
}
</style>