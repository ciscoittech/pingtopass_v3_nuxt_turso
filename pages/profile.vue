<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Profile Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card elevation="10" class="profile-header">
          <v-card-text class="pa-6">
            <v-row align="center">
              <v-col cols="12" md="8">
                <div class="d-flex align-center">
                  <v-avatar size="120" color="primary" class="mr-6 elevation-4">
                    <v-img v-if="user?.avatar" :src="user.avatar" />
                    <span v-else class="text-h2 font-weight-bold">{{ getInitials(user?.name) }}</span>
                  </v-avatar>
                  
                  <div>
                    <h1 class="text-h4 font-weight-bold mb-2">{{ user?.name || 'User' }}</h1>
                    <p class="text-body-1 text-grey100 mb-3">{{ user?.email }}</p>
                    
                    <div class="d-flex gap-2 flex-wrap">
                      <v-chip color="success" variant="tonal">
                        <Icon icon="solar:verified-check-bold" size="16" class="mr-1" />
                        Active Since {{ formatJoinDate(user?.createdAt) }}
                      </v-chip>
                      <v-chip color="primary" variant="tonal">
                        <Icon icon="solar:shield-star-bold" size="16" class="mr-1" />
                        Level {{ userLevel }}
                      </v-chip>
                      <v-chip color="warning" variant="tonal">
                        <Icon icon="solar:fire-bold" size="16" class="mr-1" />
                        {{ progress?.streaks?.currentDaily || 0 }} Day Streak
                      </v-chip>
                    </div>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="4" class="text-md-right">
                <v-btn color="primary" variant="flat" class="mb-2" block>
                  <Icon icon="solar:pen-2-linear" class="mr-2" />
                  Edit Profile
                </v-btn>
                <v-btn color="secondary" variant="tonal" to="/settings" block>
                  <Icon icon="solar:settings-linear" class="mr-2" />
                  Account Settings
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stats Overview -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="stat-card h-100">
          <v-card-text class="text-center">
            <v-avatar color="primary" variant="tonal" size="64" class="mb-3">
              <Icon icon="solar:book-2-bold-duotone" size="32" />
            </v-avatar>
            <h3 class="text-h4 font-weight-bold mb-1">{{ formatNumber(totalStudyHours) }}</h3>
            <p class="text-body-2 text-medium-emphasis">Study Hours</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="stat-card h-100">
          <v-card-text class="text-center">
            <v-avatar color="success" variant="tonal" size="64" class="mb-3">
              <Icon icon="solar:verified-check-bold-duotone" size="32" />
            </v-avatar>
            <h3 class="text-h4 font-weight-bold mb-1">{{ formatNumber(analytics?.overall?.totalAnswered || 0) }}</h3>
            <p class="text-body-2 text-medium-emphasis">Questions Answered</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="stat-card h-100">
          <v-card-text class="text-center">
            <v-avatar color="warning" variant="tonal" size="64" class="mb-3">
              <Icon icon="solar:target-bold-duotone" size="32" />
            </v-avatar>
            <h3 class="text-h4 font-weight-bold mb-1">{{ Math.round(progress?.overall?.averageAccuracy || 0) }}%</h3>
            <p class="text-body-2 text-medium-emphasis">Average Accuracy</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="10" class="stat-card h-100">
          <v-card-text class="text-center">
            <v-avatar color="info" variant="tonal" size="64" class="mb-3">
              <Icon icon="solar:medal-star-bold-duotone" size="32" />
            </v-avatar>
            <h3 class="text-h4 font-weight-bold mb-1">{{ totalAchievements }}</h3>
            <p class="text-body-2 text-medium-emphasis">Achievements</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Learning Progress -->
      <v-col cols="12" lg="8">
        <UiParentCard title="Learning Progress" class="mb-6">
          <template #action>
            <v-chip color="primary" variant="tonal" size="small">
              <Icon icon="solar:chart-line-duotone" class="mr-1" size="16" />
              Last 30 Days
            </v-chip>
          </template>
          
          <div v-if="analytics?.dailyStats?.length > 0">
            <ClientOnly>
              <LazyApexChart
                type="area"
                height="280"
                :options="chartOptions"
                :series="chartSeries"
              />
            </ClientOnly>
          </div>
          <div v-else class="text-center py-8">
            <Icon icon="solar:chart-square-broken" size="48" class="mb-4 text-grey-lighten-1" />
            <p class="text-body-1 text-grey100">No study data available yet</p>
          </div>
        </UiParentCard>

        <!-- Recent Achievements -->
        <UiParentCard title="Recent Achievements">
          <template #action>
            <v-btn variant="text" color="primary" size="small" to="/achievements">
              View All
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </template>
          
          <v-row v-if="recentAchievements.length > 0">
            <v-col
              v-for="achievement in recentAchievements"
              :key="achievement.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card variant="outlined" hover>
                <v-card-text class="text-center">
                  <v-avatar
                    size="60"
                    :color="achievement.color"
                    variant="tonal"
                    class="mb-3"
                  >
                    <Icon :icon="achievement.icon" size="30" />
                  </v-avatar>
                  <h6 class="text-h6">{{ achievement.title }}</h6>
                  <p class="text-caption text-medium-emphasis">{{ achievement.description }}</p>
                  <v-chip
                    :color="achievement.color"
                    size="x-small"
                    variant="tonal"
                    class="mt-2"
                  >
                    +{{ achievement.points }} XP
                  </v-chip>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <div v-else class="text-center py-8">
            <Icon icon="solar:medal-star-broken" size="48" class="mb-4 text-grey-lighten-1" />
            <p class="text-body-1 text-grey100">No achievements unlocked yet</p>
            <v-btn color="primary" variant="tonal" to="/study" class="mt-4">
              Start Learning
            </v-btn>
          </div>
        </UiParentCard>
      </v-col>

      <!-- Sidebar -->
      <v-col cols="12" lg="4">
        <!-- Study Goals -->
        <UiParentCard title="Study Goals" class="mb-6">
          <v-list lines="two" class="pa-0">
            <v-list-item class="px-0">
              <template #prepend>
                <v-progress-circular
                  :model-value="weeklyGoalProgress"
                  :size="48"
                  :width="4"
                  color="primary"
                >
                  <span class="text-caption font-weight-bold">{{ weeklyGoalProgress }}%</span>
                </v-progress-circular>
              </template>
              <v-list-item-title>Weekly Goal</v-list-item-title>
              <v-list-item-subtitle>
                {{ weeklyStudyMinutes }}/{{ weeklyGoalMinutes }} minutes
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-divider />
            
            <v-list-item class="px-0">
              <template #prepend>
                <v-avatar color="success" variant="tonal">
                  <Icon icon="solar:calendar-check-linear" />
                </v-avatar>
              </template>
              <v-list-item-title>Study Days This Month</v-list-item-title>
              <v-list-item-subtitle>{{ studyDaysThisMonth }} days</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>

        <!-- Favorite Exams -->
        <UiParentCard title="Favorite Exams">
          <v-list v-if="favoriteExams.length > 0" lines="two" class="pa-0">
            <v-list-item
              v-for="exam in favoriteExams"
              :key="exam.id"
              :to="`/study/${exam.id}`"
              class="px-0"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:book-bookmark-linear" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ exam.code }}</v-list-item-title>
              <v-list-item-subtitle>{{ exam.questionsAnswered }} questions • {{ exam.accuracy }}% accuracy</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-6">
            <Icon icon="solar:bookmark-broken" size="48" class="mb-2 text-grey-lighten-1" />
            <p class="text-body-2 text-grey100">No favorite exams yet</p>
          </div>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import UiParentCard from '@/components/shared/UiParentCard.vue'
