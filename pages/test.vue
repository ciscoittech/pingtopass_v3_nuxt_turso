<template>
  <div class="test-overview-page">
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Quick Start Section -->
    <v-alert
      v-if="exams.length > 0"
      type="info"
      variant="tonal"
      prominent
      class="mb-6"
    >
      <v-alert-title class="text-h6">Ready to Test Your Knowledge?</v-alert-title>
      <div class="d-flex align-center justify-space-between flex-wrap mt-3">
        <div>
          <p class="mb-0">Select any exam below to start a practice test with real exam conditions.</p>
          <p class="text-caption mb-0 mt-1">Tests are timed and scored just like the real certification exams.</p>
        </div>
        <v-btn
          v-if="exams.length > 0"
          color="primary"
          variant="flat"
          size="large"
          class="mt-3 mt-sm-0"
          @click="startTest(exams[0].id)"
        >
          <v-icon start>mdi-play-circle</v-icon>
          Quick Start: {{ exams[0].code || exams[0].examCode }}
        </v-btn>
      </div>
    </v-alert>

    <!-- Test Performance Overview -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <TestStatCard
          title="Tests Completed"
          :value="testStats.totalTests"
          icon="mdi-clipboard-list"
          color="primary"
          :trend="12"
          subtitle="Last 30 days"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <TestStatCard
          title="Average Score"
          :value="Math.round(testStats.averageScore)"
          icon="mdi-chart-line"
          color="success"
          format="percent"
          :trend="5"
          subtitle="Improvement"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <TestStatCard
          title="Best Score"
          :value="testStats.bestScore"
          icon="mdi-trophy"
          color="info"
          format="percent"
          subtitle="Personal record"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <TestStatCard
          title="Pass Rate"
          :value="testStats.passRate"
          icon="mdi-check-decagram"
          color="warning"
          format="percent"
          :trend="-2"
          subtitle="70% required"
        />
      </v-col>
    </v-row>

    <!-- Recent Tests & Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" lg="8">
        <TestRecentCard :recent-tests="recentTests" />
      </v-col>
      <v-col cols="12" lg="4">
        <v-card elevation="0" rounded="lg" class="recommendations-card h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-lightbulb</v-icon>
            <span>Test Recommendations</span>
          </v-card-title>
          
          <v-divider />
          
          <v-card-text class="pa-0">
            <v-list lines="two" class="pa-0">
              <v-list-item
                v-if="recommendedExam"
                @click="startTest(recommendedExam.exam.id)"
                class="recommendation-item"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="flat" size="44">
                    <v-icon>mdi-star</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-semibold">
                  {{ recommendedExam.exam.code }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Ready for assessment • {{ recommendedExam.statistics.accuracy }}% accuracy
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon size="20">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
              
              <v-list-item
                v-if="retakeExam"
                @click="startTest(retakeExam.exam.id)"
                class="recommendation-item"
              >
                <template v-slot:prepend>
                  <v-avatar color="warning" variant="flat" size="44">
                    <v-icon>mdi-refresh</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-semibold">
                  Retake {{ retakeExam.exam.code }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Improve from {{ retakeExam.statistics.recentScores[0] }}%
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon size="20">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
              
              <v-list-item 
                @click="navigateTo('/exams')" 
                class="recommendation-item"
              >
                <template v-slot:prepend>
                  <v-avatar color="success" variant="flat" size="44">
                    <v-icon>mdi-plus-circle</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-semibold">
                  Explore New Exams
                </v-list-item-title>
                <v-list-item-subtitle>
                  Expand your certification portfolio
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon size="20">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Available Exams for Testing -->
    <v-card elevation="0" rounded="lg" class="available-tests-card">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-format-list-checks</v-icon>
          <span>Available Practice Tests</span>
        </div>
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          placeholder="Search exams..."
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          class="search-field mt-2 mt-sm-0"
        />
      </v-card-title>
      
      <v-divider />
      
      <v-card-text>
        <v-row v-if="filteredExams.length > 0">
          <v-col
            v-for="exam in filteredExams"
            :key="exam.id"
            cols="12"
            md="6"
            lg="4"
          >
            <TestExamCard
              :exam="exam"
              :user-stats="getExamStats(exam.id)"
              @start-test="startTest"
            />
          </v-col>
        </v-row>

        <!-- Empty State -->
        <div v-else class="empty-state text-center py-12">
          <v-icon size="80" color="grey-lighten-1" class="mb-4">
            mdi-file-document-remove
          </v-icon>
          <h3 class="text-h5 mb-2">No exams found</h3>
          <p class="text-body-1 text-medium-emphasis mb-4">
            Try adjusting your search criteria
          </p>
          <v-btn
            color="primary"
            variant="flat"
            @click="searchQuery = ''"
          >
            Clear Search
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import TestStatCard from '@/components/test/TestStatCard.vue'
import TestRecentCard from '@/components/test/TestRecentCard.vue'
import TestExamCard from '@/components/test/TestExamCard.vue'

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
const exams = computed(() => {
  const data = examData.value?.data
  // Handle both formats: direct array or nested object with exams array
  if (Array.isArray(data)) {
    return data
  } else if (data && Array.isArray(data.exams)) {
    return data.exams
  }
  return []
})

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
  // Map exams to expected format
  const mappedExams = exams.value.map((exam: any) => ({
    id: exam.id,
    examCode: exam.examCode || exam.code,
    examName: exam.examName || exam.name,
    vendorId: exam.vendorId,
    vendorName: exam.vendor?.name || exam.vendorName || 'Unknown Vendor',
    vendor: exam.vendor || { name: exam.vendorName || 'Unknown' },
    numberOfQuestions: exam.numberOfQuestions || exam.totalQuestions || exam.questionCount || 0,
    examDuration: exam.examDuration || exam.duration || 90,
    passingScore: exam.passingScore || 70
  }))
  
  if (!searchQuery.value) return mappedExams
  
  const query = searchQuery.value.toLowerCase()
  return mappedExams.filter((exam: any) => 
    exam.examCode?.toLowerCase().includes(query) ||
    exam.examName?.toLowerCase().includes(query) ||
    exam.vendorName?.toLowerCase().includes(query)
  )
})

