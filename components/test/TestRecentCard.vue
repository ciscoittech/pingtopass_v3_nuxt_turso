<template>
  <v-card
    elevation="0"
    rounded="lg"
    class="recent-tests-card"
  >
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-history</v-icon>
        <span>Recent Test Results</span>
      </div>
      <v-btn
        v-if="hasResults"
        variant="text"
        color="primary"
        size="small"
        :to="'/progress'"
      >
        View All
        <v-icon end size="16">mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-divider />
    
    <v-card-text class="pa-0">
      <perfect-scrollbar
        v-if="hasResults"
        class="test-list"
        :options="{ suppressScrollX: true }"
      >
        <v-list lines="three" class="pa-0">
          <v-list-item
            v-for="(test, index) in recentTests"
            :key="index"
            :to="`/test/${test.examId}/results`"
            class="test-item"
          >
            <template v-slot:prepend>
              <v-avatar :color="getScoreColor(test.score)" variant="flat" size="44">
                <span class="font-weight-bold">{{ test.score }}%</span>
              </v-avatar>
            </template>
            
            <v-list-item-title class="font-weight-semibold mb-1">
              {{ test.examCode }} - {{ test.examName }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <div class="d-flex align-center gap-3 text-caption">
                <span>
                  <v-icon size="14" start>mdi-help-circle</v-icon>
                  {{ test.questionsAnswered }}/{{ test.totalQuestions }}
                </span>
                <span>
                  <v-icon size="14" start>mdi-clock-outline</v-icon>
                  {{ formatDuration(test.duration) }}
                </span>
                <span>
                  <v-icon size="14" start>mdi-calendar</v-icon>
                  {{ formatRelativeTime(test.timestamp) }}
                </span>
              </div>
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-chip
                :color="test.passed ? 'success' : 'error'"
                variant="flat"
                size="small"
                class="font-weight-medium"
              >
                {{ test.passed ? 'PASSED' : 'FAILED' }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </perfect-scrollbar>
      
      <!-- Empty state -->
      <div v-else class="empty-state pa-8 text-center">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-clipboard-text-off
        </v-icon>
        <h4 class="text-h6 mb-2">No Test Results Yet</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Complete your first practice test to see results here
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface TestResult {
  examId: string
  examCode: string
  examName: string
  score: number
  passed: boolean
  questionsAnswered: number
  totalQuestions: number
  timestamp: number
  duration: number
}

interface Props {
  recentTests: TestResult[]
}

const props = defineProps<Props>()

const hasResults = computed(() => props.recentTests.length > 0)

// Helper functions
const formatRelativeTime = (timestamp: number) => {
  if (!timestamp) return 'Never'
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'info'
  if (score >= 50) return 'warning'
  return 'error'
}
</script>

<style lang="scss" scoped>
.recent-tests-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
  
  .test-list {
    max-height: 400px;
  }
  
  .test-item {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: rgba(var(--v-theme-primary), 0.04);
    }
  }
  
  .empty-state {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>