<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Test Performance Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card elevation="10" class="h-100">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">Tests Completed</p>
                <h4 class="text-h4 font-weight-bold">{{ testStats.totalTests }}</h4>
              </div>
              <v-avatar color="primary" variant="tonal" size="48">
                <Icon icon="solar:clipboard-list-bold-duotone" size="24" />
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
                <p class="text-body-2 text-medium-emphasis mb-1">Average Score</p>
                <h4 class="text-h4 font-weight-bold">{{ Math.round(testStats.averageScore) }}%</h4>
              </div>
              <v-avatar color="success" variant="tonal" size="48">
                <Icon icon="solar:chart-bold-duotone" size="24" />
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
                <p class="text-body-2 text-medium-emphasis mb-1">Best Score</p>
                <h4 class="text-h4 font-weight-bold">{{ testStats.bestScore }}%</h4>
              </div>
              <v-avatar color="info" variant="tonal" size="48">
                <Icon icon="solar:medal-star-bold-duotone" size="24" />
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
                <p class="text-body-2 text-medium-emphasis mb-1">Pass Rate</p>
                <h4 class="text-h4 font-weight-bold">{{ testStats.passRate }}%</h4>
              </div>
              <v-avatar color="warning" variant="tonal" size="48">
                <Icon icon="solar:verified-check-bold-duotone" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Tests & Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <UiParentCard title="Recent Test Results">
          <template #action>
            <v-btn variant="text" color="primary" size="small" :to="'/progress'">
              View All
              <Icon icon="solar:arrow-right-linear" class="ml-1" />
            </v-btn>
          </template>
          <v-list v-if="recentTests.length > 0" lines="two" class="pa-0">
            <v-list-item
              v-for="(test, index) in recentTests"
              :key="index"
              :to="`/test/${test.examId}/results`"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar :color="getScoreColor(test.score)" variant="tonal">
                  <Icon icon="solar:document-text-linear" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ test.examName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Score: {{ test.score }}% • {{ test.questionsAnswered }}/{{ test.totalQuestions }} questions • {{ formatRelativeTime(test.timestamp) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-right">
                  <v-chip
                    :color="test.passed ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                  >
                    {{ test.passed ? 'Passed' : 'Failed' }}
                  </v-chip>
                  <p class="text-caption text-medium-emphasis mt-1">{{ formatDuration(test.duration) }}</p>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8">
            <Icon icon="solar:clipboard-broken" size="48" class="mb-2 text-grey-lighten-1" />
            <p class="text-body-2 text-medium-emphasis">No test results yet</p>
          </div>
        </UiParentCard>
      </v-col>
      <v-col cols="12" md="4">
        <UiParentCard title="Test Recommendations">
          <v-list class="pa-0">
            <v-list-item
              v-if="recommendedExam"
              @click="startTest(recommendedExam.exam.id)"
              class="px-0 mb-2"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <Icon icon="solar:star-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ recommendedExam.exam.code }}</v-list-item-title>
              <v-list-item-subtitle>Ready for assessment</v-list-item-subtitle>
            </v-list-item>
            <v-list-item
              v-if="retakeExam"
              @click="startTest(retakeExam.exam.id)"
              class="px-0 mb-2"
            >
              <template v-slot:prepend>
                <v-avatar color="warning" variant="tonal">
                  <Icon icon="solar:refresh-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Retake {{ retakeExam.exam.code }}</v-list-item-title>
              <v-list-item-subtitle>Improve your score</v-list-item-subtitle>
            </v-list-item>
            <v-list-item @click="navigateTo('/exams')" class="px-0">
              <template v-slot:prepend>
                <v-avatar color="success" variant="tonal">
                  <Icon icon="solar:add-circle-bold" />
                </v-avatar>
              </template>
              <v-list-item-title>Explore New Exams</v-list-item-title>
              <v-list-item-subtitle>Expand your skills</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Available Exams for Testing -->
    <UiParentCard title="Available Practice Tests">
      <template #action>
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          placeholder="Search exams..."
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          style="max-width: 300px"
        />
      </template>

      <v-row v-if="filteredExams.length > 0">
        <v-col
          v-for="exam in filteredExams"
          :key="exam.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            variant="outlined"
            class="h-100 border cursor-pointer"
            hover
            @click="startTest(exam.id)"
          >
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="48">
                  <Icon icon="solar:document-text-bold-duotone" size="24" />
                </v-avatar>
              </template>
              <v-card-title class="font-weight-semibold">
                {{ exam.code }}
              </v-card-title>
              <v-card-subtitle>
                {{ exam.name }}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <!-- Exam Info -->
              <v-list density="compact" class="pa-0">
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <Icon icon="solar:question-circle-linear" class="mr-2" size="16" />
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ exam.numberOfQuestions }} questions
                  </v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <Icon icon="solar:clock-circle-linear" class="mr-2" size="16" />
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ exam.examDuration }} minutes
                  </v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template v-slot:prepend>
                    <Icon icon="solar:shield-check-linear" class="mr-2" size="16" />
                  </template>
                  <v-list-item-title class="text-body-2">
                    Pass: {{ exam.passingScore }}%
                  </v-list-item-title>
                </v-list-item>
              </v-list>

              <!-- User's Performance (if exists) -->
              <div v-if="getExamStats(exam.id)" class="mt-3">
                <v-divider class="mb-3" />
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2 text-medium-emphasis">Your Best</span>
                  <v-chip
                    :color="getScoreColor(getExamStats(exam.id)?.bestScore || 0)"
                    size="small"
                    variant="tonal"
                  >
                    {{ getExamStats(exam.id)?.bestScore || 0 }}%
                  </v-chip>
                </div>
                <div class="d-flex justify-space-between align-center mt-1">
                  <span class="text-body-2 text-medium-emphasis">Attempts</span>
                  <span class="text-body-2 font-weight-bold">{{ getExamStats(exam.id)?.attempts || 0 }}</span>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn
                color="primary"
                variant="tonal"
                block
              >
                Start Practice Test
                <Icon icon="solar:play-circle-linear" class="ml-1" />
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon icon="solar:document-text-broken" size="64" class="mb-4 text-grey-lighten-1" />
        <h5 class="text-h5 mb-2">No exams found</h5>
        <p class="text-body-1 text-grey100">
          Try adjusting your search criteria
        </p>
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
const page = ref({ title: 'Practice Tests' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Test Mode',
    disabled: true,
    to: ''
  }
])

