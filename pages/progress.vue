<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Page metadata
definePageMeta({
  middleware: 'auth'
})

// State management
const selectedPeriod = ref('month')
const selectedExam = ref('')
const showGoalsDialog = ref(false)
const weeklyGoal = ref(0)
const monthlyGoal = ref(0)

// Data fetching
const { data: progressData, pending: progressLoading, refresh: refreshProgress } = await useFetch('/api/progress')
const progress = computed(() => progressData.value?.data)

const { data: analyticsData, pending: analyticsLoading, refresh: refreshAnalytics } = await useFetch('/api/progress/analytics', {
  query: computed(() => ({
    period: selectedPeriod.value,
    examId: selectedExam.value || undefined
  }))
})
const analytics = computed(() => analyticsData.value?.data)

const { data: examsData } = await useFetch('/api/exams')
const exams = computed(() => examsData.value?.data || [])

const { data: examPerformanceData, pending: examPerformanceLoading } = await useFetch('/api/progress/exams', {
  query: computed(() => ({ timeframe: selectedPeriod.value }))
})
const examPerformance = computed(() => examPerformanceData.value?.data)

// Watchers for reactive updates
watch([selectedPeriod, selectedExam], () => {
  refreshAnalytics()
})

// Helper functions
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return 'mdi-trending-up'
    case 'decreasing': return 'mdi-trending-down'
    default: return 'mdi-trending-neutral'
  }
}

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'increasing': return 'success'
    case 'decreasing': return 'error'
    default: return 'warning'
  }
}

const getStreakMessage = () => {
  const streak = progress.value?.streaks?.currentDaily || 0
  if (streak === 0) return 'Start your streak today!'
  if (streak === 1) return 'Day 1 of your learning journey!'
  if (streak < 7) return `${streak} days strong! Keep it up! 🔥`
  if (streak < 30) return `Amazing ${streak}-day streak! You're on fire! 🚀`
  return `Incredible ${streak}-day streak! You're unstoppable! ⭐`
}

const getMasteryColor = (level: string) => {
  switch (level) {
    case 'expert': return 'purple'
    case 'advanced': return 'success'
    case 'intermediate': return 'warning'
    default: return 'info'
  }
}

// Goals management
const loadGoals = () => {
  weeklyGoal.value = progress.value?.weeklyProgress?.goal || 0
  monthlyGoal.value = 0 // We'll add monthly goals later
}

const saveGoals = async () => {
  try {
    await $fetch('/api/progress/goals', {
      method: 'POST',
      body: {
        weeklyGoal: weeklyGoal.value,
        monthlyGoal: monthlyGoal.value
      }
    })
    
    showGoalsDialog.value = false
    await refreshProgress()
  } catch (error) {
    console.error('Failed to save goals:', error)
  }
}

