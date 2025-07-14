<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// Get user data
const { data: userData } = await useFetch('/api/auth/me');
const user = userData.value?.user;

// Get user progress data
const { data: progressData, pending: progressLoading, refresh: refreshProgress } = await useFetch('/api/progress')
const progress = computed(() => progressData.value?.data)

// Get analytics data
const { data: analyticsData, pending: analyticsLoading } = await useFetch('/api/progress/analytics', {
  query: { period: 'month' }
})
const analytics = computed(() => analyticsData.value?.data)

// Format time helper
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Format number helper
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

// Get streak message
const getStreakMessage = () => {
  const streak = progress.value?.streaks?.currentDaily || 0
  if (streak === 0) return 'Start your study streak today!'
  if (streak === 1) return 'Great start! Keep it going.'
  if (streak < 7) return `${streak} days strong! 🔥`
  if (streak < 30) return `Amazing ${streak}-day streak! 🚀`
  return `Incredible ${streak}-day streak! You're unstoppable! ⭐`
}
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">
          Welcome back, {{ user?.fullName || 'Student' }}!
        </h1>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-if="progressLoading || analyticsLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 mt-4">Loading your progress...</p>
    </div>

    <!-- Progress Overview -->
    <v-row v-else>
      <!-- Study Streak -->
      <v-col cols="12">
        <v-card color="primary" variant="tonal" class="mb-4">
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <h2 class="text-h5 mb-2">{{ getStreakMessage() }}</h2>
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-fire</v-icon>
                  <span class="text-h6">{{ progress?.streaks?.currentDaily || 0 }} day streak</span>
                  <v-chip 
                    v-if="(progress?.streaks?.currentDaily || 0) > 0"
                    color="warning" 
                    variant="tonal" 
                    size="small" 
                    class="ml-3"
                  >
                    Best: {{ progress?.streaks?.longestDaily || 0 }} days
                  </v-chip>
                </div>
              </div>
              <v-icon size="80" color="primary" class="opacity-20">mdi-trophy</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Stats -->
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="2">
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">{{ formatNumber(progress?.overall?.totalSessions || 0) }}</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Study Sessions</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="primary">mdi-book-open-variant</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="2">
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">{{ formatNumber(analytics?.periodTotals?.totalQuestions || 0) }}</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Questions This Month</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="success">mdi-help-circle-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="2">
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">{{ Math.round(analytics?.periodTotals?.averageAccuracy || 0) }}%</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Accuracy This Month</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="warning">mdi-chart-line</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card elevation="2">
          <v-card-text class="pa-5">
            <div class="d-flex align-center">
              <div>
                <h3 class="text-h3 font-weight-bold">{{ formatTime(progress?.overall?.totalStudyTime || 0) }}</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mb-0">Total Study Time</p>
              </div>
              <v-spacer />
              <v-icon size="40" color="info">mdi-clock-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Weekly Goals -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-target</v-icon>
            Weekly Goal
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span>{{ formatTime((progress?.weeklyProgress?.current || 0) * 60) }}</span>
                <span>{{ formatTime((progress?.weeklyProgress?.goal || 0) * 60) }}</span>
              </div>
              <v-progress-linear
                :model-value="progress?.weeklyProgress?.percentage || 0"
                color="primary"
                height="12"
                rounded
              />
              <p class="text-caption text-center mt-2">
                {{ Math.round(progress?.weeklyProgress?.percentage || 0) }}% complete
              </p>
            </div>
            
            <v-btn 
              color="primary" 
              variant="outlined" 
              size="small"
              @click="$router.push('/progress')"
            >
              <v-icon start>mdi-chart-timeline-variant</v-icon>
              View Progress
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-lightning-bolt</v-icon>
            Quick Actions
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <v-btn
                  to="/exams"
                  color="primary"
                  variant="elevated"
                  size="large"
                  block
                >
                  <v-icon start>mdi-school</v-icon>
                  Browse Exams
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6">
                <v-btn
                  to="/study"
                  color="success"
                  variant="elevated"
                  size="large"
                  block
                >
                  <v-icon start>mdi-book-open-page-variant</v-icon>
                  Study Now
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-history</v-icon>
              Recent Activity
            </div>
            <v-btn
              variant="text"
              size="small"
              @click="$router.push('/progress')"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="progress?.recentActivity?.length > 0">
              <v-timeline side="end" density="compact">
                <v-timeline-item
                  v-for="(activity, index) in progress.recentActivity.slice(0, 5)"
                  :key="index"
                  :dot-color="activity.activityType === 'test_completed' ? 'success' : 'primary'"
                  size="small"
                >
                  <template #icon>
                    <v-icon size="14">
                      {{ activity.activityType === 'test_completed' ? 'mdi-clipboard-check' : 'mdi-book-open-variant' }}
                    </v-icon>
                  </template>
                  
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <p class="mb-1 font-weight-medium">
                        {{ activity.activityType === 'test_completed' ? 'Completed Test' : 'Study Session' }}
                      </p>
                      <p class="text-caption text-grey-darken-1 mb-1">
                        {{ activity.questionsAnswered }} questions • 
                        {{ Math.round((activity.correctAnswers / activity.questionsAnswered) * 100) }}% accuracy
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-caption text-grey-darken-1">
                        {{ new Date(activity.timestamp * 1000).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </div>
            
            <v-alert v-else type="info" variant="tonal" class="mb-0">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-information</v-icon>
                <div>
                  <div class="font-weight-bold">No recent activity</div>
                  <div class="text-body-2">Start studying to track your progress and build your learning streak!</div>
                </div>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>