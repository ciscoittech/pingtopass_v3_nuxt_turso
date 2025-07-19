<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useExamStore } from '~/stores/exams'
import type { Exam } from '~/types/exam'

// Require authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const examId = route.params.id as string
const examStore = useExamStore()
const { activeStudySessions, activeTestSessions, lastActivity } = useActiveSession()

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

// SEO Meta
useSeoMeta({
  title: `${exam.value?.examCode} - ${exam.value?.examName} | PingToPass`,
  description: exam.value?.description || `Practice ${exam.value?.examName} certification exam with comprehensive study materials and track your progress.`
})

// Study mode options
const studyModes = ref([
  { text: 'Study Mode', value: 'study', icon: 'solar:book-line-duotone', color: 'primary' },
  { text: 'Practice Test', value: 'test', icon: 'solar:clipboard-text-line-duotone', color: 'secondary' },
  { text: 'Quick Review', value: 'review', icon: 'solar:refresh-circle-line-duotone', color: 'info' }
])

const selectedMode = ref('study')

// Check for active sessions for this exam
const hasActiveStudySession = computed(() => 
  activeStudySessions.value.some(s => s.examId === examId)
)

const hasActiveTestSession = computed(() => 
  activeTestSessions.value.some(s => s.examId === examId)
)

const activeSession = computed(() => {
  const studySession = activeStudySessions.value.find(s => s.examId === examId)
  const testSession = activeTestSessions.value.find(s => s.examId === examId)
  return studySession || testSession || null
})

const hasAnyActiveSession = computed(() => 
  hasActiveStudySession.value || hasActiveTestSession.value
)

// Get user's last preferred mode for this exam
const preferredMode = computed(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`exam_mode_${examId}`) || 'study'
  }
  return 'study'
})

// Set initial mode based on preference or active session
onMounted(() => {
  if (activeSession.value) {
    selectedMode.value = activeSession.value.mode
  } else {
    selectedMode.value = preferredMode.value
  }
})

// Exam features for display
const examFeatures = computed(() => [
  { icon: 'solar:document-text-line-duotone', label: 'Questions', value: exam.value?.numberOfQuestions || 0 },
  { icon: 'solar:clock-circle-line-duotone', label: 'Duration', value: `${exam.value?.examDuration || 90} minutes` },
  { icon: 'solar:shield-check-line-duotone', label: 'Pass Score', value: `${exam.value?.passingScore || 70}%` },
  { icon: 'solar:star-line-duotone', label: 'Difficulty', value: exam.value?.difficulty || 'Intermediate' }
])

// Navigation functions
const startStudyMode = () => {
  // Store preference
  if (typeof window !== 'undefined') {
    localStorage.setItem(`exam_mode_${examId}`, 'study')
  }
  navigateTo(`/study/${examId}`)
}

const startTestMode = () => {
  // Store preference and context
  if (typeof window !== 'undefined') {
    localStorage.setItem(`exam_mode_${examId}`, 'test')
    localStorage.setItem('lastViewedExam', examId)
  }
  navigateTo(`/test/${examId}`)
}

// Action button text and behavior
const actionButtonText = computed(() => {
  if (activeSession.value) {
    return activeSession.value.mode === 'study' ? 'Continue Studying' : 'Continue Test'
  }
  return selectedMode.value === 'test' ? 'Start Practice Test' : 'Start Studying'
})

