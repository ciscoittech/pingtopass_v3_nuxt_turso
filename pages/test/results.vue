<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()

// Get results from sessionStorage
const testResults = ref<any>(null)

onMounted(() => {
  const storedResults = sessionStorage.getItem('testResults')
  if (storedResults) {
    testResults.value = JSON.parse(storedResults)
    // Clear it after reading
    sessionStorage.removeItem('testResults')
  } else {
    // No results found, redirect to test page
    navigateTo('/test')
  }
})

// Computed properties
const isPassed = computed(() => testResults.value?.passed || false)
const scorePercentage = computed(() => testResults.value?.score || 0)
const scoreColor = computed(() => {
  if (scorePercentage.value >= 80) return 'success'
  if (scorePercentage.value >= 60) return 'warning'
  return 'error'
})

const formattedTime = computed(() => {
  if (!testResults.value?.timeSpent) return '0:00'
  const minutes = Math.floor(testResults.value.timeSpent / 60)
  const seconds = testResults.value.timeSpent % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
const retakeTest = () => {
  navigateTo(`/test/${testResults.value?.examId}`)
}

const viewDetailedResults = () => {
  // TODO: Implement detailed results view
  console.log('View detailed results')
}

const goToExams = () => {
  navigateTo('/exams')
}
</script>

<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="0" rounded="lg">
          <!-- Header -->
          <v-card-text class="text-center pa-8">
            <v-icon
              :color="isPassed ? 'success' : 'error'"
              size="80"
              class="mb-4"
            >
              {{ isPassed ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            
            <h1 class="text-h3 font-weight-bold mb-2">
              {{ isPassed ? 'Congratulations!' : 'Keep Practicing!' }}
            </h1>
            
            <p class="text-h6 text-medium-emphasis">
              {{ testResults?.examCode }} - {{ testResults?.examName }}
            </p>
          </v-card-text>
          
          <v-divider />
          
          <!-- Score Display -->
          <v-card-text class="pa-8">
            <div class="text-center mb-6">
              <v-progress-circular
                :model-value="scorePercentage"
                :size="160"
                :width="12"
                :color="scoreColor"
                class="mb-4"
              >
                <div class="text-center">
                  <div class="text-h3 font-weight-bold">{{ scorePercentage }}%</div>
                  <div class="text-caption text-medium-emphasis">Score</div>
                </div>
              </v-progress-circular>
              
              <v-chip
                :color="isPassed ? 'success' : 'error'"
                variant="flat"
                size="large"
                class="mt-4"
              >
                {{ isPassed ? 'PASSED' : 'FAILED' }}
              </v-chip>
            </div>
            
            <!-- Stats Grid -->
            <v-row class="mb-6">
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="primary">
                  <v-card-text class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ testResults?.totalQuestions || 0 }}</div>
                    <div class="text-caption">Total Questions</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ testResults?.correctCount || 0 }}</div>
                    <div class="text-caption">Correct</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="error">
                  <v-card-text class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ testResults?.incorrectCount || 0 }}</div>
                    <div class="text-caption">Incorrect</div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="grey">
                  <v-card-text class="text-center pa-3">
                    <div class="text-h5 font-weight-bold">{{ testResults?.unansweredCount || 0 }}</div>
                    <div class="text-caption">Unanswered</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <!-- Additional Info -->
            <v-list density="comfortable">
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-timer-outline</v-icon>
                </template>
                <v-list-item-title>Time Spent</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{ formattedTime }}</span>
                </template>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-target</v-icon>
                </template>
                <v-list-item-title>Passing Score</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{ testResults?.passingScore || 70 }}%</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-divider />
          
          <!-- Actions -->
          <v-card-actions class="pa-6">
            <v-row>
              <v-col cols="12" sm="4">
                <v-btn
                  variant="outlined"
                  block
                  size="large"
                  @click="goToExams"
                >
                  <v-icon start>mdi-book-open-variant</v-icon>
                  Browse Exams
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="4">
                <v-btn
                  variant="tonal"
                  color="primary"
                  block
                  size="large"
                  @click="viewDetailedResults"
                  disabled
                >
                  <v-icon start>mdi-file-document</v-icon>
                  Detailed Results
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="4">
                <v-btn
                  color="primary"
                  variant="flat"
                  block
                  size="large"
                  @click="retakeTest"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Retake Test
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-progress-circular {
  transition: all 0.3s ease;
}
</style>