<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import ProgressOverviewCard from '@/components/progress/ProgressOverviewCard.vue'
import ProgressMetricCard from '@/components/progress/ProgressMetricCard.vue'
import ProgressAnalyticsChart from '@/components/progress/ProgressAnalyticsChart.vue'
import ExamPerformanceCard from '@/components/progress/ExamPerformanceCard.vue'
import ProgressActivityCalendar from '@/components/progress/ProgressActivityCalendar.vue'
import { Icon } from '@iconify/vue'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Breadcrumb
const page = ref({ title: 'Your Progress' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Progress Analytics',
    disabled: true,
    to: ''
  }
])

// State management
const selectedPeriod = ref('month')
const selectedExam = ref('')
const showGoalsDialog = ref(false)
const weeklyGoal = ref(300) // minutes

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
const saveGoals = async () => {
  try {
    await $fetch('/api/progress/goals', {
      method: 'POST',
      body: {
        weeklyGoal: weeklyGoal.value,
        monthlyGoal: weeklyGoal.value * 4
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
      name: 'Study Time (minutes)',
      data: last7Days.map(day => Math.round(day.studyTime / 60))
    }]
  }
})

const accuracyChartData = computed(() => {
  if (!analytics.value?.dailyStats) return { labels: [], datasets: [] }
  
  const last7Days = analytics.value.dailyStats.slice(-7)
  
  return {
    labels: last7Days.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      name: 'Accuracy %',
      data: last7Days.map(day => Math.round(day.accuracy)),
      color: 'rgba(var(--v-theme-success))'
    }]
  }
})

const questionsChartData = computed(() => {
  if (!analytics.value?.dailyStats) return { labels: [], datasets: [] }
  
  const last7Days = analytics.value.dailyStats.slice(-7)
  
  return {
    labels: last7Days.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      name: 'Questions Answered',
      data: last7Days.map(day => day.questionsAnswered),
      color: 'rgba(var(--v-theme-info))'
    }]
  }
})

