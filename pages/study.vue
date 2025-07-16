<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Quick Start Section -->
    <v-alert
      v-if="examsInProgress.length > 0 || allExams.length > 0"
      type="success"
      variant="tonal"
      prominent
      class="mb-6"
    >
      <v-alert-title class="text-h6">Ready to Study?</v-alert-title>
      <div class="d-flex align-center justify-space-between flex-wrap mt-3">
        <div>
          <p class="mb-0">Start studying with interactive questions and instant feedback.</p>
          <p class="text-caption mb-0 mt-1">Track your progress and master each topic at your own pace.</p>
        </div>
        <v-btn
          v-if="mostStudiedExam"
          color="success"
          variant="flat"
          size="large"
          class="mt-3 mt-sm-0"
          @click="startStudy(mostStudiedExam.exam.id)"
        >
          <v-icon start>mdi-play-circle</v-icon>
          Continue: {{ mostStudiedExam.exam.code }}
        </v-btn>
        <v-btn
          v-else-if="allExams.length > 0"
          color="success"
          variant="flat"
          size="large"
          class="mt-3 mt-sm-0"
          @click="startStudy(allExams[0].id)"
        >
          <v-icon start>mdi-play-circle</v-icon>
          Quick Start: {{ allExams[0].code || allExams[0].examCode }}
        </v-btn>
      </div>
    </v-alert>

    <!-- Study Stats Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Total Study Time</p>
                <h4 class="text-h4 font-weight-bold">{{ formatStudyTime(overallStats.totalStudyTime) }}</h4>
              </div>
              <v-avatar color="primary" variant="tonal" size="48">
                <Icon icon="solar:clock-circle-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Questions Practiced</p>
                <h4 class="text-h4 font-weight-bold">{{ overallStats.totalQuestions }}</h4>
              </div>
              <v-avatar color="success" variant="tonal" size="48">
                <Icon icon="solar:document-text-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Average Accuracy</p>
                <h4 class="text-h4 font-weight-bold">{{ Math.round(overallStats.averageAccuracy) }}%</h4>
              </div>
              <v-avatar color="info" variant="tonal" size="48">
                <Icon icon="solar:target-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Active Exams</p>
                <h4 class="text-h4 font-weight-bold">{{ overallStats.totalExams }}</h4>
              </div>
              <v-avatar color="warning" variant="tonal" size="48">
                <Icon icon="solar:book-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Study Sessions & Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <UiParentCard title="Recent Study Sessions">
          <template #action>
            <v-btn variant="text" color="primary" size="small" :to="'/progress'">
              View All
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </template>
          <v-list v-if="recentSessions.length > 0" lines="two" class="pa-0">
            <v-list-item
              v-for="(session, index) in recentSessions"
              :key="index"
              @click="resumeStudy(session.examId)"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:book-linear" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ session.examName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ session.questionsAnswered }} questions • {{ Math.round(session.accuracy) }}% accuracy • {{ formatRelativeTime(session.timestamp) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip
                  :color="getScoreColor(session.accuracy)"
                  size="small"
                  variant="tonal"
                >
                  {{ Math.round(session.accuracy) }}%
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8">
            <Icon icon="solar:document-text-broken" size="48" class="mb-2 text-grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis">No recent study sessions</p>
          </div>
        </UiParentCard>
      </v-col>
      <v-col cols="12" md="4">
        <UiParentCard title="Quick Actions">
          <v-list class="pa-0">
            <v-list-item
              v-if="mostStudiedExam"
              @click="startStudy(mostStudiedExam.exam.id)"
              class="px-0 mb-2"
            >
              <template v-slot:prepend>
                <v-avatar color="success" variant="tonal">
                  <Icon icon="solar:play-circle-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Continue {{ mostStudiedExam.exam.code }}</v-list-item-title>
              <v-list-item-subtitle>Most studied exam</v-list-item-subtitle>
            </v-list-item>
            <v-list-item
              v-if="weakestExam && weakestExam.exam.id !== mostStudiedExam?.exam.id"
              @click="startStudy(weakestExam.exam.id)"
              class="px-0 mb-2"
            >
              <template v-slot:prepend>
                <v-avatar color="warning" variant="tonal">
                  <Icon icon="solar:shield-warning-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Practice {{ weakestExam.exam.code }}</v-list-item-title>
              <v-list-item-subtitle>Needs improvement</v-list-item-subtitle>
            </v-list-item>
            <v-list-item @click="navigateTo('/exams')" class="px-0">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:add-circle-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Browse All Exams</v-list-item-title>
              <v-list-item-subtitle>Start a new exam</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Exam Progress Grid -->
    <UiParentCard title="Your Exam Progress">
      <template #action>
        <v-btn-toggle
          v-model="timeframe"
          density="compact"
          variant="outlined"
          divided
          mandatory
        >
          <v-btn value="week" size="small">Week</v-btn>
          <v-btn value="month" size="small">Month</v-btn>
          <v-btn value="all" size="small">All Time</v-btn>
        </v-btn-toggle>
      </template>

      <v-row v-if="examPerformance.length > 0">
        <v-col
          v-for="exam in examPerformance"
          :key="exam.exam.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            variant="outlined"
            class="h-100 border cursor-pointer"
            hover
            @click="startStudy(exam.exam.id)"
          >
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar
                  :color="getMasteryColor(exam.statistics.masteryLevel)"
                  variant="tonal"
                  size="48"
                >
                  <Icon icon="solar:graduation-cap-bold-duotone" size="24" />
                </v-avatar>
              </template>
              <v-card-title class="font-weight-semibold">
                {{ exam.exam.code }}
              </v-card-title>
              <v-card-subtitle>
                {{ exam.exam.name }}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <!-- Progress Bar -->
              <div class="mb-4">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">Accuracy</span>
                  <span class="text-body-2 font-weight-bold">{{ exam.statistics.accuracy }}%</span>
                </div>
                <v-progress-linear
                  :model-value="exam.statistics.accuracy"
                  :color="getScoreColor(exam.statistics.accuracy)"
                  height="8"
                  rounded
                />
              </div>

              <!-- Stats Grid -->
              <v-row dense>
                <v-col cols="6">
                  <div class="text-center">
                    <p class="text-h6 font-weight-bold mb-0">{{ exam.statistics?.totalQuestions || 0 }}</p>
                    <p class="text-body-2 text-medium-emphasis">Questions</p>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <p class="text-h6 font-weight-bold mb-0">{{ formatStudyTime(exam.statistics?.totalStudyTime || 0) }}</p>
                    <p class="text-body-2 text-medium-emphasis">Study Time</p>
                  </div>
                </v-col>
              </v-row>

              <!-- Bottom Info -->
              <div class="d-flex justify-space-between align-center mt-3">
                <v-chip
                  :color="getMasteryColor(exam.statistics.masteryLevel)"
                  size="small"
                  variant="tonal"
                >
                  {{ exam.statistics.masteryLevel }}
                </v-chip>
                <div class="d-flex align-center">
                  <Icon
                    :icon="getTrendIcon(exam.statistics.improvementTrend)"
                    :color="getTrendColor(exam.statistics.improvementTrend)"
                    class="mr-1"
                  />
                  <span class="text-body-2 text-medium-emphasis">
                    {{ formatRelativeTime(exam.statistics?.lastActivity || 0) }}
                  </span>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn
                color="primary"
                variant="tonal"
                block
              >
                Continue Studying
                <Icon icon="solar:arrow-right-linear" class="ml-1" />
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon icon="solar:book-broken" size="64" class="mb-4 text-grey-lighten-1" />
        <h5 class="text-h5 mb-2">No Study Progress Yet</h5>
        <p class="text-body-1 text-grey100 mb-4">
          Start studying to track your progress and improve your scores
        </p>
        <v-btn color="primary" variant="flat" :to="'/exams'">
          Browse Exams
          <Icon icon="solar:arrow-right-linear" class="ml-1" />
        </v-btn>
      </div>
    </UiParentCard>
  </div>
