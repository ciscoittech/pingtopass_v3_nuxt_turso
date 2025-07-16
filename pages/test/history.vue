<template>
  <div>
    <!-- Breadcrumb -->
    <BaseBreadcrumb
      :title="pageTitle"
      :breadcrumbs="breadcrumbs"
    />

    <v-container class="pa-0">
      <v-row>
        <v-col cols="12">
          <!-- Page Header -->
          <div class="d-flex align-center justify-space-between mb-6">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">Test History</h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Review your practice test results and track your progress
              </p>
            </div>
            
            <!-- Actions -->
            <div class="d-flex gap-3">
              <v-btn
                color="primary"
                variant="outlined"
                to="/exams"
              >
                <v-icon start>mdi-view-grid</v-icon>
                Browse Exams
              </v-btn>
              
              <v-btn
                color="primary"
                variant="flat"
                to="/test"
              >
                <v-icon start>mdi-play</v-icon>
                Take New Test
              </v-btn>
            </div>
          </div>

          <!-- Summary Stats -->
          <v-row class="mb-6">
            <v-col cols="12" sm="6" md="3">
              <v-card variant="tonal" color="primary">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" class="mb-2">mdi-clipboard-text</v-icon>
                  <div class="text-h5 font-weight-bold">{{ stats.totalTests }}</div>
                  <div class="text-caption">Total Tests</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card variant="tonal" color="success">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" class="mb-2">mdi-check-circle</v-icon>
                  <div class="text-h5 font-weight-bold">{{ stats.passedTests }}</div>
                  <div class="text-caption">Passed</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card variant="tonal" color="info">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" class="mb-2">mdi-percent</v-icon>
                  <div class="text-h5 font-weight-bold">{{ stats.averageScore }}%</div>
                  <div class="text-caption">Average Score</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card variant="tonal" color="warning">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" class="mb-2">mdi-clock</v-icon>
                  <div class="text-h5 font-weight-bold">{{ stats.totalTime }}</div>
                  <div class="text-caption">Study Time</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Test History Component -->
          <TestHistory />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import TestHistory from '@/components/test/TestHistory.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Page setup
const pageTitle = 'Test History'
const breadcrumbs = [
  { title: 'Dashboard', href: '/dashboards/pingtopass' },
  { title: 'Tests', href: '/test' },
  { title: 'History', href: '/test/history' }
]

// Stats
const stats = ref({
  totalTests: 0,
  passedTests: 0,
  averageScore: 0,
  totalTime: '0h'
})

// Load stats
const loadStats = async () => {
  try {
    const response = await $fetch('/api/sessions/test/history?limit=1000') // Get all for stats
    
    if (response.success && response.data) {
      const sessions = response.data.sessions
      
      // Calculate stats
      const totalTests = sessions.length
      const passedTests = sessions.filter((s: any) => s.passed).length
      const totalScore = sessions.reduce((sum: number, s: any) => sum + (s.score || 0), 0)
      const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0
      const totalSeconds = sessions.reduce((sum: number, s: any) => sum + (s.timeSpentSeconds || 0), 0)
      
      // Format total time
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      let totalTime = ''
      if (hours > 0) {
        totalTime = `${hours}h`
        if (minutes > 0) totalTime += ` ${minutes}m`
      } else if (minutes > 0) {
        totalTime = `${minutes}m`
      } else {
        totalTime = '0h'
      }
      
      stats.value = {
        totalTests,
        passedTests,
        averageScore,
        totalTime
      }
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// SEO
useSeoMeta({
  title: 'Test History | PingToPass',
  description: 'Review your practice test results, track your progress, and analyze your performance across different certification exams.'
})

// Load data
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>