// Get exam statistics
const getExamStats = (examId: string) => {
  const exam = examPerformance.value.find((e: any) => e.exam.id === examId)
  if (!exam || !exam.statistics?.testsTaken) return null
  
  const stats = exam.statistics
  const recentScores = stats.recentScores || []
  const avgScore = recentScores.length > 0 
    ? recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length
    : 0
  
  return {
    bestScore: stats.bestTestScore || 0,
    avgScore,
    attempts: stats.testsTaken || 0,
    lastAttempt: stats.lastActivity || 0
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
const startTest = async (examId: string) => {
  console.log('[Test Page] Starting test for exam:', examId)
  if (!examId) {
    console.error('[Test Page] No examId provided!')
    return
  }
  
  try {
    await navigateTo(`/test/${examId}`)
  } catch (error) {
    console.error('[Test Page] Navigation error:', error)
    // Fallback to router.push
    router.push(`/test/${examId}`)
  }
}
</script>

<style lang="scss" scoped>
.test-overview-page {
  .recommendations-card {
    background: linear-gradient(135deg, 
      rgba(var(--v-theme-surface), 1) 0%, 
      rgba(var(--v-theme-surface-variant), 0.3) 100%);
    
    .recommendation-item {
      border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: rgba(var(--v-theme-primary), 0.04);
        padding-left: 20px;
      }
    }
  }
  
  .available-tests-card {
    background: linear-gradient(135deg, 
      rgba(var(--v-theme-surface), 1) 0%, 
      rgba(var(--v-theme-surface-variant), 0.3) 100%);
    
    .search-field {
      max-width: 300px;
      
      @media (max-width: 960px) {
        max-width: 100%;
        width: 100%;
      }
    }
  }
  
  .empty-state {
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>