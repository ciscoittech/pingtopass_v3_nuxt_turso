<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const sessionId = route.params.id as string

// Results state
const results = ref(null as any)
const detailedResults = ref(null as any)
const isLoading = ref(true)
const showDetailedResults = ref(false)
const selectedQuestion = ref(null as any)
const showQuestionDialog = ref(false)

const fetchResults = async (includeDetailed = false) => {
  try {
    const { data } = await $fetch(`/api/test/${sessionId}/results`, {
      query: { detailed: includeDetailed.toString() }
    })
    
    results.value = data
    if (includeDetailed) {
      detailedResults.value = data.detailedResults
    }
  } catch (error) {
    console.error('Failed to fetch results:', error)
  } finally {
    isLoading.value = false
  }
}

const loadDetailedResults = async () => {
  if (!detailedResults.value) {
    isLoading.value = true
    await fetchResults(true)
  }
  showDetailedResults.value = true
}

const viewQuestionDetail = (questionData: any) => {
  selectedQuestion.value = questionData
  showQuestionDialog.value = true
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  return `${minutes}m ${secs}s`
}

const getGradeColor = (percentage: number) => {
  if (percentage >= 90) return 'success'
  if (percentage >= 80) return 'info'
  if (percentage >= 70) return 'warning'
  return 'error'
}