// Loading state
const isLoading = computed(() => progressLoading.value || analyticsLoading.value || examPerformanceLoading.value)
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="0" class="bg-transparent">
          <v-card-text class="pa-0">
            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">Progress Analytics</h1>
                <p class="text-subtitle-1 text-grey100">
                  Track your learning journey and analyze your performance
                </p>
              </div>
              
              <div class="d-flex gap-2 mt-2 mt-sm-0">
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="showGoalsDialog = true"
                >
                  <Icon icon="solar:target-linear" class="mr-2" size="20" />
                  Set Goals
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 mt-4">Loading your analytics...</p>
    </div>

    <!-- Progress Content -->
    <div v-else>
      <!-- Filters -->
      <v-card class="mb-6" elevation="10">
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
                hide-details
              />
            </v-col>
            
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedExam"
                label="Filter by Exam"
                :items="[
                  { title: 'All Exams', value: '' },
                  ...exams.map(exam => ({ 
                    title: `${exam.examCode || exam.code} - ${exam.examName || exam.name}`, 
                    value: exam.id 
                  }))
                ]"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            
            <v-col cols="12" md="4" class="text-right">
              <v-chip-group>
                <v-chip
                  :color="analytics?.trends?.accuracy === 'increasing' ? 'success' : 
                         analytics?.trends?.accuracy === 'decreasing' ? 'error' : 'warning'"
                  variant="tonal"
                >
                  <Icon 
                    :icon="analytics?.trends?.accuracy === 'increasing' ? 'solar:arrow-up-linear' : 
                           analytics?.trends?.accuracy === 'decreasing' ? 'solar:arrow-down-linear' : 
                           'solar:arrow-right-linear'" 
                    class="mr-1" 
                    size="16" 
                  />
                  Accuracy {{ analytics?.trends?.accuracy || 'stable' }}
                </v-chip>
              </v-chip-group>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Streak Overview -->
      <v-row class="mb-6">
        <v-col cols="12">
          <ProgressOverviewCard
            :current-streak="progress?.streaks?.currentDaily || 0"
            :longest-streak="progress?.streaks?.longestDaily || 0"
            :correct-answers="progress?.streaks?.currentAnswer || 0"
            :total-questions="analytics?.overall?.totalAnswered || 0"
            :overall-accuracy="Math.round(progress?.overall?.averageAccuracy || 0)"
          />
        </v-col>
      </v-row>

      <!-- Key Metrics -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <ProgressMetricCard
            title="Study Time"
            :value="formatTime(analytics?.periodTotals?.totalStudyTime || 0)"
            :subtitle="`This ${selectedPeriod}`"
            icon="solar:clock-circle-bold"
            color="primary"
            :trend="{
              value: 12,
              direction: 'up'
            }"
            :sparkline-data="[30, 45, 50, 35, 40, 55, 60]"
          />
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <ProgressMetricCard
            title="Questions Answered"
            :value="formatNumber(analytics?.periodTotals?.totalQuestions || 0)"
            :subtitle="`This ${selectedPeriod}`"
            icon="solar:question-circle-bold"
            color="success"
            :trend="{
              value: 8,
              direction: 'up'
            }"
            :sparkline-data="[120, 180, 150, 200, 220, 240, 280]"
          />
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <ProgressMetricCard
            title="Average Accuracy"
            :value="`${Math.round(analytics?.periodTotals?.averageAccuracy || 0)}%`"
            :subtitle="`This ${selectedPeriod}`"
            icon="solar:target-bold"
            color="warning"
            :trend="{
              value: 5,
              direction: 'up'
            }"
            :sparkline-data="[75, 78, 80, 82, 85, 88, 90]"
          />
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <ProgressMetricCard
            title="Study Sessions"
            :value="analytics?.periodTotals?.totalSessions || 0"
            :subtitle="`This ${selectedPeriod}`"
            icon="solar:calendar-check-bold"
            color="info"
            :trend="{
              value: 3,
              direction: 'neutral'
            }"
            :sparkline-data="[2, 3, 3, 4, 3, 4, 5]"
          />
        </v-col>
      </v-row>

      <!-- Charts Section -->
      <v-row class="mb-6">
        <v-col cols="12" lg="4">
          <ProgressAnalyticsChart
            title="Study Time Trend"
            subtitle="Daily study time in minutes"
            chart-type="area"
            :data="studyTimeChartData"
            :height="300"
          />
        </v-col>
        
        <v-col cols="12" lg="4">
          <ProgressAnalyticsChart
            title="Accuracy Trend"
            subtitle="Daily accuracy percentage"
            chart-type="line"
            :data="accuracyChartData"
            :height="300"
          />
        </v-col>
        
        <v-col cols="12" lg="4">
          <ProgressAnalyticsChart
            title="Questions Activity"
            subtitle="Questions answered per day"
            chart-type="bar"
            :data="questionsChartData"
            :height="300"
          />
        </v-col>
      </v-row>

      <!-- Goals Progress -->
      <v-row v-if="progress?.weeklyProgress" class="mb-6">
        <v-col cols="12">
          <v-card elevation="10">
            <v-card-item>
              <div class="d-flex align-center">
                <Icon icon="solar:target-bold" class="mr-2" size="24" />
                <h5 class="text-h5 font-weight-semibold">Weekly Goal Progress</h5>
              </div>
            </v-card-item>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="8">
                  <div class="goal-progress">
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-subtitle-1">Current Progress</span>
                      <span class="text-subtitle-1 font-weight-bold">
                        {{ formatTime((progress.weeklyProgress.current || 0) * 60) }} / 
                        {{ formatTime((progress.weeklyProgress.goal || 0) * 60) }}
                      </span>
                    </div>
                    <v-progress-linear
                      :model-value="progress.weeklyProgress.percentage || 0"
                      :color="(progress.weeklyProgress.percentage || 0) >= 100 ? 'success' : 'primary'"
                      height="20"
                      rounded
                    >
                      <template #default="{ value }">
                        <span class="text-caption font-weight-bold">{{ Math.round(value) }}%</span>
                      </template>
                    </v-progress-linear>
                    
                    <div class="mt-3">
                      <v-chip
                        v-if="(progress.weeklyProgress.percentage || 0) >= 100"
                        color="success"
                        variant="tonal"
                        size="small"
                      >
                        <Icon icon="solar:check-circle-bold" size="16" class="mr-1" />
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
                </v-col>
                
                <v-col cols="12" md="4" class="d-flex align-center justify-center">
                  <div class="text-center">
                    <v-progress-circular
                      :model-value="progress.weeklyProgress.percentage || 0"
                      :size="140"
                      :width="12"
                      :color="(progress.weeklyProgress.percentage || 0) >= 100 ? 'success' : 'primary'"
                    >
                      <div>
                        <div class="text-h4 font-weight-bold">{{ Math.round(progress.weeklyProgress.percentage || 0) }}%</div>
                        <div class="text-caption">Complete</div>
                      </div>
                    </v-progress-circular>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Daily Activity Calendar -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="10">
            <v-card-item>
              <div class="d-flex align-center">
                <Icon icon="solar:calendar-mark-bold" class="mr-2" size="24" />
                <h5 class="text-h5 font-weight-semibold">Daily Activity</h5>
              </div>
            </v-card-item>
            <v-card-text>
              <ProgressActivityCalendar
                :daily-stats="analytics?.dailyStats || []"
                :period="selectedPeriod"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Exam Performance Analysis -->
      <v-card v-if="examPerformance?.examPerformance?.length > 0" class="mb-6" elevation="10">
        <v-card-item>
          <div class="d-flex align-center">
            <Icon icon="solar:graduation-cap-bold" class="mr-2" size="24" />
            <h5 class="text-h5 font-weight-semibold">Exam Performance Analysis</h5>
          </div>
        </v-card-item>
        
        <v-card-text>
          <!-- Overall Summary -->
          <v-row class="mb-6">
            <v-col cols="12" md="3">
              <v-card color="primary" variant="tonal" elevation="0">
                <v-card-text class="text-center pa-4">
                  <Icon icon="solar:book-2-bold" size="40" class="mb-2" />
                  <div class="text-h4 font-weight-bold">{{ examPerformance.overallStats.totalExams }}</div>
                  <div class="text-body-2">Exams Studied</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="3">
              <v-card color="success" variant="tonal" elevation="0">
                <v-card-text class="text-center pa-4">
                  <Icon icon="solar:target-bold" size="40" class="mb-2" />
                  <div class="text-h4 font-weight-bold">{{ Math.round(examPerformance.overallStats.averageAccuracy) }}%</div>
                  <div class="text-body-2">Overall Accuracy</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="3" v-if="examPerformance.overallStats.strongestExam">
              <v-card color="warning" variant="tonal" elevation="0">
                <v-card-text class="text-center pa-4">
                  <Icon icon="solar:trophy-bold" size="40" class="mb-2" />
                  <div class="text-h5 font-weight-bold">{{ examPerformance.overallStats.strongestExam.exam.code }}</div>
                  <div class="text-body-2">Strongest Exam</div>
                  <div class="text-caption">{{ Math.round(examPerformance.overallStats.strongestExam.statistics.accuracy) }}% accuracy</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="3" v-if="examPerformance.overallStats.weakestExam">
              <v-card color="error" variant="tonal" elevation="0">
                <v-card-text class="text-center pa-4">
                  <Icon icon="solar:chart-2-bold" size="40" class="mb-2" />
                  <div class="text-h5 font-weight-bold">{{ examPerformance.overallStats.weakestExam.exam.code }}</div>
                  <div class="text-body-2">Focus Area</div>
                  <div class="text-caption">{{ Math.round(examPerformance.overallStats.weakestExam.statistics.accuracy) }}% accuracy</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Individual Exam Performance -->
          <h3 class="text-h6 mb-4">Individual Exam Performance</h3>
          <v-row>
            <v-col 
              v-for="examData in examPerformance.examPerformance.slice(0, 6)" 
              :key="examData.exam.id"
              cols="12" 
              md="6" 
              lg="4"
            >
              <ExamPerformanceCard :exam-data="examData" />
            </v-col>
          </v-row>
          
          <div v-if="examPerformance.examPerformance.length > 6" class="text-center mt-4">
            <v-btn color="primary" variant="tonal" to="/exams">
              View All Exams
              <Icon icon="solar:arrow-right-linear" class="ml-2" size="18" />
            </v-btn>
          </div>
          </v-card-text>
        </v-card>
      </div>

    <!-- Goals Dialog -->
    <v-dialog v-model="showGoalsDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <Icon icon="solar:target-bold" class="mr-2" size="24" />
          Set Your Study Goals
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-grey100 mb-4">
            Set achievable goals to stay motivated and track your progress
          </p>
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
                persistent-hint
              >
                <template v-slot:append-inner>
                  <v-chip size="x-small" variant="tonal">
                    {{ formatTime(weeklyGoal * 60) }}
                  </v-chip>
                </template>
              </v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
              >
                <p class="text-caption mb-1">
                  <strong>Suggested goals based on your level:</strong>
                </p>
                <ul class="text-caption">
                  <li>Beginner: 2-4 hours/week (120-240 min)</li>
                  <li>Intermediate: 4-6 hours/week (240-360 min)</li>
                  <li>Advanced: 6-8 hours/week (360-480 min)</li>
                </ul>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showGoalsDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveGoals">Save Goals</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.goal-progress {
  max-width: 600px;
}
</style>