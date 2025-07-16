<template>
  <v-card elevation="0" rounded="lg" class="review-summary-card">
    <v-card-text class="pa-6">
      <div class="text-center mb-6">
        <v-avatar color="primary" variant="tonal" size="80" class="mb-4">
          <v-icon size="40">mdi-book-check</v-icon>
        </v-avatar>
        <h2 class="text-h4 font-weight-bold mb-2">Review Summary</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          Here's how you performed on previously answered questions
        </p>
      </div>

      <!-- Performance Overview -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary" class="text-center pa-4">
            <v-icon size="32" class="mb-2">mdi-help-circle</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ totalQuestions }}</h3>
            <p class="text-body-2">Questions Reviewed</p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success" class="text-center pa-4">
            <v-icon size="32" class="mb-2">mdi-check-circle</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ correctAnswers }}</h3>
            <p class="text-body-2">Correct Answers</p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card 
            variant="tonal" 
            :color="accuracyColor" 
            class="text-center pa-4"
          >
            <v-icon size="32" class="mb-2">mdi-target</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ accuracyPercentage }}%</h3>
            <p class="text-body-2">Accuracy</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- Improvement Indicator -->
      <v-alert
        v-if="showImprovement"
        :type="improvementType"
        variant="tonal"
        class="mb-6"
      >
        <div class="d-flex align-center">
          <v-icon :color="improvementType" class="mr-2">
            {{ improvementIcon }}
          </v-icon>
          <div>
            <strong>{{ improvementMessage }}</strong>
            <p class="text-body-2 mb-0 mt-1">
              {{ improvementDetails }}
            </p>
          </div>
        </div>
      </v-alert>

      <!-- Question Breakdown -->
      <div v-if="questionBreakdown.length > 0" class="mb-6">
        <h3 class="text-h6 font-weight-semibold mb-3">Question Performance</h3>
        <v-list density="comfortable">
          <v-list-item
            v-for="(item, index) in questionBreakdown"
            :key="index"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-icon :color="item.correct ? 'success' : 'error'" size="small">
                {{ item.correct ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
            </template>
            <v-list-item-title>
              Question {{ item.questionNumber }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ item.timeSpent }}s • {{ item.attempts }} attempt(s)
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-3 justify-center">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          @click="$emit('study-again')"
        >
          <v-icon start>mdi-restart</v-icon>
          Study Again
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          @click="$emit('go-to-exams')"
        >
          <v-icon start>mdi-view-grid</v-icon>
          Back to Exams
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  timeSpent: number
  previousAccuracy?: number
  questionBreakdown?: Array<{
    questionNumber: number
    correct: boolean
    timeSpent: number
    attempts: number
  }>
}

const props = withDefaults(defineProps<Props>(), {
  questionBreakdown: () => []
})

const emit = defineEmits<{
  'study-again': []
  'go-to-exams': []
}>()

// Computed
const accuracyPercentage = computed(() => {
  if (props.totalQuestions === 0) return 0
  return Math.round((props.correctAnswers / props.totalQuestions) * 100)
})

const accuracyColor = computed(() => {
  const accuracy = accuracyPercentage.value
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'warning'
  return 'error'
})

const showImprovement = computed(() => {
  return props.previousAccuracy !== undefined && props.previousAccuracy >= 0
})

const improvementType = computed(() => {
  if (!showImprovement.value) return 'info'
  const current = accuracyPercentage.value
  const previous = props.previousAccuracy || 0
  
  if (current > previous + 5) return 'success'
  if (current < previous - 5) return 'warning'
  return 'info'
})

const improvementIcon = computed(() => {
  const type = improvementType.value
  if (type === 'success') return 'mdi-trending-up'
  if (type === 'warning') return 'mdi-trending-down'
  return 'mdi-trending-neutral'
})

const improvementMessage = computed(() => {
  if (!showImprovement.value) return ''
  const current = accuracyPercentage.value
  const previous = props.previousAccuracy || 0
  const diff = current - previous
  
  if (diff > 5) return `Great improvement! +${diff}%`
  if (diff < -5) return `Performance decreased by ${Math.abs(diff)}%`
  return 'Performance remained consistent'
})

const improvementDetails = computed(() => {
  if (!showImprovement.value) return ''
  const current = accuracyPercentage.value
  const previous = props.previousAccuracy || 0
  
  return `Previous accuracy: ${previous}% → Current: ${current}%`
})
</script>

<style lang="scss" scoped>
.review-summary-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-primary), 0.02) 100%);
  max-width: 800px;
  margin: 0 auto;
}
</style>