const getGradeLetter = (percentage: number) => {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

const chartData = computed(() => {
  if (!results.value) return null
  
  return {
    labels: ['Correct', 'Incorrect', 'Skipped'],
    datasets: [{
      data: [
        results.value.results.correctAnswers,
        results.value.results.incorrectAnswers,
        results.value.results.skippedAnswers
      ],
      backgroundColor: ['#4CAF50', '#F44336', '#FFC107']
    }]
  }
})

const shareResults = () => {
  const shareData = {
    title: `${results.value.exam.name} Test Results`,
    text: `I scored ${results.value.results.scorePercentage}% on the ${results.value.exam.name} test!`,
    url: window.location.href
  }
  
  if (navigator.share) {
    navigator.share(shareData)
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
  }
}

onMounted(() => {
  fetchResults()
})
</script>

<template>
  <div class="test-results">
    <v-container>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        />
        <p class="text-h6 mt-4">Loading your results...</p>
      </div>

      <!-- Results Content -->
      <div v-else-if="results" class="results-content">
        <!-- Header -->
        <div class="results-header mb-6">
          <v-row align="center">
            <v-col cols="12" md="8">
              <h1 class="text-h4 mb-2">Test Results</h1>
              <p class="text-h6 text-grey-darken-1">
                {{ results.exam.name }} ({{ results.exam.code }})
              </p>
            </v-col>
            
            <v-col cols="12" md="4" class="text-md-right">
              <v-btn
                color="primary"
                variant="outlined"
                @click="$router.push('/dashboard')"
                class="mr-2"
              >
                <v-icon start>mdi-home</v-icon>
                Dashboard
              </v-btn>
              
              <v-btn
                color="success"
                @click="shareResults"
              >
                <v-icon start>mdi-share</v-icon>
                Share
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- Overall Results Card -->
        <v-card class="results-overview mb-6" elevation="8">
          <v-card-text class="pa-6">
            <v-row>
              <!-- Score Circle -->
              <v-col cols="12" md="4" class="text-center">
                <div class="score-circle mb-4">
                  <v-progress-circular
                    :model-value="results.results.scorePercentage"
                    :color="getGradeColor(results.results.scorePercentage)"
                    size="120"
                    width="12"
                    class="ma-auto"
                  >
                    <div class="score-content">
                      <div class="score-percentage">{{ results.results.scorePercentage }}%</div>
                      <div class="score-grade">{{ getGradeLetter(results.results.scorePercentage) }}</div>
                    </div>
                  </v-progress-circular>
                </div>
                
                <v-chip
                  :color="results.results.hasPassed ? 'success' : 'error'"
                  size="large"
                  variant="elevated"
                >
                  <v-icon start>
                    {{ results.results.hasPassed ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                  {{ results.results.hasPassed ? 'PASSED' : 'FAILED' }}
                </v-chip>
              </v-col>
              
              <!-- Score Breakdown -->
              <v-col cols="12" md="8">
                <h3 class="text-h6 mb-4">Score Breakdown</h3>
                
                <v-row>
                  <v-col cols="6" sm="3">
                    <div class="stat-card">
                      <div class="stat-value text-h5 text-success">
                        {{ results.results.correctAnswers }}
                      </div>
                      <div class="stat-label">Correct</div>
                    </div>
                  </v-col>
                  
                  <v-col cols="6" sm="3">
                    <div class="stat-card">
                      <div class="stat-value text-h5 text-error">
                        {{ results.results.incorrectAnswers }}
                      </div>
                      <div class="stat-label">Incorrect</div>
                    </div>
                  </v-col>
                  
                  <v-col cols="6" sm="3">
                    <div class="stat-card">
                      <div class="stat-value text-h5 text-warning">
                        {{ results.results.skippedAnswers }}
                      </div>
                      <div class="stat-label">Skipped</div>
                    </div>
                  </v-col>
                  
                  <v-col cols="6" sm="3">
                    <div class="stat-card">
                      <div class="stat-value text-h5 text-info">
                        {{ results.results.maxPossibleScore }}
                      </div>
                      <div class="stat-label">Total</div>
                    </div>
                  </v-col>
                </v-row>
                
                <!-- Time Information -->
                <div class="time-info mt-4">
                  <v-row>
                    <v-col cols="6">
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-clock-outline</v-icon>
                        <div>
                          <div class="text-caption">Time Spent</div>
                          <div class="text-subtitle-1">{{ formatTime(results.results.timeSpent) }}</div>
                        </div>
                      </div>
                    </v-col>
                    
                    <v-col cols="6">
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-calendar</v-icon>
                        <div>
                          <div class="text-caption">Completed</div>
                          <div class="text-subtitle-1">
                            {{ new Date(results.results.submittedAt * 1000).toLocaleDateString() }}
                          </div>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Section Scores (if available) -->
        <v-card v-if="results.results.sectionScores && Object.keys(results.results.sectionScores).length > 0" class="mb-6">
          <v-card-title>Section Performance</v-card-title>
          <v-card-text>
            <div class="section-scores">
              <div
                v-for="(section, sectionId) in results.results.sectionScores"
                :key="sectionId"
                class="section-item mb-3"
              >
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1">{{ sectionId }}</span>
                  <span class="text-subtitle-2">{{ section.correct }}/{{ section.total }} ({{ section.percentage }}%)</span>
                </div>
                <v-progress-linear
                  :model-value="section.percentage"
                  :color="getGradeColor(section.percentage)"
                  height="8"
                  rounded
                />
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Actions -->
        <v-card class="actions-card">
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-btn
                  color="primary"
                  variant="elevated"
                  size="large"
                  @click="loadDetailedResults"
                  block
                >
                  <v-icon start>mdi-magnify</v-icon>
                  Review Answers
                </v-btn>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-btn
                  color="secondary"
                  variant="outlined"
                  size="large"
                  @click="$router.push(`/test/${results.exam.id}`)"
                  block
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Retake Test
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </v-container>

    <!-- Detailed Results Dialog -->
    <TestResultsReview
      v-if="detailedResults"
      v-model="showDetailedResults"
      :results="detailedResults"
      @question-selected="viewQuestionDetail"
    />

    <!-- Question Detail Dialog -->
    <TestQuestionReview
      v-if="selectedQuestion"
      v-model="showQuestionDialog"
      :question-data="selectedQuestion"
    />
  </div>
</template>

<style scoped>
.test-results {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24px 0;
}

.results-overview {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
}

.score-circle {
  position: relative;
}

.score-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-percentage {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.score-grade {
  font-size: 1.5rem;
  font-weight: bold;
  opacity: 0.7;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.stat-value {
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: #666;
}

.time-info {
  background: #f0f4f8;
  border-radius: 8px;
  padding: 16px;
}

.section-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.actions-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
}

@media (max-width: 768px) {
  .test-results {
    padding: 16px 0;
  }
  
  .score-circle {
    margin-bottom: 24px;
  }
  
  .stat-card {
    margin-bottom: 12px;
  }
}
</style>