<template>
  <div>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" lg="10" xl="8">
          <!-- Loading State -->
          <v-card v-if="loading" elevation="0" rounded="lg" class="text-center pa-12">
            <v-progress-circular
              size="64"
              width="6"
              color="primary"
              indeterminate
              class="mb-4"
            />
            <h3 class="text-h5 font-weight-medium">Loading your test results...</h3>
          </v-card>

          <!-- Error State -->
          <v-card v-else-if="error" elevation="0" rounded="lg" class="text-center pa-12">
            <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
            <h3 class="text-h5 font-weight-medium mb-4">{{ error }}</h3>
            <v-btn color="primary" @click="$router.push('/exams')">
              View All Exams
            </v-btn>
          </v-card>

          <!-- Results Card -->
          <v-card v-else elevation="0" rounded="lg" class="results-card">
            <v-card-text class="pa-6">
              <!-- Header -->
              <div class="text-center mb-6">
                <v-avatar
                  :color="scoreColor"
                  variant="flat"
                  size="120"
                  class="mb-4"
                >
                  <v-icon size="64">
                    {{ score >= passingScore ? 'mdi-check-decagram' : 'mdi-alert-decagram' }}
                  </v-icon>
                </v-avatar>
                
                <h1 class="text-h2 font-weight-bold mb-2">
                  {{ score >= passingScore ? 'Congratulations!' : 'Keep Practicing!' }}
                </h1>
                
                <p class="text-h5 text-medium-emphasis">
                  {{ score >= passingScore ? 'You passed the practice test!' : 'You didn\'t pass this time.' }}
                </p>
              </div>

              <!-- Score Display -->
              <div class="text-center mb-8">
                <div class="score-display mb-4">
                  <span class="text-h1 font-weight-bold">{{ Math.round(score) }}</span>
                  <span class="text-h3 text-medium-emphasis">%</span>
                </div>
                
                <v-progress-linear
                  :model-value="score"
                  :color="scoreColor"
                  height="20"
                  rounded
                  class="mb-4"
                >
                  <template v-slot:default>
                    <strong>{{ correctAnswers }} / {{ totalQuestions }}</strong>
                  </template>
                </v-progress-linear>
                
                <v-chip
                  :color="score >= passingScore ? 'success' : 'error'"
                  variant="flat"
                  size="large"
                >
                  <v-icon start>{{ score >= passingScore ? 'mdi-check' : 'mdi-close' }}</v-icon>
                  {{ score >= passingScore ? 'PASSED' : 'FAILED' }}
                  (Passing Score: {{ passingScore }}%)
                </v-chip>
              </div>

              <!-- Stats Grid -->
              <v-row class="mb-6">
                <v-col cols="6" sm="3">
                  <v-card variant="tonal" color="primary">
                    <v-card-text class="text-center pa-4">
                      <v-icon size="32" class="mb-2">mdi-help-circle</v-icon>
                      <div class="text-h5 font-weight-bold">{{ totalQuestions }}</div>
                      <div class="text-caption">Total Questions</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="6" sm="3">
                  <v-card variant="tonal" color="success">
                    <v-card-text class="text-center pa-4">
                      <v-icon size="32" class="mb-2">mdi-check-circle</v-icon>
                      <div class="text-h5 font-weight-bold">{{ correctAnswers }}</div>
                      <div class="text-caption">Correct</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="6" sm="3">
                  <v-card variant="tonal" color="error">
                    <v-card-text class="text-center pa-4">
                      <v-icon size="32" class="mb-2">mdi-close-circle</v-icon>
                      <div class="text-h5 font-weight-bold">{{ incorrectAnswers }}</div>
                      <div class="text-caption">Incorrect</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="6" sm="3">
                  <v-card variant="tonal" color="info">
                    <v-card-text class="text-center pa-4">
                      <v-icon size="32" class="mb-2">mdi-clock-outline</v-icon>
                      <div class="text-h5 font-weight-bold">{{ formattedTime }}</div>
                      <div class="text-caption">Time Taken</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Performance by Category -->
              <div v-if="categoryPerformance && categoryPerformance.length > 0" class="mb-6">
                <h3 class="text-h5 font-weight-bold mb-4">
                  <v-icon class="mr-2">mdi-chart-donut</v-icon>
                  Performance by Category
                </h3>
                
                <v-list class="pa-0">
                  <v-list-item
                    v-for="category in categoryPerformance"
                    :key="category.name"
                    class="px-0 py-3"
                  >
                    <v-list-item-title class="font-weight-semibold mb-2">
                      {{ category.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      <v-progress-linear
                        :model-value="category.percentage"
                        :color="getCategoryColor(category.percentage)"
                        height="8"
                        rounded
                        class="mb-1"
                      />
                      <div class="d-flex justify-space-between text-caption">
                        <span>{{ category.correct }} / {{ category.total }} correct</span>
                        <span class="font-weight-bold">{{ Math.round(category.percentage) }}%</span>
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Recommendations -->
              <v-alert
                :type="score >= passingScore ? 'success' : 'info'"
                variant="tonal"
                class="mb-6"
              >
                <v-alert-title class="text-h6 mb-2">
                  {{ score >= passingScore ? 'Next Steps' : 'Study Recommendations' }}
                </v-alert-title>
                <div>
                  <p class="mb-2">{{ recommendation }}</p>
                  <ul v-if="weakAreas.length > 0" class="ml-4">
                    <li v-for="area in weakAreas" :key="area">
                      Focus on: {{ area }}
                    </li>
                  </ul>
                </div>
              </v-alert>

              <!-- Question Review -->
              <div class="mb-6">
                <h3 class="text-h5 font-weight-bold mb-4">
                  <v-icon class="mr-2">mdi-format-list-checks</v-icon>
                  Question Review
                </h3>
                
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                    v-for="(question, index) in questions"
                    :key="question.id"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-icon
                          :color="question.isCorrect ? 'success' : 'error'"
                          class="mr-3"
                        >
                          {{ question.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
                        </v-icon>
                        <span class="font-weight-medium">
                          Question {{ index + 1 }}
                          <v-chip
                            v-if="question.flagged"
                            color="warning"
                            variant="tonal"
                            size="x-small"
                            class="ml-2"
                          >
                            Flagged
                          </v-chip>
                        </span>
                      </div>
                    </v-expansion-panel-title>
                    
                    <v-expansion-panel-text>
                      <div class="pa-4">
                        <p class="text-body-1 mb-4">{{ question.text }}</p>
                        
                        <div class="mb-4">
                          <p class="text-subtitle-2 mb-2">Your Answer:</p>
                          <v-chip
                            v-for="answerIndex in question.selectedAnswers"
                            :key="`selected-${answerIndex}`"
                            :color="question.correctAnswers.includes(answerIndex) ? 'success' : 'error'"
                            variant="flat"
                            size="small"
                            class="mr-2"
                          >
                            {{ getOptionLabel(answerIndex) }}: {{ question.options[answerIndex] }}
                          </v-chip>
                        </div>
                        
                        <div v-if="!question.isCorrect" class="mb-4">
                          <p class="text-subtitle-2 mb-2">Correct Answer:</p>
                          <v-chip
                            v-for="answerIndex in question.correctAnswers"
                            :key="`correct-${answerIndex}`"
                            color="success"
                            variant="flat"
                            size="small"
                            class="mr-2"
                          >
                            {{ getOptionLabel(answerIndex) }}: {{ question.options[answerIndex] }}
                          </v-chip>
                        </div>
                        
                        <v-card
                          variant="tonal"
                          color="info"
                          class="pa-3"
                        >
                          <p class="text-body-2 mb-0">
                            <v-icon size="small" class="mr-1">mdi-lightbulb</v-icon>
                            {{ question.explanation }}
                          </p>
                        </v-card>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>

              <!-- Action Buttons -->
              <v-row>
                <v-col cols="12" sm="4">
                  <v-btn
                    color="primary"
                    size="large"
                    block
                    variant="flat"
                    @click="retakeTest"
                  >
                    <v-icon start>mdi-refresh</v-icon>
                    Retake Test
                  </v-btn>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-btn
                    color="secondary"
                    size="large"
                    block
                    variant="flat"
                    @click="studyWeakAreas"
                  >
                    <v-icon start>mdi-book-open-variant</v-icon>
                    Study Weak Areas
                  </v-btn>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-btn
                    size="large"
                    block
                    variant="outlined"
                    @click="viewAllExams"
                  >
                    <v-icon start>mdi-view-grid</v-icon>
                    All Exams
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const examId = route.params.examId as string
const sessionId = route.query.session as string

// Get test results from sessionStorage or API
const testResults = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Load results
onMounted(async () => {
  try {
    // First try to get from sessionStorage (immediate after submission)
    const storedResults = sessionStorage.getItem('testResults')
    if (storedResults) {
      const parsed = JSON.parse(storedResults)
      testResults.value = {
        examId: parsed.examId,
        examCode: parsed.examCode,
        examName: parsed.examName,
        score: parsed.score,
        passingScore: parsed.passingScore,
        totalQuestions: parsed.totalQuestions,
        correctAnswers: parsed.correctCount,
        incorrectAnswers: parsed.incorrectCount,
        unansweredCount: parsed.unansweredCount,
        timeSpent: parsed.timeSpent,
        categoryPerformance: calculateCategoryPerformance(parsed.detailedResults || []),
        questions: formatQuestions(parsed.detailedResults || []),
        passed: parsed.passed
      }
      
      // Clear from sessionStorage to prevent stale data
      sessionStorage.removeItem('testResults')
    } else if (sessionId) {
      // Fallback: fetch from API if session ID is provided
      const response = await $fetch(`/api/sessions/test/${sessionId}/results`)
      if (response.success && response.data) {
        const data = response.data
        testResults.value = {
          examId: data.session.examId,
          examCode: data.session.examCode,
          examName: data.session.examName,
          score: data.results.score,
          passingScore: data.results.passingScore,
          totalQuestions: data.results.totalQuestions,
          correctAnswers: data.results.correctCount,
          incorrectAnswers: data.results.incorrectCount,
          unansweredCount: data.results.unansweredCount,
          timeSpent: data.results.timeSpent,
          categoryPerformance: calculateCategoryPerformance(data.results.detailedResults || []),
          questions: formatQuestions(data.results.detailedResults || []),
          passed: data.results.passed
        }
      } else {
        throw new Error('Failed to load test results')
      }
    } else {
      throw new Error('No test results available')
    }
  } catch (err: any) {
    console.error('Failed to load test results:', err)
    error.value = err.message || 'Failed to load test results'
    
    // Redirect to exam list if no results found
    setTimeout(() => {
      router.push('/exams')
    }, 3000)
  } finally {
    loading.value = false
  }
})

// Helper functions
const calculateCategoryPerformance = (detailedResults: any[]) => {
  const categories = new Map<string, { correct: number; total: number }>()
  
  detailedResults.forEach(result => {
    const category = result.objectiveTitle || 'General'
    const current = categories.get(category) || { correct: 0, total: 0 }
    
    current.total++
    if (result.isCorrect) {
      current.correct++
    }
    
    categories.set(category, current)
  })
  
  return Array.from(categories.entries()).map(([name, stats]) => ({
    name,
    correct: stats.correct,
    total: stats.total,
    percentage: (stats.correct / stats.total) * 100
  }))
}

const formatQuestions = (detailedResults: any[]) => {
  return detailedResults.map(result => ({
    id: result.questionId,
    text: result.questionText,
    options: result.options,
    selectedAnswers: result.userAnswer || [],
    correctAnswers: Array.isArray(result.correctAnswer) ? result.correctAnswer : [result.correctAnswer],
    isCorrect: result.isCorrect,
    explanation: result.explanation,
    flagged: false // TODO: Add flag status from session
  }))
}

// Computed
const score = computed(() => testResults.value?.score || 0)
const passingScore = computed(() => testResults.value?.passingScore || 70)
const totalQuestions = computed(() => testResults.value?.totalQuestions || 0)
const correctAnswers = computed(() => testResults.value?.correctAnswers || 0)
const incorrectAnswers = computed(() => testResults.value?.incorrectAnswers || 0)
const categoryPerformance = computed(() => testResults.value?.categoryPerformance || [])
const questions = computed(() => testResults.value?.questions || [])

const scoreColor = computed(() => {
  if (score.value >= 90) return 'success'
  if (score.value >= passingScore.value) return 'success'
  if (score.value >= 60) return 'warning'
  return 'error'
})

const formattedTime = computed(() => {
  const seconds = testResults.value?.timeSpent || 0
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m ${secs}s`
})

const weakAreas = computed(() => {
  return categoryPerformance.value
    .filter(cat => cat.percentage < 70)
    .map(cat => cat.name)
})

const recommendation = computed(() => {
  if (score.value >= passingScore.value) {
    if (score.value >= 90) {
      return 'Excellent performance! You\'re ready for the certification exam. Consider reviewing any flagged questions.'
    }
    return 'Great job! You passed the practice test. Review the questions you got wrong to solidify your knowledge.'
  } else {
    if (score.value >= 60) {
      return 'You\'re close! Focus on the categories below 70% and retake the test when ready.'
    }
    return 'Keep studying! Review the exam objectives and focus on understanding the concepts rather than memorizing answers.'
  }
})

// Methods
const getCategoryColor = (percentage: number) => {
  if (percentage >= 80) return 'success'
  if (percentage >= 60) return 'warning'
  return 'error'
}

const getOptionLabel = (index: number) => {
  return String.fromCharCode(65 + index)
}

const retakeTest = () => {
  router.push(`/test/${examId}`)
}

const studyWeakAreas = () => {
  // Navigate to study mode with weak area focus
  router.push(`/study/${examId}?focus=weak`)
}

const viewAllExams = () => {
  router.push('/exams')
}

// SEO
watchEffect(() => {
  if (testResults.value) {
    useSeoMeta({
      title: `Test Results - ${testResults.value.examCode} | PingToPass`,
      description: `View your test results for ${testResults.value.examName} certification exam.`
    })
  }
})
</script>

<style scoped>
.results-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-surface-variant), 0.3) 100%);
}

.score-display {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.v-expansion-panel {
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style>