// Search query
const searchQuery = ref('')

// Fetch exams
const { data: examData } = await useFetch('/api/exams')
const exams = computed(() => examData.value?.data || [])

// Fetch test performance data
const { data: performanceData } = await useFetch('/api/progress/exams', {
  query: {
    timeframe: 'all'
  }
})

const examPerformance = computed(() => performanceData.value?.data?.examPerformance || [])

// Calculate test statistics
const testStats = computed(() => {
  let totalTests = 0
  let totalScore = 0
  let bestScore = 0
  let passedTests = 0
  
  examPerformance.value.forEach((exam: any) => {
    const stats = exam.statistics
    if (stats?.testsTaken > 0) {
      totalTests += stats.testsTaken
      totalScore += stats.averageTestScore * stats.testsTaken
      bestScore = Math.max(bestScore, stats.bestTestScore)
      // Assuming 70% is passing
      passedTests += stats.recentScores?.filter((score: number) => score >= 70).length || 0
    }
  })
  
  return {
    totalTests,
    averageScore: totalTests > 0 ? totalScore / totalTests : 0,
    bestScore,
    passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  }
})

// Get recent test results
const recentTests = computed(() => {
  const tests: any[] = []
  
  examPerformance.value.forEach((exam: any) => {
    if (exam.statistics?.recentScores?.length > 0) {
      exam.statistics.recentScores.forEach((score: number, index: number) => {
        tests.push({
          examId: exam.exam.id,
          examName: exam.exam.name,
          examCode: exam.exam.code,
          score,
          passed: score >= 70,
          questionsAnswered: exam.statistics.totalQuestions,
          totalQuestions: exam.statistics.totalQuestions,
          timestamp: exam.statistics.lastActivity - (index * 86400), // Approximate
          duration: 3600 // Approximate 1 hour
        })
      })
    }
  })
  
  return tests.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
})

// Get exam recommendations
const recommendedExam = computed(() => {
  // Find exam with good study progress but few tests
  return examPerformance.value.find((exam: any) => 
    exam.statistics?.accuracy > 80 && 
    exam.statistics?.testsTaken < 2 &&
    exam.statistics?.totalQuestions > 50
  )
})

const retakeExam = computed(() => {
  // Find exam with recent low score that could be improved
  return examPerformance.value.find((exam: any) => {
    const recentScore = exam.statistics?.recentScores?.[0]
    return recentScore && recentScore < 70 && recentScore > 50
  })
})

// Filtered exams based on search
const filteredExams = computed(() => {
  if (!searchQuery.value) return exams.value
  
  const query = searchQuery.value.toLowerCase()
  return exams.value.filter((exam: any) => 
    exam.examCode?.toLowerCase().includes(query) ||
    exam.examName?.toLowerCase().includes(query) ||
    exam.vendorName?.toLowerCase().includes(query)
  )
})

// Get exam statistics
const getExamStats = (examId: string) => {
  const exam = examPerformance.value.find((e: any) => e.exam.id === examId)
  if (!exam || !exam.statistics?.testsTaken) return null
  
  return {
    bestScore: exam.statistics.bestTestScore,
    attempts: exam.statistics.testsTaken
  }
}

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

// Navigation
const startTest = (examId: string) => {
  router.push(`/test/${examId}`)
}
</script>