</template>

<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const router = useRouter()

// Breadcrumb
const page = ref({ title: 'Study Mode' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Study Mode',
    disabled: true,
    to: ''
  }
])

// Timeframe filter
const timeframe = ref('month')

// Fetch exam progress data
const { data: progressData, refresh: refreshProgress } = await useFetch('/api/progress/exams', {
  query: {
    timeframe
  }
})

// Fetch all exams for quick start
const { data: allExamsData } = await useFetch('/api/exams')
const allExams = computed(() => {
  const data = allExamsData.value?.data
  if (Array.isArray(data)) {
    return data
  } else if (data && Array.isArray(data.exams)) {
    return data.exams
  }
  return []
})

const examPerformance = computed(() => progressData.value?.data?.examPerformance || [])
const examsInProgress = computed(() => examPerformance.value.filter((exam: any) => exam.statistics?.totalQuestions > 0))
const overallStats = computed(() => progressData.value?.data?.overallStats || {
  totalExams: 0,
  totalStudyTime: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  averageAccuracy: 0
})

const mostStudiedExam = computed(() => (overallStats.value as any).mostStudiedExam)
const weakestExam = computed(() => (overallStats.value as any).weakestExam)

// Recent sessions (derived from exam performance)
const recentSessions = computed(() => {
  return examPerformance.value
    .filter((exam: any) => exam.statistics?.lastActivity > 0)
    .map((exam: any) => ({
      examId: exam.exam.id,
      examName: exam.exam.name,
      examCode: exam.exam.code,
      questionsAnswered: exam.statistics?.totalQuestions || 0,
      accuracy: exam.statistics?.accuracy || 0,
      timestamp: exam.statistics?.lastActivity || 0
    }))
    .slice(0, 5)
})

// Watch timeframe changes
watch(timeframe, () => {
  refreshProgress()
})

// Helper functions
const formatStudyTime = (seconds: number) => {
  if (!seconds) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

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

const getScoreColor = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'info'
  if (score >= 50) return 'warning'
  return 'error'
}

const getMasteryColor = (level: string) => {
  switch (level) {
    case 'expert': return 'success'
    case 'advanced': return 'info'
    case 'intermediate': return 'warning'
    default: return 'grey'
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving': return 'solar:arrow-up-linear'
    case 'declining': return 'solar:arrow-down-linear'
    default: return 'solar:minus-linear'
  }
}

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'improving': return 'success'
    case 'declining': return 'error'
    default: return 'grey'
  }
}

// Navigation functions
const startStudy = async (examId: string) => {
  console.log('[Study Page] Starting study for exam:', examId)
  if (!examId) {
    console.error('[Study Page] No examId provided!')
    return
  }
  
  try {
    await navigateTo(`/study/${examId}`)
  } catch (error) {
    console.error('[Study Page] Navigation error:', error)
    // Fallback to router.push
    router.push(`/study/${examId}`)
  }
}

const resumeStudy = async (examId: string) => {
  console.log('[Study Page] Resuming study for exam:', examId)
  if (!examId) {
    console.error('[Study Page] No examId provided!')
    return
  }
  
  try {
    await navigateTo(`/study/${examId}`)
  } catch (error) {
    console.error('[Study Page] Navigation error:', error)
    // Fallback to router.push
    router.push(`/study/${examId}`)
  }
}
</script>