<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue'
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue'
import { Icon } from '@iconify/vue'

// Require authentication
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const examId = route.params.id as string

// Fetch exam details
const { data: examData, error } = await useFetch(`/api/exams/${examId}`)
const exam = computed(() => examData.value?.data)

// If exam not found, redirect to exams list
if (error.value || !exam.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Exam not found'
  })
}

// Fetch user's progress for this exam
const { data: progressData } = await useFetch('/api/progress/exams', {
  query: {
    timeframe: 'all'
  }
})

const examProgress = computed(() => {
  const examPerformance = progressData.value?.data?.examPerformance || []
  return examPerformance.find((e: any) => e.exam.id === examId) || null
})

const statistics = computed(() => examProgress.value?.statistics || {
  totalStudyTime: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  accuracy: 0,
  studySessions: 0,
  testsTaken: 0,
  bestTestScore: 0,
  averageTestScore: 0,
  masteryLevel: 'beginner',
  improvementTrend: 'stable',
  lastActivity: 0
})

// Breadcrumb
const page = ref({ title: exam.value?.examCode || 'Exam Details' })
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
    text: exam.value?.examCode || 'Details',
    disabled: true,
    to: ''
  }
])

// Navigation functions
const startStudyMode = () => {
  navigateTo(`/study/${examId}`)
}

const startTestMode = () => {
  navigateTo(`/test/${examId}`)
}

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

