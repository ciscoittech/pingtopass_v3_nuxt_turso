<script setup lang="ts">
interface Props {
  examId: string
  examName: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'startFocusSession'])

// State management
const loading = ref(false)
const analysisData = ref(null as any)
const selectedAreas = ref<string[]>([])
const focusMode = ref('targeted') // 'targeted', 'mixed', 'intensive'

// Fetch weak areas analysis
const loadAnalysis = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/study/weak-areas', {
      query: { examId: props.examId }
    })
    
    if (response.success) {
      analysisData.value = response.data
      
      // Auto-select top 3 weak areas
      if (response.data.weakAreas.length > 0) {
        selectedAreas.value = response.data.weakAreas
          .slice(0, 3)
          .map((area: any) => area.objective.id)
      }
    }
    
  } catch (error) {
    console.error('Failed to load weak areas analysis:', error)
  } finally {
    loading.value = false
  }
}

// Start focus session
const startFocusSession = () => {
  if (selectedAreas.value.length === 0) {
    return
  }
  
  const focusConfig = {
    examId: props.examId,
    objectives: selectedAreas.value,
    mode: focusMode.value,
    sessionType: 'weak_area_focus'
  }
  
  emit('startFocusSession', focusConfig)
}

// Helper functions
const getPerformanceColor = (accuracy: number) => {
  if (accuracy >= 85) return 'success'
  if (accuracy >= 70) return 'warning'
  if (accuracy >= 50) return 'orange'
  return 'error'
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'foundation': return 'mdi-book-open-variant'
    case 'improvement': return 'mdi-chart-line-variant'
    case 'speed': return 'mdi-timer'
    case 'practice': return 'mdi-target'
    case 'maintain': return 'mdi-check-circle'
    default: return 'mdi-lightbulb'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'error'
    case 'improvement': return 'warning'
    case 'maintenance': return 'success'
    default: return 'info'
  }
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  return `${minutes}m`
}

// Load analysis on mount
onMounted(loadAnalysis)
</script>