const actionButtonIcon = computed(() => {
  if (activeSession.value) {
    return activeSession.value.mode === 'study' ? 'solar:play-circle-bold' : 'solar:timer-start-bold'
  }
  return selectedMode.value === 'test' ? 'solar:play-circle-bold' : 'solar:book-bold'
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
  <div v-if="exam">
    <!-- Main Exam Detail Layout -->
    <v-row>
      <!-- Left Column - Exam Overview -->
      <v-col cols="12" lg="6">
        <!-- Exam Header Info -->
        <v-card elevation="10" class="mb-6">
          <v-card-text class="pa-6">
            <!-- Vendor Icon and Badge -->
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center">
                <SharedVendorIcon 
                  :vendor="exam.vendorName"
                  :size="56"
                  :icon-size="32"
                  elevation
                  class="mr-4"
                />
                <div>
                  <v-chip 
                    size="small" 
                    variant="tonal" 
                    color="primary"
                    class="mb-2"
                  >
                    {{ exam.vendorName }}
                  </v-chip>
                  <div class="text-caption text-grey100">
                    {{ exam.difficulty || 'Intermediate' }} Level
                  </div>
                </div>
              </div>
              
              <!-- Active Session Indicator -->
              <div v-if="hasAnyActiveSession" class="text-center">
                <v-chip
                  :color="activeSession?.mode === 'study' ? 'primary' : 'warning'"
                  size="small"
                  variant="flat"
                  class="mb-1"
                >
                  <Icon 
                    :icon="activeSession?.mode === 'study' ? 'solar:book-bold' : 'solar:timer-start-bold'" 
                    size="14" 
                    class="mr-1"
                  />
                  {{ activeSession?.mode === 'study' ? 'Studying' : 'Testing' }}
                </v-chip>
                <div class="text-caption text-grey100">
                  {{ activeSession?.progress || 0 }}% complete
                </div>
              </div>
            </div>

            <!-- Exam Title -->
            <h1 class="text-h3 font-weight-bold mb-2 text-primary">{{ exam.examCode }}</h1>
            <h2 class="text-h6 text-grey100 mb-4 font-weight-medium">{{ exam.examName }}</h2>

            <!-- Description -->
            <p class="text-body-1 text-grey100 mb-6">
              {{ exam.description || 'Master this certification exam with comprehensive practice questions and detailed explanations. Track your progress and achieve certification success.' }}
            </p>

            <!-- Exam Features Grid -->
            <v-row class="mb-6">
              <v-col 
                v-for="feature in examFeatures" 
                :key="feature.label"
                cols="6"
                sm="3"
              >
                <div class="text-center">
                  <Icon 
                    :icon="feature.icon" 
                    size="24" 
                    class="mb-2 text-primary"
                  />
                  <div class="text-caption text-grey100">{{ feature.label }}</div>
                  <div class="text-body-2 font-weight-semibold">{{ feature.value }}</div>
                </div>
              </v-col>
            </v-row>

            <!-- Progress Overview -->
            <v-divider class="mb-6" />
            
            <div class="d-flex justify-space-between align-center mb-4">
              <h3 class="text-h6">Your Progress</h3>
              <v-chip 
                :color="getMasteryColor(statistics.masteryLevel)" 
                size="small"
                variant="flat"
              >
                {{ statistics.masteryLevel }} Level
              </v-chip>
            </div>

            <!-- Progress Stats -->
            <v-row class="mb-4">
              <v-col cols="6">
                <div class="stat-box">
                  <div class="text-h4 font-weight-bold text-primary">{{ statistics.accuracy }}%</div>
                  <div class="text-caption text-grey100">Accuracy Rate</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="text-h4 font-weight-bold text-success">{{ statistics.totalQuestions }}</div>
                  <div class="text-caption text-grey100">Questions Practiced</div>
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="text-h4 font-weight-bold text-info">{{ formatStudyTime(statistics.totalStudyTime) }}</div>
                  <div class="text-caption text-grey100">Study Time</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="text-h4 font-weight-bold text-warning">{{ statistics.testsTaken }}</div>
                  <div class="text-caption text-grey100">Tests Taken</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Exam Objectives -->
        <v-card elevation="10">
          <v-card-text class="pa-6">
            <h3 class="text-h6 mb-4 d-flex align-center">
              <Icon icon="solar:target-bold-duotone" size="24" class="mr-2 text-primary" />
              Exam Objectives
            </h3>
            
            <v-expansion-panels variant="accordion" elevation="0">
              <v-expansion-panel
                v-for="(objective, idx) in (exam.objectives || [])"
                :key="idx"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center justify-space-between flex-grow-1 mr-2">
                    <span class="text-body-2">{{ objective.title }}</span>
                    <v-chip size="x-small" color="primary" variant="tonal">
                      {{ objective.weight }}%
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="text-body-2 text-grey100 pt-2">
                    {{ objective.description || 'Master the key concepts and skills covered in this exam domain.' }}
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <v-alert
              v-if="!exam.objectives || exam.objectives.length === 0"
              type="info"
              variant="tonal"
              class="mt-2"
            >
              Exam objectives will be available soon.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column - Actions & Options -->
      <v-col cols="12" lg="6">
        <!-- Study Options Card -->
        <v-card elevation="10" class="mb-6 sticky-card">
          <v-card-text class="pa-6">
            <!-- Active Session Alert -->
            <v-alert
              v-if="hasAnyActiveSession"
              type="info"
              variant="tonal"
              class="mb-4"
              border="start"
            >
              <template #prepend>
                <Icon 
                  :icon="activeSession?.mode === 'study' ? 'solar:book-bold-duotone' : 'solar:timer-start-bold-duotone'" 
                  size="20" 
                />
              </template>
              <div class="text-body-2">
                <strong>{{ activeSession?.mode === 'study' ? 'Study session' : 'Test session' }} in progress</strong>
                <div class="text-caption mt-1">
                  {{ activeSession?.progress || 0 }}% complete • {{ activeSession?.questionsAnswered || 0 }} questions answered
                </div>
              </div>
            </v-alert>

            <h3 class="text-h6 mb-4">
              {{ hasAnyActiveSession ? 'Continue or Start New' : 'Choose Study Mode' }}
            </h3>
            
            <!-- Mode Selector (only show if no active session) -->
            <v-select
              v-if="!hasAnyActiveSession"
              v-model="selectedMode"
              :items="studyModes"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              class="mb-6"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <Icon :icon="item.raw.icon" size="20" :class="`text-${item.raw.color}`" />
                  </template>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <div class="d-flex align-center">
                  <Icon :icon="item.raw.icon" size="20" class="mr-2" :class="`text-${item.raw.color}`" />
                  {{ item.title }}
                </div>
              </template>
            </v-select>

            <!-- Primary Action Button -->
            <v-btn
              color="primary"
              size="x-large"
              block
              rounded="pill"
              class="mb-3 text-none"
              elevation="2"
              @click="activeSession ? (activeSession.mode === 'study' ? startStudyMode() : startTestMode()) : (selectedMode === 'test' ? startTestMode() : startStudyMode())"
            >
              <Icon 
                :icon="actionButtonIcon" 
                class="mr-2" 
                size="20" 
              />
              {{ actionButtonText }}
            </v-btn>

            <!-- Secondary Action Buttons (if no active session) -->
            <div v-if="!hasAnyActiveSession" class="d-flex gap-2 mb-3">
              <v-btn
                variant="outlined"
                color="primary"
                size="large"
                block
                rounded="pill"
                class="text-none"
                @click="startStudyMode()"
              >
                <Icon icon="solar:book-bold" class="mr-2" size="18" />
                Study Mode
              </v-btn>
              <v-btn
                variant="outlined"
                color="warning"
                size="large"
                block
                rounded="pill"
                class="text-none"
                @click="startTestMode()"
              >
                <Icon icon="solar:timer-start-bold" class="mr-2" size="18" />
                Test Mode
              </v-btn>
            </div>

            <v-btn
              variant="tonal"
              size="large"
              block
              rounded="pill"
              @click="exam && examStore.toggleBookmark(exam.id)"
            >
              <Icon 
                :icon="exam?.isBookmarked ? 'solar:bookmark-bold-duotone' : 'solar:bookmark-line-duotone'" 
                class="mr-2" 
                size="20" 
              />
              {{ exam.isBookmarked ? 'Bookmarked' : 'Bookmark Exam' }}
            </v-btn>

            <!-- Quick Stats -->
            <v-divider class="my-6" />
            
            <div class="quick-stats">
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-body-2 text-grey100">Best Test Score</span>
                <span class="text-body-2 font-weight-semibold" :class="`text-${getScoreColor(statistics.bestTestScore)}`">
                  {{ statistics.bestTestScore }}%
                </span>
              </div>
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-body-2 text-grey100">Average Score</span>
                <span class="text-body-2 font-weight-semibold">{{ statistics.averageTestScore }}%</span>
              </div>
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="text-body-2 text-grey100">Study Sessions</span>
                <span class="text-body-2 font-weight-semibold">{{ statistics.studySessions }}</span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2 text-grey100">Last Activity</span>
                <span class="text-body-2 font-weight-semibold">
                  {{ statistics.lastActivity ? new Date(statistics.lastActivity * 1000).toLocaleDateString() : 'Never' }}
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Additional Resources -->
        <v-card elevation="10">
          <v-card-text class="pa-6">
            <h3 class="text-h6 mb-4 d-flex align-center">
              <Icon icon="solar:library-bold-duotone" size="24" class="mr-2 text-primary" />
              Learning Resources
            </h3>
            
            <v-list density="comfortable" class="pa-0">
              <v-list-item
                class="px-0"
                @click="navigateTo('/study-guides')"
              >
                <template #prepend>
                  <Icon icon="solar:document-text-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title class="text-body-2">Study Guides</v-list-item-title>
                <v-list-item-subtitle class="text-caption">Comprehensive exam preparation materials</v-list-item-subtitle>
                <template #append>
                  <v-chip size="x-small" variant="tonal">Coming Soon</v-chip>
                </template>
              </v-list-item>
              
              <v-list-item
                class="px-0"
                @click="navigateTo('/video-tutorials')"
              >
                <template #prepend>
                  <Icon icon="solar:play-circle-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title class="text-body-2">Video Tutorials</v-list-item-title>
                <v-list-item-subtitle class="text-caption">Learn from expert instructors</v-list-item-subtitle>
                <template #append>
                  <v-chip size="x-small" variant="tonal">Coming Soon</v-chip>
                </template>
              </v-list-item>
              
              <v-list-item
                class="px-0"
                @click="navigateTo('/community')"
              >
                <template #prepend>
                  <Icon icon="solar:users-group-two-rounded-line-duotone" size="20" class="mr-3" />
                </template>
                <v-list-item-title class="text-body-2">Community Forums</v-list-item-title>
                <v-list-item-subtitle class="text-caption">Connect with other learners</v-list-item-subtitle>
                <template #append>
                  <v-chip size="x-small" variant="tonal">Coming Soon</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
  
  <!-- Loading State -->
  <v-container v-else class="py-16">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6" class="text-center">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
          class="mb-4"
        />
        <h3 class="text-h6 text-grey100">Loading exam details...</h3>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.stat-box {
  text-align: center;
  padding: 1rem;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(var(--v-theme-primary), 0.1);
  }
}

.sticky-card {
  position: sticky;
  top: 80px;
}

@media (max-width: 1280px) {
  .sticky-card {
    position: relative;
    top: auto;
  }
}

.quick-stats {
  background: rgb(var(--v-theme-surface));
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-borderColor), 0.5);
}

.v-expansion-panel {
  &::before {
    opacity: 0 !important;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-borderColor), 0.5);
  }
}

.v-expansion-panel-title {
  padding: 16px 0;
  min-height: 48px;
}

.v-expansion-panel-text {
  padding: 0 0 16px 0;
}

/* Enhanced card styling */
.v-card {
  border: 1px solid rgba(var(--v-theme-borderColor), 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

/* Action button enhancements */
.v-btn {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
}

/* Session indicator styling */
.v-chip {
  font-weight: 600;
  letter-spacing: 0.025em;
}
</style>