const getMasteryColor = (level: string) => {
  switch (level) {
    case 'expert': return 'success'
    case 'advanced': return 'info'
    case 'intermediate': return 'warning'
    default: return 'grey'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'info'
  if (score >= 50) return 'warning'
  return 'error'
}
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <!-- Exam Header Card -->
    <v-card elevation="10" class="mb-6">
      <v-img
        :src="`/images/exam-banners/${exam.vendorName?.toLowerCase() || 'default'}.jpg`"
        :lazy-src="'/images/exam-banners/default.jpg'"
        height="300"
        cover
        class="align-end"
      >
        <template v-slot:error>
          <v-img
            src="/images/exam-banners/default.jpg"
            height="300"
            cover
            class="align-end"
          >
            <div class="exam-header-overlay pa-6">
              <v-chip
                :color="getMasteryColor(statistics.masteryLevel)"
                variant="flat"
                size="small"
                class="mb-3"
              >
                {{ statistics.masteryLevel }}
              </v-chip>
              <h1 class="text-h3 font-weight-bold text-white mb-2">
                {{ exam.examCode }}
              </h1>
              <h2 class="text-h5 text-white-50 mb-4">
                {{ exam.examName }}
              </h2>
              <div class="d-flex flex-wrap gap-2">
                <v-chip color="white" variant="tonal" size="small">
                  <Icon icon="solar:buildings-bold-duotone" class="mr-1" />
                  {{ exam.vendorName }}
                </v-chip>
                <v-chip color="white" variant="tonal" size="small">
                  <Icon icon="solar:question-circle-bold-duotone" class="mr-1" />
                  {{ exam.numberOfQuestions }} Questions
                </v-chip>
                <v-chip color="white" variant="tonal" size="small">
                  <Icon icon="solar:clock-circle-bold-duotone" class="mr-1" />
                  {{ exam.examDuration }} Minutes
                </v-chip>
                <v-chip color="white" variant="tonal" size="small">
                  <Icon icon="solar:shield-check-bold-duotone" class="mr-1" />
                  Pass: {{ exam.passingScore }}%
                </v-chip>
              </div>
            </div>
          </v-img>
        </template>
        <div class="exam-header-overlay pa-6">
          <v-chip
            :color="getMasteryColor(statistics.masteryLevel)"
            variant="flat"
            size="small"
            class="mb-3"
          >
            {{ statistics.masteryLevel }}
          </v-chip>
          <h1 class="text-h3 font-weight-bold text-white mb-2">
            {{ exam.examCode }}
          </h1>
          <h2 class="text-h5 text-white-50 mb-4">
            {{ exam.examName }}
          </h2>
          <div class="d-flex flex-wrap gap-2">
            <v-chip color="white" variant="tonal" size="small">
              <Icon icon="solar:buildings-bold-duotone" class="mr-1" />
              {{ exam.vendorName }}
            </v-chip>
            <v-chip color="white" variant="tonal" size="small">
              <Icon icon="solar:question-circle-bold-duotone" class="mr-1" />
              {{ exam.numberOfQuestions }} Questions
            </v-chip>
            <v-chip color="white" variant="tonal" size="small">
              <Icon icon="solar:clock-circle-bold-duotone" class="mr-1" />
              {{ exam.examDuration }} Minutes
            </v-chip>
            <v-chip color="white" variant="tonal" size="small">
              <Icon icon="solar:shield-check-bold-duotone" class="mr-1" />
              Pass: {{ exam.passingScore }}%
            </v-chip>
          </div>
        </div>
      </v-img>
    </v-card>

    <v-row>
      <!-- Left Column - Progress & Quick Actions -->
      <v-col cols="12" lg="4">
        <!-- Progress Overview -->
        <UiParentCard title="Your Progress" class="mb-6">
          <div class="text-center mb-6">
            <v-progress-circular
              :model-value="statistics.accuracy"
              :size="120"
              :width="12"
              :color="getScoreColor(statistics.accuracy)"
            >
              <span class="text-h4 font-weight-bold">{{ Math.round(statistics.accuracy) }}%</span>
            </v-progress-circular>
            <p class="text-body-2 text-medium-emphasis mt-3">
              Overall Accuracy
            </p>
          </div>

          <v-list class="pa-0">
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="40">
                  <Icon icon="solar:clock-circle-bold-duotone" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ formatStudyTime(statistics.totalStudyTime) }}
              </v-list-item-title>
              <v-list-item-subtitle>Total Study Time</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="success" variant="tonal" size="40">
                  <Icon icon="solar:document-text-bold-duotone" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ statistics.totalQuestions }}
              </v-list-item-title>
              <v-list-item-subtitle>Questions Practiced</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="info" variant="tonal" size="40">
                  <Icon icon="solar:clipboard-list-bold-duotone" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ statistics.testsTaken }}
              </v-list-item-title>
              <v-list-item-subtitle>Tests Completed</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-avatar color="warning" variant="tonal" size="40">
                  <Icon icon="solar:medal-star-bold-duotone" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-semibold">
                {{ statistics.bestTestScore }}%
              </v-list-item-title>
              <v-list-item-subtitle>Best Test Score</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </UiParentCard>

        <!-- Quick Actions -->
        <UiParentCard title="Quick Actions">
          <v-btn
            color="primary"
            size="large"
            block
            @click="startStudyMode"
            class="mb-3"
          >
            <Icon icon="solar:book-bold-duotone" class="mr-2" />
            Start Study Session
          </v-btn>
          <v-btn
            color="secondary"
            size="large"
            block
            @click="startTestMode"
          >
            <Icon icon="solar:clipboard-text-bold-duotone" class="mr-2" />
            Take Practice Test
          </v-btn>
        </UiParentCard>
      </v-col>

      <!-- Right Column - Exam Details -->
      <v-col cols="12" lg="8">
        <!-- Exam Overview -->
        <UiParentCard title="Exam Overview" class="mb-6">
          <p class="text-body-1 mb-4">
            {{ exam.description || 'Prepare for this certification exam with our comprehensive study materials and practice tests. Master the concepts, practice with real exam questions, and track your progress.' }}
          </p>

          <v-divider class="my-4" />

          <h5 class="text-h6 font-weight-semibold mb-3">
            <Icon icon="solar:target-bold-duotone" class="mr-2" />
            Exam Objectives
          </h5>
          
          <v-list v-if="exam.objectives && exam.objectives.length > 0" class="pa-0">
            <v-list-item
              v-for="(objective, index) in exam.objectives"
              :key="objective.id || index"
              class="px-0 py-2"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="32">
                  {{ index + 1 }}
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium mb-1">
                {{ objective.title }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="objective.description" class="text-wrap">
                {{ objective.description }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          
          <v-alert
            v-else
            type="info"
            variant="tonal"
            class="mt-2"
          >
            <template v-slot:prepend>
              <Icon icon="solar:info-circle-bold-duotone" />
            </template>
            Detailed exam objectives are being prepared and will be available soon.
          </v-alert>
        </UiParentCard>

        <!-- Study Resources -->
        <UiParentCard title="Study Resources">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-avatar color="primary" variant="tonal">
                      <Icon icon="solar:book-2-bold-duotone" />
                    </v-avatar>
                  </template>
                  <v-card-title>Study Guide</v-card-title>
                  <v-card-subtitle>Comprehensive exam preparation</v-card-subtitle>
                </v-card-item>
                <v-card-text>
                  Review all exam topics with detailed explanations and examples.
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" color="primary" disabled>
                    Coming Soon
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-avatar color="success" variant="tonal">
                      <Icon icon="solar:video-library-bold-duotone" />
                    </v-avatar>
                  </template>
                  <v-card-title>Video Tutorials</v-card-title>
                  <v-card-subtitle>Learn from expert instructors</v-card-subtitle>
                </v-card-item>
                <v-card-text>
                  Watch video explanations for complex topics and concepts.
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" color="primary" disabled>
                    Coming Soon
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.exam-header-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
}
</style>