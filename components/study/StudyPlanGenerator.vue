<script setup lang="ts">
interface Props {
  examId: string
  examName: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'planGenerated'])

// Form state
const targetAccuracy = ref(80)
const weeksToGoal = ref(4)
const focusAreas = ref([])
const loading = ref(false)
const generatedPlan = ref(null as any)

// Available focus areas
const availableFocusAreas = [
  'Core Concepts',
  'Practice Questions',
  'Test Strategies',
  'Time Management',
  'Weak Topics',
  'Review & Memorization'
]

const generatePlan = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/sessions/study/plan', {
      method: 'POST',
      body: {
        examId: props.examId,
        targetAccuracy: targetAccuracy.value,
        weeksToGoal: weeksToGoal.value,
        focusAreas: focusAreas.value
      }
    })
    
    generatedPlan.value = response.data
    emit('planGenerated', response.data)
    
  } catch (error) {
    console.error('Failed to generate study plan:', error)
  } finally {
    loading.value = false
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'primary'
  }
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'foundation': return 'mdi-book-open-variant'
    case 'practice': return 'mdi-target'
    case 'refinement': return 'mdi-tune'
    case 'time': return 'mdi-clock-outline'
    case 'consistency': return 'mdi-calendar-check'
    case 'intensity': return 'mdi-rocket-launch'
    default: return 'mdi-lightbulb'
  }
}
</script>

<template>
  <v-card max-width="900" class="mx-auto">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-brain</v-icon>
      AI Study Plan Generator
      <v-spacer />
      <v-btn icon variant="text" @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Plan Configuration -->
      <div v-if="!generatedPlan" class="plan-config">
        <div class="mb-4">
          <h3 class="text-h6 mb-2">Generate Your Personalized Study Plan</h3>
          <p class="text-body-2 text-grey-darken-1">
            Based on your current performance and goals, our AI will create a customized study plan for {{ examName }}.
          </p>
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="targetAccuracy"
              label="Target Accuracy (%)"
              type="number"
              min="50"
              max="100"
              variant="outlined"
              hint="Your goal accuracy percentage"
            >
              <template #append-inner>
                <span class="text-caption">%</span>
              </template>
            </v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="weeksToGoal"
              label="Time to Goal"
              :items="[
                { title: '2 weeks', value: 2 },
                { title: '4 weeks', value: 4 },
                { title: '6 weeks', value: 6 },
                { title: '8 weeks', value: 8 },
                { title: '12 weeks', value: 12 }
              ]"
              variant="outlined"
              hint="How many weeks to reach your goal"
            />
          </v-col>
          
          <v-col cols="12">
            <v-select
              v-model="focusAreas"
              label="Focus Areas (Optional)"
              :items="availableFocusAreas"
              multiple
              chips
              variant="outlined"
              hint="Select specific areas you want to focus on"
            />
          </v-col>
        </v-row>

        <div class="text-center mt-4">
          <v-btn
            color="primary"
            size="large"
            :loading="loading"
            @click="generatePlan"
          >
            <v-icon start>mdi-magic</v-icon>
            Generate AI Study Plan
          </v-btn>
        </div>
      </div>

      <!-- Generated Plan -->
      <div v-if="generatedPlan" class="generated-plan">
        <!-- Current Performance Overview -->
        <v-card class="mb-6" color="info" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Your Current Performance
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ generatedPlan.currentPerformance.accuracy }}%</div>
                  <div class="text-caption">Current Accuracy</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ formatTime(generatedPlan.currentPerformance.studyTime) }}</div>
                  <div class="text-caption">Total Study Time</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ generatedPlan.currentPerformance.sessions }}</div>
                  <div class="text-caption">Study Sessions</div>
                </div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold">{{ generatedPlan.currentPerformance.questionsAnswered }}</div>
                  <div class="text-caption">Questions Answered</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- AI Recommendations -->
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-lightbulb</v-icon>
            AI Recommendations
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col 
                v-for="rec in generatedPlan.recommendations" 
                :key="rec.type"
                cols="12" 
                md="6"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <v-icon size="32" :color="getPriorityColor(rec.priority)">
                        {{ getRecommendationIcon(rec.type) }}
                      </v-icon>
                      <v-chip 
                        :color="getPriorityColor(rec.priority)" 
                        size="small" 
                        variant="tonal"
                      >
                        {{ rec.priority }} priority
                      </v-chip>
                    </div>
                    
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">{{ rec.title }}</h4>
                    <p class="text-body-2 text-grey-darken-1 mb-3">{{ rec.description }}</p>
                    
                    <v-chip color="primary" variant="outlined" size="small">
                      <v-icon start size="16">mdi-arrow-right</v-icon>
                      {{ rec.action }}
                    </v-chip>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Weekly Plan -->
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-calendar-week</v-icon>
            {{ weeksToGoal }}-Week Study Plan
          </v-card-title>
          <v-card-text>
            <v-timeline side="end" density="compact">
              <v-timeline-item
                v-for="week in generatedPlan.weeklyPlan"
                :key="week.week"
                :dot-color="week.week === 1 ? 'primary' : 'grey-lighten-1'"
                size="small"
              >
                <template #opposite>
                  <div class="text-caption font-weight-bold">Week {{ week.week }}</div>
                </template>
                
                <v-card variant="outlined">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <h4 class="text-subtitle-1 font-weight-bold">{{ week.focus }}</h4>
                      <v-chip color="success" size="small" variant="tonal">
                        Target: {{ week.targetAccuracy }}%
                      </v-chip>
                    </div>
                    
                    <!-- Daily Goals -->
                    <div class="mb-3">
                      <div class="text-caption font-weight-bold mb-1">Daily Goals:</div>
                      <div class="d-flex flex-wrap gap-2">
                        <v-chip size="x-small" color="primary" variant="outlined">
                          {{ week.dailyGoals.questions }} questions
                        </v-chip>
                        <v-chip size="x-small" color="warning" variant="outlined">
                          {{ week.dailyGoals.studyTimeMinutes }} min study
                        </v-chip>
                        <v-chip size="x-small" color="success" variant="outlined">
                          {{ week.dailyGoals.targetAccuracy }}% accuracy
                        </v-chip>
                      </div>
                    </div>
                    
                    <!-- Key Activities -->
                    <div>
                      <div class="text-caption font-weight-bold mb-1">Key Activities:</div>
                      <ul class="text-body-2">
                        <li v-for="activity in week.keyActivities" :key="activity">
                          {{ activity }}
                        </li>
                      </ul>
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>

    <v-card-actions v-if="generatedPlan">
      <v-spacer />
      <v-btn @click="generatedPlan = null">
        <v-icon start>mdi-arrow-left</v-icon>
        Generate New Plan
      </v-btn>
      <v-btn color="primary" @click="emit('close')">
        Start Studying
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.plan-config {
  max-width: 600px;
  margin: 0 auto;
}

.generated-plan {
  max-width: 100%;
}
</style>