<template>
  <v-card max-width="1000" class="mx-auto">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="warning">mdi-target-variant</v-icon>
      Weak Area Focus Mode
      <v-spacer />
      <v-btn icon variant="text" @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 mt-4">Analyzing your performance...</p>
      </div>

      <!-- Analysis Results -->
      <div v-else-if="analysisData">
        <!-- Overall Performance -->
        <v-card class="mb-6" color="info" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-pie</v-icon>
            Overall Performance - {{ examName }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ analysisData.overallPerformance.accuracy }}%</div>
                  <div class="text-caption">Overall Accuracy</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ analysisData.overallPerformance.totalQuestions }}</div>
                  <div class="text-caption">Questions Answered</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ formatTime(analysisData.overallPerformance.timeSpent) }}</div>
                  <div class="text-caption">Study Time</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ analysisData.overallPerformance.averageTime }}s</div>
                  <div class="text-caption">Avg. per Question</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Focus Plan -->
        <v-card class="mb-6" :color="getPriorityColor(analysisData.focusPlan.priority)" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-strategy</v-icon>
            Recommended Focus Plan
          </v-card-title>
          <v-card-text>
            <p class="text-h6 mb-3">{{ analysisData.focusPlan.message }}</p>
            <ul class="ml-4">
              <li v-for="rec in analysisData.focusPlan.recommendations" :key="rec" class="mb-1">
                {{ rec }}
              </li>
            </ul>
          </v-card-text>
        </v-card>

        <!-- Weak Areas -->
        <v-card v-if="analysisData.weakAreas.length > 0" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
            Areas Needing Improvement ({{ analysisData.weakAreas.length }})
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col 
                v-for="area in analysisData.weakAreas" 
                :key="area.objective.id"
                cols="12" 
                md="6"
              >
                <v-card 
                  variant="outlined" 
                  class="h-100"
                  :class="{ 'selected-area': selectedAreas.includes(area.objective.id) }"
                  @click="() => {
                    const index = selectedAreas.indexOf(area.objective.id)
                    if (index > -1) {
                      selectedAreas.splice(index, 1)
                    } else {
                      selectedAreas.push(area.objective.id)
                    }
                  }"
                >
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <v-checkbox
                        :model-value="selectedAreas.includes(area.objective.id)"
                        hide-details
                        color="primary"
                      />
                      <v-chip
                        :color="getPerformanceColor(area.performance.accuracy)"
                        size="small"
                        variant="tonal"
                      >
                        {{ area.performance.accuracy }}% accuracy
                      </v-chip>
                    </div>
                    
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">
                      {{ area.objective.title }}
                    </h4>
                    
                    <p class="text-body-2 text-grey-darken-1 mb-3">
                      {{ area.objective.description }}
                    </p>
                    
                    <!-- Performance Stats -->
                    <div class="performance-stats mb-3">
                      <div class="stat-row">
                        <span class="text-body-2">Questions:</span>
                        <span class="font-weight-bold">{{ area.performance.totalQuestions }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="text-body-2">Correct:</span>
                        <span class="font-weight-bold">{{ area.performance.correctAnswers }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="text-body-2">Avg. Time:</span>
                        <span class="font-weight-bold">{{ area.performance.averageTime }}s</span>
                      </div>
                    </div>
                    
                    <!-- Recommendation -->
                    <div class="recommendation">
                      <div class="d-flex align-center mb-1">
                        <v-icon 
                          size="16" 
                          :color="getPerformanceColor(area.performance.accuracy)"
                          class="mr-1"
                        >
                          {{ getRecommendationIcon(area.recommendation.type) }}
                        </v-icon>
                        <span class="text-caption font-weight-bold">Recommendation:</span>
                      </div>
                      <p class="text-caption">{{ area.recommendation.message }}</p>
                      <p class="text-caption font-weight-bold">{{ area.recommendation.action }}</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Strong Areas (Optional) -->
        <v-card v-if="analysisData.strongAreas.length > 0" class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
            Your Strong Areas ({{ analysisData.strongAreas.length }})
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col 
                v-for="area in analysisData.strongAreas.slice(0, 4)" 
                :key="area.objective.id"
                cols="12" 
                sm="6" 
                md="3"
              >
                <v-card color="success" variant="tonal">
                  <v-card-text class="pa-3 text-center">
                    <v-icon size="32" color="success" class="mb-2">mdi-trophy</v-icon>
                    <h4 class="text-subtitle-2 font-weight-bold mb-1">
                      {{ area.objective.title }}
                    </h4>
                    <div class="text-h6 font-weight-bold">{{ area.performance.accuracy }}%</div>
                    <div class="text-caption">{{ area.performance.totalQuestions }} questions</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Focus Session Configuration -->
        <v-card v-if="selectedAreas.length > 0">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-play-circle</v-icon>
            Start Focus Session
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <p class="text-body-1 mb-2">
                Selected {{ selectedAreas.length }} area(s) for focused practice.
              </p>
              
              <v-select
                v-model="focusMode"
                label="Focus Mode"
                :items="[
                  { title: 'Targeted Practice - Focus only on selected weak areas', value: 'targeted' },
                  { title: 'Mixed Practice - 70% weak areas, 30% review', value: 'mixed' },
                  { title: 'Intensive Mode - Rapid-fire questions from weak areas', value: 'intensive' }
                ]"
                variant="outlined"
                class="mb-3"
              />
              
              <div class="focus-mode-description">
                <div v-if="focusMode === 'targeted'" class="text-body-2 text-grey-darken-1">
                  Focus exclusively on your selected weak areas with detailed explanations.
                </div>
                <div v-else-if="focusMode === 'mixed'" class="text-body-2 text-grey-darken-1">
                  Combine weak area practice with review questions to maintain overall knowledge.
                </div>
                <div v-else-if="focusMode === 'intensive'" class="text-body-2 text-grey-darken-1">
                  High-volume practice with time pressure to build speed and confidence.
                </div>
              </div>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer />
            <v-btn @click="emit('close')">Cancel</v-btn>
            <v-btn 
              color="primary" 
              variant="elevated"
              @click="startFocusSession"
            >
              <v-icon start>mdi-play</v-icon>
              Start Focus Session
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- No Weak Areas -->
        <v-card v-else-if="analysisData.weakAreas.length === 0" color="success" variant="tonal">
          <v-card-text class="text-center pa-6">
            <v-icon size="64" color="success" class="mb-4">mdi-trophy</v-icon>
            <h3 class="text-h5 mb-2">Excellent Performance!</h3>
            <p class="text-body-1">
              No significant weak areas detected. You're performing well across all objectives!
            </p>
            <v-btn color="success" class="mt-3" @click="emit('close')">
              Continue Regular Study
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.selected-area {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.performance-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation {
  border-left: 3px solid rgba(var(--v-theme-warning), 0.5);
  padding-left: 8px;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 0 4px 4px 0;
  padding: 8px;
}

.focus-mode-description {
  background: rgba(var(--v-theme-surface), 0.5);
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid rgb(var(--v-theme-primary));
}
</style>