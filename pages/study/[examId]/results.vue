<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <!-- Results Card -->
        <v-card elevation="0" rounded="lg" class="results-card">
          <v-card-text class="pa-6">
            <!-- Header -->
            <div class="text-center mb-6">
              <v-avatar
                :color="overallScore >= 70 ? 'success' : 'warning'"
                variant="flat"
                size="100"
                class="mb-4"
              >
                <v-icon size="48">
                  {{ overallScore >= 70 ? 'mdi-check-decagram' : 'mdi-school' }}
                </v-icon>
              </v-avatar>
              
              <h1 class="text-h3 font-weight-bold mb-2">
                {{ overallScore >= 70 ? 'Great Job!' : 'Keep Practicing!' }}
              </h1>
              
              <p class="text-subtitle-1 text-medium-emphasis">
                You've completed your study session
              </p>
            </div>

            <!-- Score Circle -->
            <div class="text-center mb-6">
              <v-progress-circular
                :model-value="overallScore"
                :size="200"
                :width="20"
                :color="scoreColor"
                class="mb-4"
              >
                <div class="d-flex flex-column align-center">
                  <span class="text-h2 font-weight-bold">{{ Math.round(overallScore) }}%</span>
                  <span class="text-subtitle-1">Score</span>
                </div>
              </v-progress-circular>
            </div>

            <!-- Stats Grid -->
            <v-row class="mb-6">
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="primary" class="mb-2">mdi-help-circle</v-icon>
                  <div class="text-h5 font-weight-bold">{{ totalQuestions }}</div>
                  <div class="text-caption text-medium-emphasis">Questions</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="success" class="mb-2">mdi-check-circle</v-icon>
                  <div class="text-h5 font-weight-bold text-success">{{ correctAnswers }}</div>
                  <div class="text-caption text-medium-emphasis">Correct</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="error" class="mb-2">mdi-close-circle</v-icon>
                  <div class="text-h5 font-weight-bold text-error">{{ incorrectAnswers }}</div>
                  <div class="text-caption text-medium-emphasis">Incorrect</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="32" color="info" class="mb-2">mdi-clock-outline</v-icon>
                  <div class="text-h5 font-weight-bold">{{ formattedTime }}</div>
                  <div class="text-caption text-medium-emphasis">Time Spent</div>
                </div>
              </v-col>
            </v-row>

            <v-divider class="mb-6" />

            <!-- Performance Insights -->
            <div class="mb-6">
              <h3 class="text-h5 font-weight-bold mb-4">
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Performance Insights
              </h3>
              
              <v-list density="comfortable" class="pa-0">
                <v-list-item
                  v-for="insight in performanceInsights"
                  :key="insight.title"
                  class="px-0"
                >
                  <template v-slot:prepend>
                    <v-icon :color="insight.color">{{ insight.icon }}</v-icon>
                  </template>
                  <v-list-item-title>{{ insight.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ insight.description }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>

            <!-- Recommendations -->
            <v-card
              variant="tonal"
              color="primary"
              class="mb-6"
            >
              <v-card-text class="pa-4">
                <div class="d-flex align-start">
                  <v-icon class="mr-3">mdi-lightbulb</v-icon>
                  <div>
                    <h4 class="text-subtitle-1 font-weight-semibold mb-2">Next Steps</h4>
                    <p class="text-body-2 mb-0">{{ recommendation }}</p>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Action Buttons -->
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  variant="flat"
                  @click="continueStudying"
                >
                  <v-icon start>mdi-book-open-variant</v-icon>
                  Continue Studying
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="secondary"
                  size="large"
                  block
                  variant="flat"
                  @click="takeTest"
                >
                  <v-icon start>mdi-clipboard-text</v-icon>
                  Take Practice Test
                </v-btn>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-btn
                  size="large"
                  block
                  variant="outlined"
                  @click="viewProgress"
                >
                  <v-icon start>mdi-chart-box</v-icon>
                  View Progress
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { useStudyStore } from '~/stores/study'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string

// Store
const studyStore = useStudyStore()

// Get exam info
const { data: examData } = await useFetch(`/api/exams/${examId}`)
const exam = computed(() => examData.value?.data || null)

// Breadcrumb
const page = ref({ title: 'Study Results' })
const breadcrumbs = ref([
  {
    text: 'Dashboard',
    disabled: false,
    to: '/dashboard'
  },
  {
    text: 'Exams',
    disabled: false,
    to: '/exams'
  },
  {
    text: exam.value?.examCode || 'Study',
    disabled: false,
    to: `/exams/${examId}`
  },
  {
    text: 'Results',
    disabled: true,
    to: ''
  }
])

// Mock results data (replace with actual session data)
const sessionResults = ref({
  totalQuestions: 25,
  correctAnswers: 18,
  incorrectAnswers: 7,
  timeSpent: 1230, // seconds
  score: 72
})

// Computed
const totalQuestions = computed(() => sessionResults.value.totalQuestions)
const correctAnswers = computed(() => sessionResults.value.correctAnswers)
const incorrectAnswers = computed(() => sessionResults.value.incorrectAnswers)
const overallScore = computed(() => sessionResults.value.score)

const scoreColor = computed(() => {
  if (overallScore.value >= 80) return 'success'
  if (overallScore.value >= 60) return 'warning'
  return 'error'
})

const formattedTime = computed(() => {
  const seconds = sessionResults.value.timeSpent
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
})

const performanceInsights = computed(() => {
  const insights = []
  
  if (overallScore.value >= 80) {
    insights.push({
      icon: 'mdi-trophy',
      color: 'success',
      title: 'Excellent Performance',
      description: 'You\'re ready for the certification exam!'
    })
  } else if (overallScore.value >= 60) {
    insights.push({
      icon: 'mdi-trending-up',
      color: 'warning',
      title: 'Good Progress',
      description: 'You\'re on the right track. Keep practicing!'
    })
  } else {
    insights.push({
      icon: 'mdi-alert',
      color: 'error',
      title: 'Needs Improvement',
      description: 'Focus on weak areas and review study materials'
    })
  }
  
  const avgTimePerQuestion = sessionResults.value.timeSpent / totalQuestions.value
  if (avgTimePerQuestion < 30) {
    insights.push({
      icon: 'mdi-speedometer',
      color: 'info',
      title: 'Fast Response Time',
      description: 'You\'re answering quickly. Make sure to read carefully!'
    })
  } else if (avgTimePerQuestion > 90) {
    insights.push({
      icon: 'mdi-timer-sand',
      color: 'warning',
      title: 'Slow Response Time',
      description: 'Practice to improve your speed for the timed exam'
    })
  }
  
  return insights
})

const recommendation = computed(() => {
  if (overallScore.value >= 80) {
    return 'Great work! You\'re performing well. Consider taking a practice test to simulate real exam conditions.'
  } else if (overallScore.value >= 60) {
    return 'You\'re making good progress. Review the questions you got wrong and focus on those topics in your next study session.'
  } else {
    return 'Don\'t get discouraged! Review the study materials for the topics you struggled with and try again. Practice makes perfect!'
  }
})

// Actions
const continueStudying = () => {
  router.push(`/study/${examId}`)
}

const takeTest = () => {
  router.push(`/test/${examId}`)
}

const viewProgress = () => {
  router.push(`/progress/exams/${examId}`)
}

// SEO
useSeoMeta({
  title: `Study Results - ${exam.value?.examCode} | PingToPass`,
  description: `View your study session results for ${exam.value?.examName} certification exam.`
})
</script>

<style scoped>
.results-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}

.v-progress-circular {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}
</style>