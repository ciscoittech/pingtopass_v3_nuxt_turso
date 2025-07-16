<template>
  <v-card elevation="0" rounded="lg" class="progress-card">
    <v-card-text class="pa-6">
      <!-- Circular Progress -->
      <div class="text-center mb-6">
        <v-progress-circular
          :model-value="progress.accuracy"
          :size="140"
          :width="14"
          :color="progressColor"
          class="progress-circle"
        >
          <div class="d-flex flex-column align-center">
            <span class="text-h3 font-weight-bold">{{ Math.round(progress.accuracy) }}%</span>
            <span class="text-caption text-medium-emphasis">Accuracy</span>
          </div>
        </v-progress-circular>
      </div>

      <!-- Mastery Badge -->
      <div class="text-center mb-6">
        <v-chip
          :color="masteryColor"
          variant="flat"
          size="large"
          class="font-weight-semibold"
        >
          <v-icon start>{{ masteryIcon }}</v-icon>
          {{ masteryLabel }}
        </v-chip>
      </div>

      <!-- Progress Stats -->
      <v-list class="transparent" density="comfortable">
        <v-list-item
          v-for="stat in stats"
          :key="stat.label"
          class="px-0 py-3"
        >
          <template v-slot:prepend>
            <v-avatar :color="stat.color" variant="tonal" size="44">
              <v-icon>{{ stat.icon }}</v-icon>
            </v-avatar>
          </template>
          
          <v-list-item-title class="font-weight-semibold text-h6">
            {{ stat.value }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ stat.label }}
          </v-list-item-subtitle>
          
          <template v-slot:append v-if="stat.trend">
            <v-chip
              :color="stat.trend > 0 ? 'success' : 'error'"
              variant="tonal"
              size="small"
            >
              <v-icon start size="small">
                {{ stat.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
              {{ Math.abs(stat.trend) }}%
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <!-- Action Buttons -->
      <div class="mt-6">
        <v-btn
          color="primary"
          size="large"
          block
          rounded="pill"
          @click="$emit('start-study')"
          class="mb-3"
        >
          <v-icon start>mdi-book-open-variant</v-icon>
          Continue Studying
        </v-btn>
        
        <v-btn
          :color="canTakeTest ? 'secondary' : 'default'"
          size="large"
          block
          rounded="pill"
          variant="tonal"
          :disabled="!canTakeTest"
          @click="$emit('start-test')"
        >
          <v-icon start>mdi-clipboard-text</v-icon>
          Take Practice Test
        </v-btn>
        
        <p v-if="!canTakeTest" class="text-caption text-center text-medium-emphasis mt-2">
          Study more questions before taking a test
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Progress {
  accuracy: number
  totalStudyTime: number
  totalQuestions: number
  totalCorrect: number
  studySessions: number
  testsTaken: number
  bestTestScore: number
  averageTestScore: number
  masteryLevel: string
  improvementTrend: string
  lastActivity: number
}

interface Props {
  progress: Progress
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'start-study': []
  'start-test': []
}>()

// Computed properties
const progressColor = computed(() => {
  const accuracy = props.progress.accuracy
  if (accuracy >= 90) return 'success'
  if (accuracy >= 70) return 'info'
  if (accuracy >= 50) return 'warning'
  return 'error'
})

const masteryColor = computed(() => {
  switch (props.progress.masteryLevel) {
    case 'expert': return 'success'
    case 'advanced': return 'info'
    case 'intermediate': return 'warning'
    default: return 'default'
  }
})

const masteryIcon = computed(() => {
  switch (props.progress.masteryLevel) {
    case 'expert': return 'mdi-crown'
    case 'advanced': return 'mdi-medal'
    case 'intermediate': return 'mdi-star'
    default: return 'mdi-school'
  }
})

const masteryLabel = computed(() => {
  return props.progress.masteryLevel.charAt(0).toUpperCase() + 
         props.progress.masteryLevel.slice(1) + ' Level'
})

const canTakeTest = computed(() => {
  return props.progress.totalQuestions >= 20
})

const formatTime = (seconds: number) => {
  if (!seconds) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const stats = computed(() => [
  {
    icon: 'mdi-clock-outline',
    label: 'Study Time',
    value: formatTime(props.progress.totalStudyTime),
    color: 'primary'
  },
  {
    icon: 'mdi-help-circle-outline',
    label: 'Questions Practiced',
    value: props.progress.totalQuestions.toLocaleString(),
    color: 'success'
  },
  {
    icon: 'mdi-clipboard-check-outline',
    label: 'Tests Completed',
    value: props.progress.testsTaken,
    color: 'info'
  },
  {
    icon: 'mdi-trophy-outline',
    label: 'Best Score',
    value: `${props.progress.bestTestScore}%`,
    color: 'warning',
    trend: props.progress.averageTestScore > 0 ? 
      props.progress.bestTestScore - props.progress.averageTestScore : 0
  }
])
</script>

<style lang="scss" scoped>
.progress-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}

.progress-circle {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.v-list-item {
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
  }
}
</style>