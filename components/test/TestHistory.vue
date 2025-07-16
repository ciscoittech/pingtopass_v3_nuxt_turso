<template>
  <v-card elevation="0" rounded="lg">
    <v-card-text class="pa-6">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h3 class="text-h5 font-weight-bold mb-1">Test History</h3>
          <p class="text-subtitle-2 text-medium-emphasis">
            {{ examFilter ? `${examFilter} test results` : 'Your practice test results' }}
          </p>
        </div>
        
        <!-- Filters -->
        <div class="d-flex gap-2">
          <v-select
            v-if="examOptions.length > 1"
            v-model="selectedExam"
            :items="examOptions"
            label="Filter by Exam"
            variant="outlined"
            density="compact"
            style="min-width: 200px"
            clearable
          />
          
          <v-btn
            icon
            variant="text"
            @click="refresh"
            :loading="loading"
          >
            <v-icon>mdi-refresh</v-icon>
            <v-tooltip activator="parent">Refresh</v-tooltip>
          </v-btn>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && history.length === 0" class="text-center py-12">
        <v-progress-circular
          size="48"
          width="4"
          color="primary"
          indeterminate
          class="mb-4"
        />
        <p class="text-body-1">Loading test history...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && history.length === 0" class="text-center py-12">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-clipboard-text-clock-outline
        </v-icon>
        <h4 class="text-h6 mb-2">No Test History</h4>
        <p class="text-body-2 text-medium-emphasis mb-4">
          You haven't taken any practice tests yet.
        </p>
        <v-btn color="primary" variant="flat" to="/exams">
          <v-icon start>mdi-play</v-icon>
          Take Your First Test
        </v-btn>
      </div>

      <!-- History List -->
      <div v-else>
        <v-list class="pa-0">
          <v-list-item
            v-for="session in history"
            :key="session.id"
            class="history-item pa-4 mb-3"
            rounded="lg"
            @click="viewResults(session)"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getScoreColor(session.score, session.passingScore)"
                variant="tonal"
                size="48"
                class="mr-4"
              >
                <v-icon>
                  {{ session.passed ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-semibold mb-1">
              {{ session.examCode }} - {{ session.examName }}
            </v-list-item-title>
            
            <v-list-item-subtitle class="mb-2">
              {{ formatDate(session.startedAt) }}
            </v-list-item-subtitle>

            <!-- Test Summary -->
            <div class="d-flex flex-wrap gap-2 mb-2">
              <v-chip
                :color="getScoreColor(session.score, session.passingScore)"
                variant="tonal"
                size="small"
              >
                <v-icon start size="small">
                  {{ session.passed ? 'mdi-check' : 'mdi-close' }}
                </v-icon>
                {{ Math.round(session.score || 0) }}% 
                ({{ session.passed ? 'PASSED' : 'FAILED' }})
              </v-chip>
              
              <v-chip
                color="info"
                variant="tonal"
                size="small"
              >
                <v-icon start size="small">mdi-help-circle</v-icon>
                {{ session.correctCount }}/{{ session.totalQuestions }}
              </v-chip>
              
              <v-chip
                v-if="session.timeSpentSeconds"
                color="primary"
                variant="tonal"
                size="small"
              >
                <v-icon start size="small">mdi-clock</v-icon>
                {{ formatDuration(session.timeSpentSeconds) }}
              </v-chip>
            </div>

            <!-- Status Badge -->
            <div class="d-flex align-center gap-2">
              <v-chip
                :color="getStatusColor(session.status)"
                variant="outlined"
                size="x-small"
              >
                {{ session.status.toUpperCase() }}
              </v-chip>
              
              <v-spacer />
              
              <v-btn
                icon
                variant="text"
                size="small"
                @click.stop="viewResults(session)"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </v-list-item>
        </v-list>

        <!-- Load More Button -->
        <div v-if="hasMore" class="text-center mt-4">
          <v-btn
            color="primary"
            variant="outlined"
            :loading="loadingMore"
            @click="loadMore"
          >
            Load More Results
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface TestSession {
  id: string
  examId: string
  examCode: string
  examName: string
  status: string
  score: number | null
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  totalQuestions: number
  passingScore: number
  passed: boolean
  timeSpentSeconds: number | null
  startedAt: number
  submittedAt: number | null
  createdAt: number
}

interface Props {
  examId?: string
  examFilter?: string
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 10
})

const router = useRouter()

// State
const history = ref<TestSession[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)
const selectedExam = ref<string | null>(null)
const examOptions = ref<any[]>([])

// Watch for exam filter changes
watch(selectedExam, () => {
  refresh()
})

// Load test history
const loadHistory = async (page = 1, append = false) => {
  try {
    if (page === 1 && !append) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: props.limit.toString()
    })
    
    if (selectedExam.value) {
      params.set('examId', selectedExam.value)
    } else if (props.examId) {
      params.set('examId', props.examId)
    }

    const response = await $fetch(`/api/sessions/test/history?${params.toString()}`)
    
    if (response.success && response.data) {
      const { sessions, pagination } = response.data
      
      if (append) {
        history.value.push(...sessions)
      } else {
        history.value = sessions
        
        // Build exam filter options from history
        if (!props.examId) {
          const uniqueExams = new Map()
          sessions.forEach((session: TestSession) => {
            if (!uniqueExams.has(session.examId)) {
              uniqueExams.set(session.examId, {
                title: `${session.examCode} - ${session.examName}`,
                value: session.examId
              })
            }
          })
          examOptions.value = [
            { title: 'All Exams', value: null },
            ...Array.from(uniqueExams.values())
          ]
        }
      }
      
      currentPage.value = pagination.page
      hasMore.value = pagination.hasNext
    }
  } catch (error: any) {
    console.error('Failed to load test history:', error)
    
    // Show error notification
    useNotification().error('Failed to load test history')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Load more results
const loadMore = async () => {
  await loadHistory(currentPage.value + 1, true)
}

// Refresh history
const refresh = async () => {
  currentPage.value = 1
  await loadHistory(1, false)
}

// Helper functions
const getScoreColor = (score: number | null, passingScore: number) => {
  if (!score) return 'grey'
  if (score >= 90) return 'success'
  if (score >= passingScore) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    submitted: 'success',
    active: 'warning',
    expired: 'error',
    abandoned: 'grey'
  }
  return colors[status] || 'grey'
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const now = Date.now()
  const diff = now - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const viewResults = (session: TestSession) => {
  if (session.status === 'submitted') {
    router.push(`/test/${session.examId}/results?session=${session.id}`)
  }
}

// Initialize
onMounted(() => {
  loadHistory()
})
</script>

<style lang="scss" scoped>
.history-item {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border: 1px solid rgba(var(--v-border-color), 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}
</style>