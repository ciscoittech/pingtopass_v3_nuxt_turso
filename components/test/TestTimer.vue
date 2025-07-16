<template>
  <v-card
    :color="timerColor"
    :variant="isTimeRunningOut ? 'flat' : 'tonal'"
    rounded="lg"
    class="timer-card"
    :class="{ 'timer-warning': isTimeRunningOut }"
  >
    <v-card-text class="pa-3 d-flex align-center justify-center">
      <v-icon
        :color="isTimeRunningOut ? 'white' : timerColor"
        :size="isCompact ? 20 : 24"
        class="mr-2"
      >
        {{ timerIcon }}
      </v-icon>
      
      <div class="timer-display">
        <h3
          class="text-h6 font-weight-bold mb-0"
          :class="{ 'text-white': isTimeRunningOut }"
        >
          {{ formattedTime }}
        </h3>
        <p
          v-if="!isCompact"
          class="text-caption mb-0"
          :class="{ 'text-white': isTimeRunningOut, 'text-medium-emphasis': !isTimeRunningOut }"
        >
          {{ timeLabel }}
        </p>
      </div>
      
      <!-- Pause/Resume Button -->
      <v-btn
        v-if="showPauseButton && !isCompact"
        icon
        variant="text"
        size="small"
        class="ml-2"
        @click="$emit('toggle-pause')"
      >
        <v-icon>{{ isPaused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ isPaused ? 'Resume' : 'Pause' }} Timer
        </v-tooltip>
      </v-btn>
    </v-card-text>
    
    <!-- Progress Bar -->
    <v-progress-linear
      v-if="showProgress"
      :model-value="progressPercentage"
      :color="progressColor"
      :height="2"
      :indeterminate="isPaused"
    />
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  remainingSeconds: number
  totalSeconds: number
  isRunning?: boolean
  isPaused?: boolean
  showPauseButton?: boolean
  showProgress?: boolean
  isCompact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRunning: true,
  isPaused: false,
  showPauseButton: false,
  showProgress: true,
  isCompact: false
})

const emit = defineEmits<{
  'toggle-pause': []
  'time-up': []
}>()

// Computed
const formattedTime = computed(() => {
  const hours = Math.floor(props.remainingSeconds / 3600)
  const minutes = Math.floor((props.remainingSeconds % 3600) / 60)
  const seconds = props.remainingSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const isTimeRunningOut = computed(() => {
  return props.remainingSeconds > 0 && props.remainingSeconds <= 300 // 5 minutes
})

const isTimeCritical = computed(() => {
  return props.remainingSeconds > 0 && props.remainingSeconds <= 60 // 1 minute
})

const timerColor = computed(() => {
  if (isTimeCritical.value) return 'error'
  if (isTimeRunningOut.value) return 'warning'
  return 'primary'
})

const timerIcon = computed(() => {
  if (props.isPaused) return 'mdi-pause-circle'
  if (isTimeCritical.value) return 'mdi-alarm'
  if (isTimeRunningOut.value) return 'mdi-clock-alert'
  return 'mdi-clock-outline'
})

const timeLabel = computed(() => {
  if (props.isPaused) return 'Paused'
  if (isTimeCritical.value) return 'Time is running out!'
  if (isTimeRunningOut.value) return 'Less than 5 minutes'
  
  const minutes = Math.floor(props.remainingSeconds / 60)
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`
})

const progressPercentage = computed(() => {
  if (props.totalSeconds === 0) return 100
  const elapsed = props.totalSeconds - props.remainingSeconds
  return Math.round((elapsed / props.totalSeconds) * 100)
})

const progressColor = computed(() => {
  if (isTimeCritical.value) return 'error'
  if (isTimeRunningOut.value) return 'warning'
  return 'success'
})

// Watch for time up
watch(() => props.remainingSeconds, (newVal, oldVal) => {
  if (oldVal > 0 && newVal === 0) {
    emit('time-up')
  }
})

// Add pulsing animation for critical time
const pulseAnimation = computed(() => {
  if (!isTimeCritical.value) return {}
  
  return {
    animation: 'pulse 1s ease-in-out infinite'
  }
})
</script>

<style lang="scss" scoped>
.timer-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.timer-warning {
    animation: timer-pulse 2s ease-in-out infinite;
  }
}

.timer-display {
  text-align: center;
}

@keyframes timer-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.9;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Compact mode styles
.timer-card.v-card--density-compact {
  .v-card__text {
    padding: 8px 12px !important;
  }
  
  .timer-display {
    .text-h6 {
      font-size: 1rem !important;
      line-height: 1.2;
    }
  }
}
</style>