// Chart data
const studyTimeChartData = computed(() => {
  if (!analytics.value?.dailyStats) return { labels: [], datasets: [] }
  
  const last7Days = analytics.value.dailyStats.slice(-7)
  
  return {
    labels: last7Days.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      label: 'Study Time (minutes)',
      data: last7Days.map(day => Math.round(day.studyTime / 60)),
      backgroundColor: 'rgba(25, 118, 210, 0.2)',
      borderColor: 'rgba(25, 118, 210, 1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  }
})

const accuracyChartData = computed(() => {
  if (!analytics.value?.dailyStats) return { labels: [], datasets: [] }
  
  const last7Days = analytics.value.dailyStats.slice(-7)
  
  return {
    labels: last7Days.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      label: 'Accuracy (%)',
      data: last7Days.map(day => Math.round(day.accuracy)),
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      borderColor: 'rgba(76, 175, 80, 1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  }
})

onMounted(() => {
  loadGoals()
})
</script>

<template>
  <div class="progress-page">
    <v-container>
      <!-- Header -->
      <div class="page-header mb-6">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">Your Progress</h1>
            <p class="text-body-1 text-grey-darken-1">
              Track your learning journey and analyze your performance
            </p>
          </div>
          
          <v-btn
            color="primary"
            @click="showGoalsDialog = true"
          >
            <v-icon start>mdi-target</v-icon>
            Set Goals
          </v-btn>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="progressLoading || analyticsLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 mt-4">Loading your analytics...</p>
      </div>

      <!-- Progress Content -->
      <div v-else>
        <!-- Filters -->
        <v-card class="mb-6" elevation="2">
          <v-card-text class="pa-4">
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedPeriod"
                  label="Time Period"
                  :items="[
                    { title: 'Last Week', value: 'week' },
                    { title: 'Last Month', value: 'month' },
                    { title: 'Last Quarter', value: 'quarter' },
                    { title: 'Last Year', value: 'year' }
                  ]"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedExam"
                  label="Filter by Exam"
                  :items="[
                    { title: 'All Exams', value: '' },
                    ...exams.map(exam => ({ title: `${exam.code} - ${exam.name}`, value: exam.id }))
                  ]"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              
              <v-col cols="12" md="4" class="text-right">
                <v-chip
                  :color="analytics?.trends?.accuracy === 'increasing' ? 'success' : 
                         analytics?.trends?.accuracy === 'decreasing' ? 'error' : 'warning'"
                  variant="tonal"
                  class="mr-2"
                >
                  <v-icon start>{{ getTrendIcon(analytics?.trends?.accuracy || 'stable') }}</v-icon>
                  Accuracy {{ analytics?.trends?.accuracy || 'stable' }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Streak Overview -->
        <v-card class="mb-6" color="primary" variant="tonal" elevation="4">
          <v-card-text class="pa-6">
            <v-row align="center">
              <v-col cols="12" md="8">
                <h2 class="text-h5 mb-3">{{ getStreakMessage() }}</h2>
                <div class="d-flex flex-wrap gap-4">
                  <div class="streak-stat">
                    <v-icon color="primary" size="24" class="mr-2">mdi-fire</v-icon>
                    <span class="text-h6">{{ progress?.streaks?.currentDaily || 0 }}</span>
                    <span class="text-body-2 ml-1">day streak</span>
                  </div>
                  
                  <div class="streak-stat">
                    <v-icon color="warning" size="24" class="mr-2">mdi-lightning-bolt</v-icon>
                    <span class="text-h6">{{ progress?.streaks?.currentAnswer || 0 }}</span>
                    <span class="text-body-2 ml-1">correct answers</span>
                  </div>
                  
                  <div class="streak-stat">
                    <v-icon color="success" size="24" class="mr-2">mdi-trophy</v-icon>
                    <span class="text-h6">{{ progress?.streaks?.longestDaily || 0 }}</span>
                    <span class="text-body-2 ml-1">best streak</span>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="4" class="text-center">
                <v-progress-circular
                  :model-value="Math.min((progress?.streaks?.currentDaily || 0) * 10, 100)"
                  :size="120"
                  :width="12"
                  color="primary"
                >
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold">{{ progress?.streaks?.currentDaily || 0 }}</div>
                    <div class="text-caption">Days</div>
                  </div>
                </v-progress-circular>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Key Metrics -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text class="pa-5 text-center">
                <v-icon size="48" color="primary" class="mb-3">mdi-clock-outline</v-icon>
                <h3 class="text-h4 font-weight-bold mb-2">{{ formatTime(analytics?.periodTotals?.totalStudyTime || 0) }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-1">Study Time</p>
                <p class="text-caption">This {{ selectedPeriod }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text class="pa-5 text-center">
                <v-icon size="48" color="success" class="mb-3">mdi-help-circle</v-icon>
                <h3 class="text-h4 font-weight-bold mb-2">{{ formatNumber(analytics?.periodTotals?.totalQuestions || 0) }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-1">Questions</p>
                <p class="text-caption">This {{ selectedPeriod }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text class="pa-5 text-center">
                <v-icon size="48" color="warning" class="mb-3">mdi-target</v-icon>
                <h3 class="text-h4 font-weight-bold mb-2">{{ Math.round(analytics?.periodTotals?.averageAccuracy || 0) }}%</h3>
                <p class="text-body-2 text-grey-darken-1 mb-1">Accuracy</p>
                <p class="text-caption">This {{ selectedPeriod }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="h-100">
              <v-card-text class="pa-5 text-center">
                <v-icon size="48" color="info" class="mb-3">mdi-calendar-check</v-icon>
                <h3 class="text-h4 font-weight-bold mb-2">{{ analytics?.periodTotals?.totalSessions || 0 }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-1">Sessions</p>
                <p class="text-caption">This {{ selectedPeriod }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Charts Section -->
        <v-row class="mb-6">
          <v-col cols="12" md="6">
            <v-card elevation="2" class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Study Time Trend
              </v-card-title>
              <v-card-text>
                <ProgressChart
                  :chart-data="studyTimeChartData"
                  type="line"
                  height="300"
                />
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-card elevation="2" class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-arc</v-icon>
                Accuracy Trend
              </v-card-title>
              <v-card-text>
                <ProgressChart
                  :chart-data="accuracyChartData"
                  type="line"
                  height="300"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Goals Progress -->
        <v-card v-if="progress?.weeklyProgress" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-target</v-icon>
            Weekly Goal Progress
          </v-card-title>
          <v-card-text>
            <div class="goal-progress">
              <div class="d-flex justify-space-between mb-2">
                <span>{{ formatTime((progress.weeklyProgress.current || 0) * 60) }}</span>
                <span>{{ formatTime((progress.weeklyProgress.goal || 0) * 60) }}</span>
              </div>
              <v-progress-linear
                :model-value="progress.weeklyProgress.percentage || 0"
                :color="(progress.weeklyProgress.percentage || 0) >= 100 ? 'success' : 'primary'"
                height="16"
                rounded
              >
                <template #default="{ value }">
                  <span class="text-white text-caption font-weight-bold">{{ Math.round(value) }}%</span>
                </template>
              </v-progress-linear>
              
              <div class="mt-3">
                <v-chip
                  v-if="(progress.weeklyProgress.percentage || 0) >= 100"
                  color="success"
                  variant="tonal"
                  size="small"
                >
                  <v-icon start size="16">mdi-check</v-icon>
                  Goal Achieved!
                </v-chip>
                <v-chip
                  v-else
                  :color="(progress.weeklyProgress.percentage || 0) >= 75 ? 'warning' : 'info'"
                  variant="tonal"
                  size="small"
                >
                  {{ formatTime(((progress.weeklyProgress.goal || 0) - (progress.weeklyProgress.current || 0)) * 60) }} remaining
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Daily Activity Calendar -->
        <v-card class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-calendar-month</v-icon>
            Daily Activity
          </v-card-title>
          <v-card-text>
            <ProgressActivityCalendar
              :daily-stats="analytics?.dailyStats || []"
              :period="selectedPeriod"
            />
          </v-card-text>
        </v-card>

        <!-- Exam Performance Analysis -->
        <v-card v-if="examPerformance?.examPerformance?.length > 0" class="mb-6" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-school</v-icon>
            Exam Performance Analysis
          </v-card-title>
          <v-card-text>
            <!-- Overall Summary -->
            <v-row class="mb-4">
              <v-col cols="12" md="3">
                <v-card color="primary" variant="tonal">
                  <v-card-text class="text-center pa-4">
                    <v-icon size="32" class="mb-2">mdi-book-multiple</v-icon>
                    <div class="text-h5 font-weight-bold">{{ examPerformance.overallStats.totalExams }}</div>
                    <div class="text-body-2">Exams Studied</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="3">
                <v-card color="success" variant="tonal">
                  <v-card-text class="text-center pa-4">
                    <v-icon size="32" class="mb-2">mdi-target</v-icon>
                    <div class="text-h5 font-weight-bold">{{ Math.round(examPerformance.overallStats.averageAccuracy) }}%</div>
                    <div class="text-body-2">Overall Accuracy</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="3" v-if="examPerformance.overallStats.strongestExam">
                <v-card color="warning" variant="tonal">
                  <v-card-text class="text-center pa-4">
                    <v-icon size="32" class="mb-2">mdi-trophy</v-icon>
                    <div class="text-h6 font-weight-bold">{{ examPerformance.overallStats.strongestExam.exam.code }}</div>
                    <div class="text-body-2">Strongest Exam</div>
                    <div class="text-caption">{{ Math.round(examPerformance.overallStats.strongestExam.statistics.accuracy) }}% accuracy</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="3" v-if="examPerformance.overallStats.weakestExam">
                <v-card color="error" variant="tonal">
                  <v-card-text class="text-center pa-4">
                    <v-icon size="32" class="mb-2">mdi-chart-line-variant</v-icon>
                    <div class="text-h6 font-weight-bold">{{ examPerformance.overallStats.weakestExam.exam.code }}</div>
                    <div class="text-body-2">Focus Area</div>
                    <div class="text-caption">{{ Math.round(examPerformance.overallStats.weakestExam.statistics.accuracy) }}% accuracy</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Individual Exam Performance -->
            <h3 class="text-h6 mb-3">Individual Exam Performance</h3>
            <v-row>
              <v-col 
                v-for="examData in examPerformance.examPerformance.slice(0, 6)" 
                :key="examData.exam.id"
                cols="12" 
                md="6" 
                lg="4"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div>
                        <h4 class="text-subtitle-1 font-weight-bold">{{ examData.exam.code }}</h4>
                        <p class="text-caption text-grey-darken-1 mb-0">{{ examData.exam.name }}</p>
                      </div>
                      
                      <v-chip
                        :color="getMasteryColor(examData.statistics.masteryLevel)"
                        size="small"
                        variant="tonal"
                      >
                        {{ examData.statistics.masteryLevel }}
                      </v-chip>
                    </div>

                    <div class="exam-stats">
                      <div class="stat-row">
                        <span class="text-body-2">Accuracy:</span>
                        <span class="font-weight-bold">{{ Math.round(examData.statistics.accuracy) }}%</span>
                      </div>
                      
                      <div class="stat-row">
                        <span class="text-body-2">Study Time:</span>
                        <span class="font-weight-bold">{{ formatTime(examData.statistics.totalStudyTime) }}</span>
                      </div>
                      
                      <div class="stat-row">
                        <span class="text-body-2">Questions:</span>
                        <span class="font-weight-bold">{{ formatNumber(examData.statistics.totalQuestions) }}</span>
                      </div>
                      
                      <div v-if="examData.statistics.testsTaken > 0" class="stat-row">
                        <span class="text-body-2">Best Score:</span>
                        <span class="font-weight-bold">{{ examData.statistics.bestTestScore }}%</span>
                      </div>
                    </div>

                    <div class="mt-3">
                      <div class="d-flex align-center justify-space-between mb-1">
                        <span class="text-caption">Progress</span>
                        <span class="text-caption">{{ Math.round(examData.statistics.accuracy) }}%</span>
                      </div>
                      <v-progress-linear
                        :model-value="examData.statistics.accuracy"
                        :color="getMasteryColor(examData.statistics.masteryLevel)"
                        height="6"
                        rounded
                      />
                    </div>

                    <!-- Improvement trend -->
                    <div v-if="examData.statistics.improvementTrend !== 'stable'" class="mt-2">
                      <v-chip
                        :color="examData.statistics.improvementTrend === 'improving' ? 'success' : 'warning'"
                        size="x-small"
                        variant="tonal"
                      >
                        <v-icon start size="12">
                          {{ examData.statistics.improvementTrend === 'improving' ? 'mdi-trending-up' : 'mdi-trending-down' }}
                        </v-icon>
                        {{ examData.statistics.improvementTrend }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- Goals Dialog -->
      <v-dialog v-model="showGoalsDialog" max-width="500px">
        <v-card>
          <v-card-title>Set Your Study Goals</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="weeklyGoal"
                  label="Weekly Goal (minutes)"
                  type="number"
                  min="0"
                  max="2520"
                  variant="outlined"
                  hint="Recommended: 120-480 minutes per week"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn text @click="showGoalsDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="saveGoals">Save Goals</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<style scoped>
.progress-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24px 0;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.streak-stat {
  display: flex;
  align-items: center;
}

.goal-progress {
  max-width: 600px;
}

.exam-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .progress-page {
    padding: 16px 0;
  }
  
  .page-header {
    padding: 16px;
    margin-bottom: 16px;
  }
}
</style>