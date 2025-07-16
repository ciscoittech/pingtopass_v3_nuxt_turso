<template>
  <v-card elevation="0" rounded="lg" class="analytics-card">
    <v-card-text class="pa-6">
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-h6 font-weight-semibold">Study Analytics</h3>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="refreshAnalytics"
          :loading="loading"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !analytics" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- No Data State -->
      <div v-else-if="!analytics || analytics.totalSessions === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chart-box-outline</v-icon>
        <p class="text-body-1 text-medium-emphasis">No study sessions yet</p>
      </div>

      <!-- Analytics Content -->
      <div v-else>
        <!-- Overview Stats -->
        <v-row class="mb-6">
          <v-col cols="6" sm="3">
            <div class="stat-card">
              <v-icon color="primary" size="24" class="mb-2">mdi-book-open-variant</v-icon>
              <h4 class="text-h6 font-weight-bold">{{ analytics.totalSessions }}</h4>
              <p class="text-caption text-medium-emphasis mb-0">Sessions</p>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="stat-card">
              <v-icon color="info" size="24" class="mb-2">mdi-help-circle</v-icon>
              <h4 class="text-h6 font-weight-bold">{{ analytics.totalQuestionsAnswered }}</h4>
              <p class="text-caption text-medium-emphasis mb-0">Questions</p>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="stat-card">
              <v-icon :color="accuracyColor" size="24" class="mb-2">mdi-target</v-icon>
              <h4 class="text-h6 font-weight-bold">{{ analytics.overallAccuracy }}%</h4>
              <p class="text-caption text-medium-emphasis mb-0">Accuracy</p>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="stat-card">
              <v-icon color="warning" size="24" class="mb-2">mdi-clock-outline</v-icon>
              <h4 class="text-h6 font-weight-bold">{{ formattedTotalTime }}</h4>
              <p class="text-caption text-medium-emphasis mb-0">Time Spent</p>
            </div>
          </v-col>
        </v-row>

        <!-- Sessions by Mode -->
        <div v-if="Object.keys(analytics.sessionsByMode).length > 0" class="mb-6">
          <h4 class="text-subtitle-1 font-weight-semibold mb-3">Sessions by Mode</h4>
          <v-chip-group>
            <v-chip
              v-for="(count, mode) in analytics.sessionsByMode"
              :key="mode"
              variant="tonal"
              color="primary"
              size="small"
            >
              <v-icon start size="small">{{ getModeIcon(mode) }}</v-icon>
              {{ formatModeName(mode) }}: {{ count }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Recent Sessions -->
        <div v-if="analytics.recentSessions.length > 0" class="mb-6">
          <h4 class="text-subtitle-1 font-weight-semibold mb-3">Recent Sessions</h4>
          <v-list density="comfortable" class="rounded-lg">
            <v-list-item
              v-for="session in analytics.recentSessions"
              :key="session.id"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar :color="getSessionColor(session.accuracy)" size="32">
                  <span class="text-caption font-weight-bold">{{ session.accuracy }}%</span>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ formatModeName(session.mode) }} Mode
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ session.questionsAnswered }}/{{ session.totalQuestions }} questions • 
                {{ formatTime(session.timeSpentSeconds) }} • 
                {{ formatDate(session.startedAt) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- Weak Areas -->
        <div v-if="analytics.weakAreas && analytics.weakAreas.length > 0" class="mb-6">
          <h4 class="text-subtitle-1 font-weight-semibold mb-3">Areas for Improvement</h4>
          <v-alert
            type="warning"
            variant="tonal"
            density="comfortable"
          >
            <p class="text-body-2 mb-2">Focus on these topics to improve your scores:</p>
            <ul class="ml-4">
              <li v-for="area in analytics.weakAreas" :key="area.objectiveId">
                {{ area.objectiveId }} - {{ area.accuracy }}% accuracy
              </li>
            </ul>
          </v-alert>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  examId?: string
}

const props = defineProps<Props>()

// State
const loading = ref(false)
const analytics = ref<any>(null)

// Computed
const accuracyColor = computed(() => {
  if (!analytics.value) return 'grey'
  const accuracy = analytics.value.overallAccuracy
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'warning'
  return 'error'
})

const formattedTotalTime = computed(() => {
  if (!analytics.value) return '0m'
  const totalSeconds = analytics.value.totalTimeSpent
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

// Methods
const fetchAnalytics = async () => {
  loading.value = true
  try {
    const params = props.examId ? `?examId=${props.examId}` : ''
    const { data } = await $fetch(`/api/sessions/study/analytics${params}`)
    analytics.value = data
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    loading.value = false
  }
}

const refreshAnalytics = () => {
  fetchAnalytics()
}

const getModeIcon = (mode: string) => {
  const icons: Record<string, string> = {
    sequential: 'mdi-arrow-right',
    random: 'mdi-shuffle',
    flagged: 'mdi-flag',
    incorrect: 'mdi-close-circle',
    weak_areas: 'mdi-target',
    review: 'mdi-book-check'
  }
  return icons[mode] || 'mdi-help-circle'
}

const formatModeName = (mode: string) => {
  return mode.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getSessionColor = (accuracy: number) => {
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'warning'
  return 'error'
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Lifecycle
onMounted(() => {
  fetchAnalytics()
})
</script>

<style lang="scss" scoped>
.analytics-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}

.stat-card {
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(var(--v-theme-on-surface), 0.04);
  }
}
</style>