import LazyApexChart from '@/components/charts/LazyApexChart.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Breadcrumb
const page = ref({ title: 'Profile' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Profile',
    disabled: true,
    to: ''
  }
])

// Get user data
const { data: userData } = await useFetch('/api/auth/me')
const user = userData.value?.user

// Get user progress
const { data: progressData } = await useFetch('/api/progress')
const progress = computed(() => progressData.value?.data)

// Get analytics
const { data: analyticsData } = await useFetch('/api/progress/analytics', {
  query: { period: 'month' }
})
const analytics = computed(() => analyticsData.value?.data)

// Mock data for demonstration
const userLevel = ref(12)
const totalAchievements = ref(24)
const weeklyGoalMinutes = ref(300)
const weeklyStudyMinutes = ref(180)
const studyDaysThisMonth = ref(15)

// Computed properties
const totalStudyHours = computed(() => {
  const minutes = (progress.value?.overall?.totalStudyTime || 0) / 60
  return Math.round(minutes / 60)
})

const weeklyGoalProgress = computed(() => {
  return Math.round((weeklyStudyMinutes.value / weeklyGoalMinutes.value) * 100)
})

// Mock achievements
const recentAchievements = ref([
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first study session',
    icon: 'solar:square-academic-cap-bold-duotone',
    color: 'primary',
    points: 50
  },
  {
    id: '2',
    title: 'Week Warrior',
    description: '7-day study streak',
    icon: 'solar:fire-bold-duotone',
    color: 'warning',
    points: 100
  },
  {
    id: '3',
    title: 'Quiz Master',
    description: 'Score 100% on a quiz',
    icon: 'solar:cup-star-bold-duotone',
    color: 'success',
    points: 75
  }
])

// Mock favorite exams
const favoriteExams = ref([
  {
    id: '1',
    code: 'AWS-SAA',
    name: 'AWS Solutions Architect',
    questionsAnswered: 245,
    accuracy: 87
  },
  {
    id: '2',
    code: 'AZ-900',
    name: 'Azure Fundamentals',
    questionsAnswered: 180,
    accuracy: 92
  },
  {
    id: '3',
    code: 'CompTIA A+',
    name: 'CompTIA A+ Core 1',
    questionsAnswered: 120,
    accuracy: 78
  }
])

// Chart configuration
const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    fontFamily: 'inherit',
    foreColor: '#adb0bb',
    toolbar: {
      show: false
    },
    sparkline: {
      enabled: false
    }
  },
  colors: ['rgba(var(--v-theme-primary))', 'rgba(var(--v-theme-success))'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.4,
      inverseColors: false,
      opacityFrom: 0.8,
      opacityTo: 0.2,
      stops: [0, 100]
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  xaxis: {
    categories: getLast30Days(),
    labels: {
      style: {
        colors: 'rgba(var(--v-theme-grey100))'
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: 'rgba(var(--v-theme-grey100))'
      }
    }
  },
  grid: {
    borderColor: 'rgba(var(--v-theme-borderColor))',
    strokeDashArray: 3
  },
  tooltip: {
    theme: 'dark'
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right'
  }
}))

const chartSeries = computed(() => {
  const dailyData = analytics.value?.dailyStats?.slice(-30) || []
  return [
    {
      name: 'Study Time (min)',
      data: dailyData.map((d: any) => Math.round(d.studyTime / 60))
    },
    {
      name: 'Questions',
      data: dailyData.map((d: any) => d.questionsAnswered)
    }
  ]
})

// Helper functions
const getInitials = (name?: string) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatJoinDate = (timestamp?: number) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  })
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const getLast30Days = () => {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return days
}
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-secondary), 0.1) 100%);
}

.stat-card {
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-4px);
}
</style>