<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

interface LastStudySession {
  examId: string
  examCode: string
  examName: string
  lastStudiedAt: string
  questionsAnswered: number
  accuracy: number
  progress: number
  mode: 'study' | 'test'
  todayQuestions?: number
  accuracyTrend?: number[]
}

// Fetch last study session data
const { data: lastSessionData, pending, refresh } = await useFetch('/api/progress/last-session', {
  server: false
})

const lastSession = computed(() => lastSessionData.value?.data as LastStudySession | null)

// Get stored last exam from localStorage as fallback
const localLastExam = ref<{ examId: string; examCode: string; examName: string } | null>(null)

onMounted(() => {
  const stored = localStorage.getItem('lastStudiedExam')
  if (stored) {
    try {
      localLastExam.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse stored exam data:', e)
    }
  }
})

// Time ago formatter
const timeAgo = computed(() => {
  if (!lastSession.value?.lastStudiedAt) return 'Never'
  
  const now = new Date()
  const lastStudy = new Date(lastSession.value.lastStudiedAt)
  const diffMs = now.getTime() - lastStudy.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return lastStudy.toLocaleDateString()
})

// Continue button action
const continueStudying = () => {
  if (lastSession.value) {
    navigateTo(`/study/${lastSession.value.examId}`)
  } else if (localLastExam.value) {
    navigateTo(`/study/${localLastExam.value.examId}`)
  }
}

// Determine if we have any session to show
const hasSession = computed(() => {
  return lastSession.value || localLastExam.value
})

// Get display data (from API or localStorage)
const displayData = computed(() => {
  if (lastSession.value) {
    return {
      examCode: lastSession.value.examCode,
      examName: lastSession.value.examName,
      progress: lastSession.value.progress,
      questionsAnswered: lastSession.value.questionsAnswered,
      accuracy: lastSession.value.accuracy,
      todayQuestions: lastSession.value.todayQuestions || 0,
      accuracyTrend: lastSession.value.accuracyTrend || [],
      showStats: true
    }
  } else if (localLastExam.value) {
    return {
      examCode: localLastExam.value.examCode,
      examName: localLastExam.value.examName,
      progress: 0,
      questionsAnswered: 0,
      accuracy: 0,
      todayQuestions: 0,
      accuracyTrend: [],
      showStats: false
    }
  }
  return null
})

// Generate sparkline path
const sparklinePath = computed(() => {
  if (!displayData.value?.accuracyTrend || displayData.value.accuracyTrend.length < 2) {
    return ''
  }
  
  const trend = displayData.value.accuracyTrend
  const width = 60
  const height = 20
  const points = trend.length
  const stepX = width / (points - 1)
  
  const path = trend.map((value, index) => {
    const x = index * stepX
    const y = height - (value / 100) * height
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  
  return path
})
</script>

<template>
  <v-card elevation="10" class="h-100 d-flex flex-column">
    <v-card-text class="pa-4 flex-grow-1 d-flex flex-column">
      <!-- Loading State -->
      <div v-if="pending" class="text-center py-4">
        <v-progress-circular indeterminate size="24" width="2" color="primary" />
      </div>
      
      <!-- Has Session -->
      <div v-else-if="hasSession && displayData">
        <div class="d-flex justify-space-between align-center mb-3">
          <div class="d-flex align-center">
            <Icon icon="solar:history-bold-duotone" size="20" class="text-primary mr-2" />
            <h6 class="text-h6 font-weight-semibold">Continue Studying</h6>
          </div>
          <v-chip color="primary" variant="tonal" size="x-small">
            {{ timeAgo }}
          </v-chip>
        </div>
        
        <!-- Exam Info -->
        <div class="mb-3">
          <h6 class="text-body-1 font-weight-medium mb-1">{{ displayData.examCode }}</h6>
          <p class="text-caption text-grey100 mb-2">{{ displayData.examName }}</p>
          
          <!-- Progress Bar -->
          <v-progress-linear
            :model-value="displayData.progress"
            color="primary"
            height="6"
            rounded
            class="mb-2"
          />
          <p class="text-caption text-grey100">{{ displayData.progress }}% complete</p>
        </div>
        
        <!-- Quick Stats (if available) -->
        <div v-if="displayData.showStats" class="d-flex justify-space-around mb-3">
          <div class="text-center">
            <p class="text-h6 font-weight-bold mb-0">{{ displayData.todayQuestions }}</p>
            <p class="text-caption text-grey100">Today</p>
          </div>
          <v-divider vertical />
          <div class="text-center">
            <p class="text-h6 font-weight-bold mb-0 text-success">{{ displayData.accuracy }}%</p>
            <p class="text-caption text-grey100">Accuracy</p>
          </div>
          <v-divider vertical />
          <div class="text-center">
            <!-- Mini Sparkline -->
            <div v-if="sparklinePath" class="d-flex align-center justify-center" style="height: 24px;">
              <svg width="60" height="20" class="accuracy-sparkline">
                <path 
                  :d="sparklinePath" 
                  fill="none" 
                  stroke="rgb(var(--v-theme-success))" 
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <p v-else class="text-h6 font-weight-bold mb-0">—</p>
            <p class="text-caption text-grey100">7d Trend</p>
          </div>
        </div>
        
        <!-- Continue Button -->
        <v-btn
          color="primary"
          variant="flat"
          block
          size="small"
          @click="continueStudying"
        >
          <Icon icon="solar:play-circle-bold" size="16" class="mr-1" />
          Continue Where You Left Off
        </v-btn>
      </div>
      
      <!-- No Session -->
      <div v-else class="text-center py-4">
        <Icon icon="solar:book-bookmark-minimalistic-linear" size="48" class="text-grey100 mb-3" />
        <h6 class="text-body-2 font-weight-medium mb-1">No Recent Study Session</h6>
        <p class="text-caption text-grey100 mb-3">Start studying to track your progress</p>
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          to="/exams"
        >
          <Icon icon="solar:book-open-linear" size="16" class="mr-1" />
          Browse Exams
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-divider--vertical {
  min-height: 40px;
  max-height: 40px;
}

.accuracy-sparkline {
  opacity: 0.8;
}
</style>